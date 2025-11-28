from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import json
import os
import shutil
import yaml
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

# CORS configuration to allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ... (existing code) ...

@app.post("/api/envs/import")
def import_environment(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    python_version: str = Form("3.9")
):
    try:
        # Save uploaded file temporarily
        temp_filename = f"temp_{file.filename}"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        try:
            if file.filename.endswith('.yml') or file.filename.endswith('.yaml'):
                # Conda environment file
                # For YAML files, extract the name from the file if not provided
                if name:
                    # Check if environment already exists
                    existing_envs = get_existing_env_names()
                    if name in existing_envs:
                        raise HTTPException(status_code=400, detail=f"Environment '{name}' already exists. Please choose a different name.")
                
                cmd = ["conda", "env", "create", "-f", temp_filename]
                if name:
                    cmd.extend(["-n", name])
                
                subprocess.run(cmd, capture_output=True, text=True, check=True)
                return {"message": "Environment imported successfully from YAML."}
            
            elif file.filename.endswith('.txt'):
                # Requirements file
                if not name:
                    raise HTTPException(status_code=400, detail="Environment name is required for requirements.txt import")
                
                # Check if environment already exists
                existing_envs = get_existing_env_names()
                if name in existing_envs:
                    raise HTTPException(status_code=400, detail=f"Environment '{name}' already exists. Please choose a different name.")
                
                # 1. Create environment
                subprocess.run(
                    ["conda", "create", "-n", name, f"python={python_version}", "-y"],
                    capture_output=True,
                    text=True,
                    check=True
                )
                
                # 2. Install requirements using pip
                # We use 'conda run' to execute pip inside the new environment
                subprocess.run(
                    ["conda", "run", "-n", name, "pip", "install", "-r", temp_filename],
                    capture_output=True,
                    text=True,
                    check=True
                )
                return {"message": f"Environment '{name}' created and requirements installed."}
            
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format. Use .yml, .yaml, or .txt")
                
        finally:
            # Cleanup temp file
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
                
    except subprocess.CalledProcessError as e:
        # Cleanup if failed (though finally block handles it, we might want to delete the partial env? 
        # For now just report error)
        raise HTTPException(status_code=500, detail=f"Import failed: {e.stderr}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

class Environment(BaseModel):
    name: str
    path: str

@app.get("/api/envs")
def get_environments():
    try:
        # Run conda env list with json output
        result = subprocess.run(
            ["conda", "env", "list", "--json"],
            capture_output=True,
            text=True,
            check=True
        )
        data = json.loads(result.stdout)
        
        # Get conda root prefix to identify base environment
        info_res = subprocess.run(
            ["conda", "info", "--json"],
            capture_output=True,
            text=True,
            check=True
        )
        info_data = json.loads(info_res.stdout)
        root_prefix = info_data.get("root_prefix")

        envs = []
        for path in data.get("envs", []):
            # Extract name from path
            if path == root_prefix:
                name = "base"
            else:
                name = path.split("/")[-1]
            
            # Get Size
            size = "N/A"
            try:
                # Use du -sh to get size
                du_res = subprocess.run(
                    ["du", "-sh", path],
                    capture_output=True,
                    text=True
                )
                if du_res.returncode == 0:
                    size = du_res.stdout.split()[0]
            except Exception:
                pass

            # Get Last Modified
            last_modified = "N/A"
            try:
                # Use os.path.getmtime
                mtime = os.path.getmtime(path)
                last_modified = datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M')
            except Exception:
                pass

            # Get Python Version
            python_version = "N/A"
            try:
                # Use direct path to python executable instead of conda run
                python_path = os.path.join(path, "bin", "python")
                if os.path.exists(python_path):
                    py_res = subprocess.run(
                        [python_path, "--version"],
                        capture_output=True,
                        text=True,
                        timeout=5
                    )
                    if py_res.returncode == 0:
                        # Output is like "Python 3.11.14"
                        version_str = py_res.stdout.strip() or py_res.stderr.strip()
                        if version_str.startswith("Python "):
                            python_version = version_str.replace("Python ", "")
                        print(f"Environment '{name}': detected Python version = {python_version}")
                    else:
                        print(f"Environment '{name}': failed to get Python version, returncode = {py_res.returncode}")
                else:
                    print(f"Environment '{name}': Python executable not found at {python_path}")
            except Exception as e:
                print(f"Environment '{name}': exception while getting Python version: {e}")
                pass

            envs.append({
                "name": name, 
                "path": path,
                "size": size,
                "last_modified": last_modified,
                "python_version": python_version
            })
            
        return envs
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Failed to list environments: {e.stderr}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/envs/{name}")
def delete_environment(name: str):
    try:
        # Prevent deleting base environment
        if name == "base":
             raise HTTPException(status_code=400, detail="Cannot delete 'base' environment.")

        # Run conda remove --name <name> --all -y
        subprocess.run(
            ["conda", "remove", "--name", name, "--all", "-y"],
            capture_output=True,
            text=True,
            check=True
        )
        return {"message": f"Environment '{name}' deleted successfully."}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete environment: {e.stderr}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/envs/{name}/packages")
def get_packages(name: str):
    try:
        # Run conda list -n <name> --json
        result = subprocess.run(
            ["conda", "list", "-n", name, "--json"],
            capture_output=True,
            text=True,
            check=True
        )
        packages = json.loads(result.stdout)
        
        return packages
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Failed to list packages: {e.stderr}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CreateEnvRequest(BaseModel):
    name: str
    python_version: str = "3.9"

def get_existing_env_names():
    """Get list of existing environment names"""
    try:
        result = subprocess.run(
            ["conda", "env", "list", "--json"],
            capture_output=True,
            text=True,
            check=True
        )
        data = json.loads(result.stdout)
        
        # Get conda root prefix to identify base environment
        info_res = subprocess.run(
            ["conda", "info", "--json"],
            capture_output=True,
            text=True,
            check=True
        )
        info_data = json.loads(info_res.stdout)
        root_prefix = info_data.get("root_prefix")
        
        env_names = []
        for path in data.get("envs", []):
            if path == root_prefix:
                env_names.append("base")
            else:
                env_names.append(path.split("/")[-1])
        
        return env_names
    except Exception:
        return []

@app.post("/api/envs")
def create_environment(request: CreateEnvRequest):
    try:
        # Check if environment already exists
        existing_envs = get_existing_env_names()
        if request.name in existing_envs:
            raise HTTPException(status_code=400, detail=f"Environment '{request.name}' already exists. Please choose a different name.")
        
        print(f"Creating environment '{request.name}' with Python version: {request.python_version}")
        # Use conda-forge channel to ensure the requested Python version is available
        result = subprocess.run(
            ["conda", "create", "-n", request.name, f"python={request.python_version}", "-c", "conda-forge", "-y"],
            capture_output=True,
            text=True,
            check=True
        )
        print(f"Conda create output: {result.stdout}")
        if result.stderr:
            print(f"Conda create stderr: {result.stderr}")
        return {"message": f"Environment '{request.name}' created successfully."}
    except subprocess.CalledProcessError as e:
        print(f"Error creating environment: {e.stderr}")
        raise HTTPException(status_code=500, detail=f"Failed to create environment: {e.stderr}")
    except Exception as e:
        print(f"Exception creating environment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class CloneEnvRequest(BaseModel):
    new_name: str

@app.post("/api/envs/{name}/clone")
def clone_environment(name: str, request: CloneEnvRequest):
    try:
        # Check if new environment name already exists
        existing_envs = get_existing_env_names()
        if request.new_name in existing_envs:
            raise HTTPException(status_code=400, detail=f"Environment '{request.new_name}' already exists. Please choose a different name.")
        
        subprocess.run(
            ["conda", "create", "--name", request.new_name, "--clone", name, "-y"],
            capture_output=True,
            text=True,
            check=True
        )
        return {"message": f"Environment '{name}' cloned to '{request.new_name}' successfully."}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Failed to clone environment: {e.stderr}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/envs/{name}/export")
def export_environment(name: str):
    try:
        result = subprocess.run(
            ["conda", "env", "export", "-n", name],
            capture_output=True,
            text=True,
            check=True
        )
        return {"yaml": result.stdout}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Failed to export environment: {e.stderr}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/envs/{name}/size")
def get_environment_size(name: str):
    try:
        # Get path first
        result = subprocess.run(
            ["conda", "env", "list", "--json"],
            capture_output=True,
            text=True,
            check=True
        )
        data = json.loads(result.stdout)
        env_path = None
        for path in data.get("envs", []):
            if path.split("/")[-1] == name:
                env_path = path
                break
        
        if not env_path:
             # Fallback for base or if name inference fails, try to guess or just fail
             if name == 'base':
                 # Base is usually the first one or root of others
                 env_path = data.get("envs", [])[0] # Assumption
             else:
                 raise HTTPException(status_code=404, detail="Environment path not found")

        # Use du -sh to get size
        du_res = subprocess.run(
            ["du", "-sh", env_path],
            capture_output=True,
            text=True,
            check=True
        )
        size = du_res.stdout.split()[0]
        return {"size": size}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Failed to get size: {e.stderr}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class InstallPackageRequest(BaseModel):
    package: str

@app.post("/api/envs/{name}/packages")
def install_package(name: str, request: InstallPackageRequest):
    try:
        subprocess.run(
            ["conda", "install", "-n", name, request.package, "-y"],
            capture_output=True,
            text=True,
            check=True
        )
        return {"message": f"Package '{request.package}' installed successfully."}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Failed to install package: {e.stderr}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/envs/{name}/packages/file")
def install_packages_from_file(name: str, file: UploadFile = File(...)):
    try:
        # Save uploaded file temporarily
        temp_filename = f"temp_pkg_{file.filename}"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        try:
            if file.filename.endswith('.txt'):
                # Requirements file: pip install -r
                subprocess.run(
                    ["conda", "run", "-n", name, "pip", "install", "-r", temp_filename],
                    capture_output=True,
                    text=True,
                    check=True
                )
                return {"message": f"Packages from '{file.filename}' installed successfully (pip)."}
            
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format. Use .txt (requirements)")
                
        finally:
            # Cleanup temp file
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
                
    except subprocess.CalledProcessError as e:
        error_msg = f"Failed to install packages from file: {e.stderr}"
        print(f"ERROR: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        error_msg = f"Exception in install_packages_from_file: {str(e)}"
        print(f"ERROR: {error_msg}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/envs/{name}/packages/{package}")
def uninstall_package(name: str, package: str):
    try:
        # Try conda remove first
        subprocess.run(
            ["conda", "remove", "-n", name, package, "-y"],
            capture_output=True,
            text=True,
            check=True
        )
        return {"message": f"Package '{package}' uninstalled successfully (conda)."}
    except subprocess.CalledProcessError:
        # If conda remove fails, try pip uninstall
        try:
            subprocess.run(
                ["conda", "run", "-n", name, "pip", "uninstall", package, "-y"],
                capture_output=True,
                text=True,
                check=True
            )
            return {"message": f"Package '{package}' uninstalled successfully (pip)."}
        except subprocess.CalledProcessError as e:
            raise HTTPException(status_code=500, detail=f"Failed to uninstall package: {e.stderr}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
