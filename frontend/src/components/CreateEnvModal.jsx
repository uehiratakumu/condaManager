import { useState } from 'react'

function CreateEnvModal({ onClose, onCreate, onSuccess }) {
    const [activeTab, setActiveTab] = useState('manual')
    const [name, setName] = useState('')
    const [pythonVersion, setPythonVersion] = useState('3.9')
    const [importFile, setImportFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (activeTab === 'manual') {
                console.log('Creating environment with Python version:', pythonVersion)
                await onCreate(name, pythonVersion)
                onClose()
            } else {
                if (!importFile) return

                const formData = new FormData()
                formData.append('file', importFile)
                if (name) formData.append('name', name)
                formData.append('python_version', pythonVersion)

                const response = await fetch('http://localhost:8000/api/envs/import', {
                    method: 'POST',
                    body: formData
                })

                if (!response.ok) {
                    const err = await response.json()
                    throw new Error(err.detail || 'Failed to import environment')
                }

                if (onSuccess) onSuccess()
                onClose()
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Create New Environment</h2>

                <div className="tabs">
                    <button
                        className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
                        onClick={() => setActiveTab('manual')}
                        disabled={loading}
                    >
                        Create Manually
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'import' ? 'active' : ''}`}
                        onClick={() => setActiveTab('import')}
                        disabled={loading}
                    >
                        Import from File
                    </button>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {activeTab === 'manual' ? (
                        <>
                            <div className="form-group">
                                <label htmlFor="env-name">Environment Name</label>
                                <input
                                    id="env-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="python-version">Python Version</label>
                                <select
                                    id="python-version"
                                    value={pythonVersion}
                                    onChange={(e) => setPythonVersion(e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="3.7">3.7</option>
                                    <option value="3.8">3.8</option>
                                    <option value="3.9">3.9</option>
                                    <option value="3.10">3.10</option>
                                    <option value="3.11">3.11</option>
                                    <option value="3.12">3.12</option>
                                </select>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>File (environment.yml or requirements.txt)</label>
                                <div className="file-input-wrapper">
                                    <input
                                        id="import-file"
                                        type="file"
                                        accept=".yml,.yaml,.txt"
                                        onChange={(e) => setImportFile(e.target.files[0])}
                                        required
                                        disabled={loading}
                                    />
                                    <div className="file-input-label">
                                        {importFile ? 'Change File' : 'Click to Select File'}
                                    </div>
                                </div>
                                {importFile && (
                                    <div className="file-name-display">
                                        📄 {importFile.name}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label htmlFor="import-name">Name (Optional for .yml, Required for .txt)</label>
                                <input
                                    id="import-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Leave empty to use name from .yml"
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="import-python">Python Version (For requirements.txt)</label>
                                <select
                                    id="import-python"
                                    value={pythonVersion}
                                    onChange={(e) => setPythonVersion(e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="3.7">3.7</option>
                                    <option value="3.8">3.8</option>
                                    <option value="3.9">3.9</option>
                                    <option value="3.10">3.10</option>
                                    <option value="3.11">3.11</option>
                                    <option value="3.12">3.12</option>
                                </select>
                            </div>
                        </>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="create-btn" disabled={loading}>
                            {loading ? 'Processing...' : (activeTab === 'manual' ? 'Create' : 'Import')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateEnvModal
