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
                cmd = ["conda", "env", "create", "-f", temp_filename]
                if name:
                    cmd.extend(["-n", name])
                
                subprocess.run(cmd, capture_output=True, text=True, check=True)
                return {"message": "Environment imported successfully from YAML."}
            
            elif file.filename.endswith('.txt'):
                # Requirements file
                if not name:
                    raise HTTPException(status_code=400, detail="Environment name is required for requirements.txt import")
                
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
        
        envs = []
        for path in data.get("envs", []):
            # Extract name from path
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
        
        # Define default packages to exclude
        # This list is based on a standard python environment
        excluded_packages = {
            "bzip2", "ca-certificates", "libffi", "ncurses", "openssl", "pip", "python", 
            "readline", "setuptools", "sqlite", "tk", "wheel", "xz", "zlib", 
            "libsqlite", "libzlib", "tzdata", "liblzma", "libuuid", "libnsl", "libtirpc"
        }
        
        filtered_packages = [
            pkg for pkg in packages 
            if pkg["name"] not in excluded_packages and not pkg["name"].startswith("python-")
        ]
        
        return filtered_packages
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Failed to list packages: {e.stderr}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CreateEnvRequest(BaseModel):
    name: str
    python_version: str = "3.9"

@app.post("/api/envs")
def create_environment(request: CreateEnvRequest):
    try:
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
            
            elif file.filename.endswith('.yml') or file.filename.endswith('.yaml'):
                # Environment file: parse and install only dependencies, excluding python
                with open(temp_filename, 'r') as f:
                    env_data = yaml.safe_load(f)
                
                # Extract dependencies
                dependencies = env_data.get('dependencies', [])
                
                # Separate conda and pip packages
                conda_packages = []
                pip_packages = []
                
                for dep in dependencies:
                    if isinstance(dep, dict) and 'pip' in dep:
                        # Pip dependencies
                        pip_packages.extend(dep['pip'])
                    elif isinstance(dep, str):
                        # Conda dependencies - exclude python and python-related packages
                        dep_lower = dep.lower()
                        if not any([
                            dep_lower.startswith('python='),
                            dep_lower.startswith('python '),
                            dep_lower == 'python',
                            dep_lower.startswith('python_abi'),
                            dep_lower.startswith('python-'),
                        ]):
                            # Keep package name and version, but remove build string
                            # Format: package=version=build -> package=version
                            parts = dep.split('=')
                            if len(parts) >= 2:
                                pkg_with_version = f"{parts[0]}={parts[1]}"
                                conda_packages.append(pkg_with_version)
                            else:
                                conda_packages.append(dep)
                
                # Install conda packages
                if conda_packages:
                    print(f"Installing conda packages: {conda_packages}")
                    subprocess.run(
                        ["conda", "install", "-n", name, "-y"] + conda_packages,
                        capture_output=True,
                        text=True,
                        check=True
                    )
                
                # Install pip packages
                if pip_packages:
                    print(f"Installing pip packages: {pip_packages}")
                    subprocess.run(
                        ["conda", "run", "-n", name, "pip", "install"] + pip_packages,
                        capture_output=True,
                        text=True,
                        check=True
                    )
                
                installed_count = len(conda_packages) + len(pip_packages)
                return {"message": f"{installed_count} packages from '{file.filename}' installed successfully (Python version preserved)."}
            
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format. Use .txt (requirements) or .yml (conda env)")
                
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
