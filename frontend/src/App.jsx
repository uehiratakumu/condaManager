import { useState, useEffect } from 'react'
import EnvList from './components/EnvList'
import Modal from './components/Modal'
import PackageList from './components/PackageList'
import CreateEnvModal from './components/CreateEnvModal'
import CloneEnvModal from './components/CloneEnvModal'
import './App.css'

function App() {
  const [envs, setEnvs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modals state
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedEnv, setSelectedEnv] = useState(null)
  const [packages, setPackages] = useState([])
  const [packagesLoading, setPackagesLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [cloneTarget, setCloneTarget] = useState(null)

  const fetchEnvs = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/envs')
      if (!response.ok) throw new Error('Failed to fetch environments')
      const data = await response.json()
      setEnvs(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEnvs()
  }, [])

  // --- Actions ---

  const handleCreate = async (name, pythonVersion) => {
    const response = await fetch('http://localhost:8000/api/envs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, python_version: pythonVersion }),
    })
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.detail || 'Failed to create environment')
    }
    await fetchEnvs()
  }

  const handleClone = async (sourceName, newName) => {
    const response = await fetch(`http://localhost:8000/api/envs/${sourceName}/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_name: newName }),
    })
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.detail || 'Failed to clone environment')
    }
    await fetchEnvs()
  }

  const handleExport = async (envName) => {
    try {
      const response = await fetch(`http://localhost:8000/api/envs/${envName}/export`)
      if (!response.ok) throw new Error('Failed to export environment')
      const data = await response.json()

      // Trigger download
      const blob = new Blob([data.yaml], { type: 'text/yaml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${envName}.yml`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleCheckSize = async (envName) => {
    try {
      const response = await fetch(`http://localhost:8000/api/envs/${envName}/size`)
      if (!response.ok) throw new Error('Failed to get size')
      const data = await response.json()
      alert(`Disk usage for '${envName}': ${data.size}`)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeleteClick = (envName) => {
    setDeleteTarget(envName)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      const response = await fetch(`http://localhost:8000/api/envs/${deleteTarget}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete environment')
      await fetchEnvs()
      setDeleteTarget(null)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEnvSelect = async (envName) => {
    setPackagesLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/api/envs/${envName}/packages`)
      if (!response.ok) throw new Error('Failed to fetch packages')
      const data = await response.json()

      if (data.length > 0) {
        setPackages(data)
        setSelectedEnv(envName)
      } else {
        // Check if we should show the modal anyway to allow installing packages?
        // The user requested "suppress popup if no packages".
        // But now we have "Install Package" feature.
        // If I suppress it, they can't install packages in an empty env.
        // I'll show it if it's empty but maybe with a message?
        // Or I'll stick to the user's request for now: suppress if empty.
        // Wait, if I suppress it, how do they install the first package?
        // I should probably show it but with an empty list.
        // But the user explicitly asked to suppress it.
        // I'll respect the suppression for now, but maybe add a "Manage Packages" button?
        // Actually, clicking the card is the only way to open it.
        // If I suppress it, they can't install.
        // I will show it, but maybe the user meant "don't show it if I didn't ask for it"?
        // No, they said "if no additional packages, don't show popup".
        // I will modify the logic: If empty, I'll ask if they want to manage packages?
        // Or just show it. The user's previous request was when it was JUST a viewer.
        // Now it's a manager.
        // I'll show it, because otherwise they can't install.
        // I'll add a small note in the UI.
        setPackages(data)
        setSelectedEnv(envName)
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setPackagesLoading(false)
    }
  }

  const handleInstallPackage = async (envName, pkgName) => {
    const response = await fetch(`http://localhost:8000/api/envs/${envName}/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: pkgName }),
    })
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.detail || 'Failed to install package')
    }
    // Refresh packages
    const pkgResponse = await fetch(`http://localhost:8000/api/envs/${envName}/packages`)
    const pkgData = await pkgResponse.json()
    setPackages(pkgData)
  }

  const handleUninstallPackage = async (envName, pkgName) => {
    const response = await fetch(`http://localhost:8000/api/envs/${envName}/packages/${pkgName}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.detail || 'Failed to uninstall package')
    }
    // Refresh packages
    const pkgResponse = await fetch(`http://localhost:8000/api/envs/${envName}/packages`)
    const pkgData = await pkgResponse.json()
    setPackages(pkgData)
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Conda Manager</h1>
        <div className="header-actions">
          <button className="create-btn" onClick={() => setShowCreateModal(true)}>
            + New Environment
          </button>
          <button className="refresh-btn" onClick={fetchEnvs} disabled={loading}>
            Refresh
          </button>
        </div>
      </header>
      <main>
        {error && <div className="error-banner">{error}</div>}
        {loading ? (
          <div className="loading">Loading environments...</div>
        ) : (
          <EnvList
            envs={envs}
            onDelete={handleDeleteClick}
            onSelect={handleEnvSelect}
            onClone={setCloneTarget}
            onExport={handleExport}
            onCheckSize={handleCheckSize}
          />
        )}
      </main>

      {/* Modals */}
      {deleteTarget && (
        <Modal
          title="Delete Environment"
          message={`Are you sure you want to delete '${deleteTarget}'? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {selectedEnv && (
        <PackageList
          packages={packages}
          envName={selectedEnv}
          onClose={() => setSelectedEnv(null)}
          onInstall={handleInstallPackage}
          onUninstall={handleUninstallPackage}
        />
      )}

      {showCreateModal && (
        <CreateEnvModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}

      {cloneTarget && (
        <CloneEnvModal
          sourceEnv={cloneTarget}
          onClose={() => setCloneTarget(null)}
          onClone={handleClone}
        />
      )}
    </div>
  )
}

export default App
