import { useState } from 'react'

function CreateEnvModal({ onClose, onCreate, onSuccess }) {
    const [activeTab, setActiveTab] = useState('manual')
    const [name, setName] = useState('')
    const [pythonVersion, setPythonVersion] = useState('3.9')
    const [importFile, setImportFile] = useState(null)
    const [requirementsFile, setRequirementsFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (activeTab === 'manual') {
                if (requirementsFile) {
                    // Create with requirements.txt
                    const formData = new FormData()
                    formData.append('file', requirementsFile)
                    formData.append('name', name)
                    formData.append('python_version', pythonVersion)

                    const response = await fetch('http://localhost:8000/api/envs/import', {
                        method: 'POST',
                        body: formData
                    })

                    if (!response.ok) {
                        const err = await response.json()
                        throw new Error(err.detail || 'Failed to create environment with requirements')
                    }
                    if (onSuccess) onSuccess()
                    onClose()
                } else {
                    // Standard manual creation
                    console.log('Creating environment with Python version:', pythonVersion)
                    await onCreate(name, pythonVersion)
                    onClose()
                }
            } else {
                // Import from YAML
                if (!importFile) return

                const formData = new FormData()
                formData.append('file', importFile)
                if (name) formData.append('name', name)
                // Python version is not sent for YAML import as it's defined in the file

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
                        className={`tab-btn ${activeTab === 'yaml' ? 'active' : ''}`}
                        onClick={() => setActiveTab('yaml')}
                        disabled={loading}
                    >
                        Import from YAML
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
                            <div className="form-group">
                                <label>Requirements File (Optional)</label>
                                <div className="file-input-wrapper">
                                    <input
                                        id="req-file"
                                        type="file"
                                        accept=".txt"
                                        onChange={(e) => setRequirementsFile(e.target.files[0])}
                                        disabled={loading}
                                    />
                                    <div className="file-input-label">
                                        {requirementsFile ? 'Change File' : 'Select requirements.txt'}
                                    </div>
                                </div>
                                {requirementsFile && (
                                    <div className="file-name-display">
                                        📄 {requirementsFile.name}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>Environment File (.yml / .yaml)</label>
                                <div className="file-input-wrapper">
                                    <input
                                        id="import-file"
                                        type="file"
                                        accept=".yml,.yaml"
                                        onChange={(e) => setImportFile(e.target.files[0])}
                                        required
                                        disabled={loading}
                                    />
                                    <div className="file-input-label">
                                        {importFile ? 'Change File' : 'Click to Select YAML File'}
                                    </div>
                                </div>
                                {importFile && (
                                    <div className="file-name-display">
                                        📄 {importFile.name}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label htmlFor="import-name">Name (Optional - overrides YAML name)</label>
                                <input
                                    id="import-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Leave empty to use name from .yml"
                                    disabled={loading}
                                />
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
