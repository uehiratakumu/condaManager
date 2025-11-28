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
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'
  const [sortBy, setSortBy] = useState('name') // 'name', 'python_version', 'size', 'last_modified'
  const [sortOrder, setSortOrder] = useState('asc') // 'asc' or 'desc'

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

  // Sort environments
  const sortedEnvs = [...envs].sort((a, b) => {
    let aVal = a[sortBy]
    let bVal = b[sortBy]

    // Handle size sorting (convert to bytes for comparison)
    if (sortBy === 'size') {
      const parseSize = (size) => {
        if (size === 'N/A') return 0
        const units = { 'B': 1, 'K': 1024, 'M': 1024 * 1024, 'G': 1024 * 1024 * 1024 }
        const match = size.match(/^([\d.]+)([BKMG])/)
        if (!match) return 0
        return parseFloat(match[1]) * (units[match[2]] || 1)
      }
      aVal = parseSize(aVal)
      bVal = parseSize(bVal)
    }

    // Handle string comparison
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

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
      <header>
        <h1>🐍 Conda Environment Manager</h1>
        <div className="header-actions">
          <button className="create-btn" onClick={() => setShowCreateModal(true)}>
            + Create Environment
          </button>
          <button className="refresh-btn" onClick={fetchEnvs} title="Refresh">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
          <div className="sort-dropdown">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field)
                setSortOrder(order)
              }}
              className="sort-select"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="python_version-asc">Python (Low-High)</option>
              <option value="python_version-desc">Python (High-Low)</option>
              <option value="size-asc">Size (Small-Large)</option>
              <option value="size-desc">Size (Large-Small)</option>
              <option value="last_modified-asc">Date (Old-New)</option>
              <option value="last_modified-desc">Date (New-Old)</option>
            </select>
          </div>
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ⊞
            </button>
            <button
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              ☰
            </button>
          </div>
        </div>
      </header>
      <main>
        {error && <div className="error-banner">{error}</div>}
        {loading ? (
          <div className="loading">Loading environments...</div>
        ) : (
          <EnvList
            envs={sortedEnvs}
            onDelete={handleDeleteClick}
            onSelect={handleEnvSelect}
            onClone={setCloneTarget}
            onExport={handleExport}
            viewMode={viewMode}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
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
