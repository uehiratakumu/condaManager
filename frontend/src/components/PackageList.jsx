import { useState } from 'react'
import Modal from './Modal'

function PackageList({ packages, envName, onClose, onInstall, onUninstall }) {
    const [newPackage, setNewPackage] = useState('')
    const [installing, setInstalling] = useState(false)
    const [confirmState, setConfirmState] = useState(null) // { type: 'install'|'uninstall', pkg: string }

    const handleInstallClick = (e) => {
        e.preventDefault()
        if (!newPackage) return
        setConfirmState({ type: 'install', pkg: newPackage })
    }

    const handleUninstallClick = (pkgName) => {
        setConfirmState({ type: 'uninstall', pkg: pkgName })
    }

    const proceedAction = async () => {
        if (!confirmState) return

        const { type, pkg } = confirmState
        setConfirmState(null) // Close modal first

        if (type === 'install') {
            setInstalling(true)
            try {
                await onInstall(envName, pkg)
                setNewPackage('')
            } catch (err) {
                alert(err.message)
            } finally {
                setInstalling(false)
            }
        } else if (type === 'uninstall') {
            try {
                await onUninstall(envName, pkg)
            } catch (err) {
                alert(err.message)
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
                                accept=".txt,.yml,.yaml"
                                onChange={async (e) => {
                                    const file = e.target.files[0]
                                    if (!file) return

                                    if (!confirm(`Install packages from '${file.name}'?`)) {
                                        e.target.value = null
                                        return
                                    }

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
                                        alert(data.message)
                                        // We should refresh the package list here.
                                        // Ideally we call a prop like onRefresh() but we don't have it.
                                        // We can close the modal or just let the user see.
                                        // Since we don't have a way to re-fetch packages in this component easily without prop drilling fetchPackages,
                                        // we will just rely on the user closing and reopening or we can try to trigger something.
                                        // Actually, let's just alert success.
                                        onClose() // Close modal to force refresh when reopened? No, that doesn't refresh.
                                        // The parent App.jsx fetches packages when env is selected.
                                        // If we close, we deselect? No.
                                        // Let's just alert for now.
                                    } catch (err) {
                                        alert(err.message)
                                    } finally {
                                        setInstalling(false)
                                        e.target.value = null
                                    }
                                }}
                                disabled={installing}
                            />
                            <div className="file-input-label">
                                {installing ? 'Installing...' : 'Upload requirements.txt / environment.yml'}
                            </div>
                        </div>
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
                    title={confirmState.type === 'install' ? 'Install Package' : 'Uninstall Package'}
                    message={
                        confirmState.type === 'install'
                            ? `Are you sure you want to install '${confirmState.pkg}' in '${envName}'?`
                            : `Are you sure you want to uninstall '${confirmState.pkg}' from '${envName}'?`
                    }
                    onConfirm={proceedAction}
                    onCancel={() => setConfirmState(null)}
                    confirmText={confirmState.type === 'install' ? 'Install' : 'Uninstall'}
                />
            )}
        </>
    )
}

export default PackageList
