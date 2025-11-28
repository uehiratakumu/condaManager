import { useState } from 'react'
import Modal from './Modal'

function PackageList({ packages, envName, onClose, onInstall, onUninstall, onRefresh }) {
    const [newPackage, setNewPackage] = useState('')
    const [packageVersion, setPackageVersion] = useState('')
    const [specifyVersion, setSpecifyVersion] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [showInstallSection, setShowInstallSection] = useState(false)
    const [sortBy, setSortBy] = useState('name') // 'name' or 'build_string'
    const [sortOrder, setSortOrder] = useState('asc') // 'asc' or 'desc'
    const [installing, setInstalling] = useState(false)
    const [confirmState, setConfirmState] = useState(null) // { type: 'install'|'uninstall'|'file-install', pkg: string, file: File }
    const [messageModal, setMessageModal] = useState(null) // { title, message }
    const [selectedFile, setSelectedFile] = useState(null)

    const filteredPackages = packages
        .filter(pkg => pkg.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            let valueA, valueB
            if (sortBy === 'name') {
                valueA = a.name.toLowerCase()
                valueB = b.name.toLowerCase()
            } else if (sortBy === 'build_string') {
                valueA = a.build_string.toLowerCase()
                valueB = b.build_string.toLowerCase()
            }

            if (sortOrder === 'asc') {
                return valueA < valueB ? -1 : valueA > valueB ? 1 : 0
            } else {
                return valueA > valueB ? -1 : valueA < valueB ? 1 : 0
            }
        })

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(column)
            setSortOrder('asc')
        }
    }

    const handleInstallClick = (e) => {
        e.preventDefault()
        if (!newPackage) return

        let pkgToInstall = newPackage
        if (specifyVersion && packageVersion) {
            pkgToInstall = `${newPackage}=${packageVersion}`
        }

        setConfirmState({ type: 'install', pkg: pkgToInstall })
    }

    const handleUninstallClick = (pkgName) => {
        setConfirmState({ type: 'uninstall', pkg: pkgName })
    }

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (file) {
            setSelectedFile(file)
        }
    }

    const handleFileInstallClick = () => {
        if (!selectedFile) return
        setConfirmState({ type: 'file-install', file: selectedFile })
    }

    const proceedAction = async () => {
        if (!confirmState) return

        const { type, pkg, file } = confirmState
        setConfirmState(null) // Close confirm modal

        if (type === 'install') {
            setInstalling(true)
            try {
                await onInstall(envName, pkg)
                setNewPackage('')
                setPackageVersion('')
                setSpecifyVersion(false)
                setMessageModal({ title: 'Success', message: `Package '${pkg}' installed successfully.` })
            } catch (err) {
                setMessageModal({ title: 'Error', message: err.message })
            } finally {
                setInstalling(false)
            }
        } else if (type === 'uninstall') {
            try {
                await onUninstall(envName, pkg)
                setMessageModal({ title: 'Success', message: `Package '${pkg}' uninstalled successfully.` })
            } catch (err) {
                setMessageModal({ title: 'Error', message: err.message })
            }
        } else if (type === 'file-install') {
            setInstalling(true)
            try {
                const formData = new FormData()
                formData.append('file', file)

                const response = await fetch(`http://localhost:8000/api/envs/${envName}/packages/file`, {
                    method: 'POST',
                    body: formData
                })

                if (!response.ok) {
                    const err = await response.json()
                    throw new Error(err.detail || 'Failed to upload file')
                }

                const data = await response.json()
                if (onRefresh) onRefresh()
                setSelectedFile(null)
                setMessageModal({ title: 'Success', message: data.message })
            } catch (err) {
                setMessageModal({ title: 'Error', message: err.message })
            } finally {
                setInstalling(false)
            }
        }
    }

    return (
        <>
            <div className="modal-overlay">
                <div className="modal-content package-list-modal">
                    <div className="modal-header">
                        <h2>Manage Packages: {envName}</h2>
                        <button className="close-btn" onClick={onClose}>&times;</button>
                    </div>

                    {/* Install Section */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <h3 className="section-title" style={{ margin: 0 }}>📦 Install New Packages</h3>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={showInstallSection}
                                    onChange={(e) => setShowInstallSection(e.target.checked)}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>

                        {showInstallSection && (
                            <div className="install-container">
                                {/* Manual Install */}
                                <form onSubmit={handleInstallClick} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                                        <input
                                            type="text"
                                            placeholder="Package name (e.g. numpy)"
                                            value={newPackage}
                                            onChange={(e) => setNewPackage(e.target.value)}
                                            disabled={installing}
                                            className="search-input" // Use same style as search input
                                            style={{ flex: 1 }}
                                        />
                                        <button type="submit" className="create-btn" disabled={installing || !newPackage}>
                                            {installing ? 'Installing...' : 'Install'}
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', minHeight: '38px' }}>
                                        <label
                                            htmlFor="specify-version"
                                            style={{
                                                fontSize: '0.9rem',
                                                color: 'var(--text-primary)',
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                fontWeight: '500',
                                                marginRight: '-0.25rem'
                                            }}
                                        >
                                            Specify Version
                                        </label>

                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                id="specify-version"
                                                checked={specifyVersion}
                                                onChange={(e) => setSpecifyVersion(e.target.checked)}
                                                disabled={installing}
                                            />
                                            <span className="slider"></span>
                                        </label>

                                        {specifyVersion && (
                                            <input
                                                type="text"
                                                placeholder="e.g. 1.21.0"
                                                value={packageVersion}
                                                onChange={(e) => setPackageVersion(e.target.value)}
                                                disabled={installing}
                                                className="search-input"
                                                style={{ width: '120px', padding: '0.4rem', fontSize: '0.9rem', marginLeft: '0.5rem' }}
                                            />
                                        )}
                                    </div>
                                </form>

                                <div className="divider"><span>OR</span></div>

                                {/* File Install */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div className="file-input-wrapper">
                                        <input
                                            type="file"
                                            accept=".txt"
                                            onChange={handleFileSelect}
                                            disabled={installing}
                                        />
                                        <div className="file-input-label">
                                            {selectedFile ? selectedFile.name : 'Select requirements.txt'}
                                        </div>
                                    </div>
                                    {selectedFile && (
                                        <button
                                            className="create-btn"
                                            onClick={handleFileInstallClick}
                                            disabled={installing}
                                            style={{ width: '100%' }}
                                        >
                                            {installing ? 'Installing...' : 'Install from File'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* List Section */}
                    <div className="list-section">
                        <h3 className="section-title">📋 Installed Packages</h3>

                        <div style={{ marginBottom: '1rem' }}>
                            <input
                                type="text"
                                placeholder="🔍 Search packages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="package-list-container">
                            {filteredPackages.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
                                    {packages.length === 0 ? 'No packages found.' : 'No matching packages found.'}
                                </p>
                            ) : (
                                <table className="package-table">
                                    <thead>
                                        <tr>
                                            <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th>Version</th>
                                            <th onClick={() => handleSort('build_string')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                                Build {sortBy === 'build_string' && (sortOrder === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPackages.map((pkg, index) => (
                                            <tr key={`${pkg.name}-${index}`}>
                                                <td>{pkg.name}</td>
                                                <td>{pkg.version}</td>
                                                <td>{pkg.build_string}</td>
                                                <td>
                                                    <button
                                                        className="delete-btn small-btn"
                                                        onClick={() => handleUninstallClick(pkg.name)}
                                                    >
                                                        Uninstall
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {confirmState && (
                <Modal
                    title={
                        confirmState.type === 'install' ? 'Install Package' :
                            confirmState.type === 'uninstall' ? 'Uninstall Package' :
                                'Install from File'
                    }
                    message={
                        confirmState.type === 'install' ? `Are you sure you want to install '${confirmState.pkg}' in '${envName}'?` :
                            confirmState.type === 'uninstall' ? `Are you sure you want to uninstall '${confirmState.pkg}' from '${envName}'?` :
                                `Are you sure you want to install packages from '${confirmState.file.name}' into '${envName}'?`
                    }
                    onConfirm={proceedAction}
                    onCancel={() => setConfirmState(null)}
                    confirmText={
                        confirmState.type === 'install' ? 'Install' :
                            confirmState.type === 'uninstall' ? 'Uninstall' :
                                'Install'
                    }
                    isDanger={confirmState.type === 'uninstall'}
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
        </>
    )
}

export default PackageList
