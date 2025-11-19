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
  const [messageModal, setMessageModal] = useState(null) // { title, message }
  const [actionLoading, setActionLoading] = useState(false)

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
    // Create logic is handled in CreateEnvModal, but we might want to show success here?
    // Actually CreateEnvModal calls this.
    // Let's make this function return promise so modal can handle loading.
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
    setMessageModal({ title: 'Success', message: `Environment '${name}' created successfully.` })
  }

  const handleClone = async (sourceName, newName) => {
    setActionLoading(true)
    try {
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
      setCloneTarget(null)
      setMessageModal({ title: 'Success', message: `Environment '${sourceName}' cloned to '${newName}' successfully.` })
    } catch (err) {
      setMessageModal({ title: 'Error', message: err.message })
    } finally {
      setActionLoading(false)
    }
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
      setMessageModal({ title: 'Error', message: err.message })
    }
  }

  const handleDeleteClick = (envName) => {
    setDeleteTarget(envName)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setActionLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/api/envs/${deleteTarget}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete environment')
      await fetchEnvs()
      setDeleteTarget(null)
      setMessageModal({ title: 'Success', message: `Environment '${deleteTarget}' deleted successfully.` })
    } catch (err) {
      setMessageModal({ title: 'Error', message: err.message })
    } finally {
      setActionLoading(false)
    }
  }

  const fetchPackages = async (envName) => {
    setPackagesLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/api/envs/${envName}/packages`)
      if (!response.ok) throw new Error('Failed to fetch packages')
      const data = await response.json()
      setPackages(data)
    } catch (err) {
      setMessageModal({ title: 'Error', message: err.message })
    } finally {
      setPackagesLoading(false)
    }
  }

  const handleEnvSelect = async (envName) => {
    await fetchPackages(envName)
    setSelectedEnv(envName)
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
          confirmText="Delete"
          isLoading={actionLoading}
        />
      )}

      {selectedEnv && (
        <PackageList
          packages={packages}
          envName={selectedEnv}
          onClose={() => setSelectedEnv(null)}
          onInstall={handleInstallPackage}
          onUninstall={handleUninstallPackage}
          onRefresh={() => fetchPackages(selectedEnv)}
        />
      )}

      {showCreateModal && (
        <CreateEnvModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
          onSuccess={fetchEnvs}
        />
      )}

      {cloneTarget && (
        <CloneEnvModal
          sourceEnv={cloneTarget}
          onClose={() => setCloneTarget(null)}
          onClone={handleClone}
          isLoading={actionLoading}
        />
      )}

      {messageModal && (
        <Modal
          title={messageModal.title}
          message={messageModal.message}
          onConfirm={() => setMessageModal(null)}
          onCancel={() => setMessageModal(null)}
          confirmText="OK"
        />
      )}
    </div>
  )
}
export default App
