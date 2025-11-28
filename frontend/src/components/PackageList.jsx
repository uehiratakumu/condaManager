import { useState } from 'react'
import Modal from './Modal'

function PackageList({ packages, envName, onClose, onInstall, onUninstall, onRefresh }) {
    const [newPackage, setNewPackage] = useState('')
    const [installing, setInstalling] = useState(false)
    const [confirmState, setConfirmState] = useState(null) // { type: 'install'|'uninstall'|'file-install', pkg: string, file: File }
    const [messageModal, setMessageModal] = useState(null) // { title, message }
    const [selectedFile, setSelectedFile] = useState(null)

    const handleInstallClick = (e) => {
        e.preventDefault()
        if (!newPackage) return
        setConfirmState({ type: 'install', pkg: newPackage })
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
                        <h2>Packages in {envName}</h2>
                        <button className="close-btn" onClick={onClose}>&times;</button>
                    </div>

                    <form className="install-form" onSubmit={handleInstallClick}>
                        <input
                            type="text"
                            placeholder="Package name (e.g. numpy)"
                            value={newPackage}
                            onChange={(e) => setNewPackage(e.target.value)}
                            disabled={installing}
                        />
                        <button type="submit" className="confirm-btn" disabled={installing || !newPackage}>
                            {installing ? 'Installing...' : 'Install'}
                        </button>
                    </form>

                    <div style={{ marginBottom: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <p style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Or install from file:</p>
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
                                className="confirm-btn"
                                onClick={handleFileInstallClick}
                                disabled={installing}
                                style={{ marginTop: '0.5rem', width: '100%' }}
                            >
                                {installing ? 'Installing...' : 'Install from File'}
                            </button>
                        )}
                    </div>

                    <div className="package-list-container">
                        {packages.length === 0 ? (
                            <p>No packages found.</p>
                        ) : (
                            <table className="package-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Version</th>
                                        <th>Build</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {packages.map((pkg, index) => (
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
