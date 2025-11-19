import { useState } from 'react'

function PackageList({ packages, envName, onClose, onInstall, onUninstall }) {
    const [newPackage, setNewPackage] = useState('')
    const [installing, setInstalling] = useState(false)

    const handleInstall = async (e) => {
        e.preventDefault()
        if (!newPackage) return
        setInstalling(true)
        try {
            await onInstall(envName, newPackage)
            setNewPackage('')
        } catch (err) {
            alert(err.message)
        } finally {
            setInstalling(false)
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content package-list-modal">
                <div className="modal-header">
                    <h2>Packages in {envName}</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <form className="install-form" onSubmit={handleInstall}>
                    <input
                        type="text"
                        placeholder="Package name (e.g. numpy)"
                        value={newPackage}
                        onChange={(e) => setNewPackage(e.target.value)}
                        disabled={installing}
                    />
                    <button type="submit" className="confirm-btn" disabled={installing || !newPackage}>
                        {installing ? 'Installing...' : 'Install Package'}
                    </button>
                </form>

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
                                                onClick={() => onUninstall(envName, pkg.name)}
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
    )
}

export default PackageList
