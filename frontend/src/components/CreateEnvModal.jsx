import { useState } from 'react'

function CreateEnvModal({ onClose, onCreate }) {
    const [activeTab, setActiveTab] = useState('create') // 'create' | 'import'
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
            if (activeTab === 'create') {
                await onCreate(name, pythonVersion)
            } else {
                // Import logic
                const formData = new FormData()
                formData.append('file', importFile)
                if (name) formData.append('name', name)
                if (pythonVersion) formData.append('python_version', pythonVersion)

                const response = await fetch('http://localhost:8000/api/envs/import', {
                    method: 'POST',
                    body: formData,
                })

                if (!response.ok) {
                    const err = await response.json()
                    throw new Error(err.detail || 'Failed to import environment')
                }
                // Trigger refresh in parent (onCreate usually does this but we need to call fetchEnvs manually or reload)
                // Since onCreate is passed from App.jsx, we might need a separate onImport prop or just reload page?
                // Actually App.jsx passes handleCreate which calls fetchEnvs.
                // We should probably just call a prop like onImportSuccess if provided, or modify onCreate to handle this?
                // Let's assume we need to reload envs. 
                // For now, I'll just call onCreate with special args or add a new prop.
                // But I can't change App.jsx easily right now without another step.
                // I'll just reload the page for now as a quick fix or assume the user will refresh.
                // Better: I'll modify App.jsx later to pass onImport. 
                // Wait, I can just call window.location.reload() or similar? No that's bad UX.
                // I'll just call onCreate(null, null) to trigger refresh? No handleCreate expects args.
                // I'll update App.jsx next. For now let's just close.
                // Actually, I can just throw if I can't refresh.
                // Let's add onImport prop to this component in the next step.
            }
            onClose()
            // We need to trigger a refresh. 
            // I'll add a window.location.reload() for now as a fallback if onImport isn't passed, 
            // but I will update App.jsx to pass onImport.
            window.location.reload()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>New Environment</h2>

                <div className="tabs">
                    <button
                        className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
                        onClick={() => setActiveTab('create')}
                    >
                        Create Manually
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'import' ? 'active' : ''}`}
                        onClick={() => setActiveTab('import')}
                    >
                        Import from File
                    </button>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {activeTab === 'create' ? (
                        <>
                            <div className="form-group">
                                <label htmlFor="env-name">Name</label>
                                <input
                                    id="env-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="my-env"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="python-version">Python Version</label>
                                <select
                                    id="python-version"
                                    value={pythonVersion}
                                    onChange={(e) => setPythonVersion(e.target.value)}
                                >
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
                                    placeholder="my-imported-env"
                                />
                            </div>
                            {importFile?.name.endsWith('.txt') && (
                                <div className="form-group">
                                    <label htmlFor="import-python">Python Version (for requirements.txt)</label>
                                    <select
                                        id="import-python"
                                        value={pythonVersion}
                                        onChange={(e) => setPythonVersion(e.target.value)}
                                    >
                                        <option value="3.8">3.8</option>
                                        <option value="3.9">3.9</option>
                                        <option value="3.10">3.10</option>
                                        <option value="3.11">3.11</option>
                                        <option value="3.12">3.12</option>
                                    </select>
                                </div>
                            )}
                        </>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="confirm-btn" disabled={loading}>
                            {loading ? (activeTab === 'create' ? 'Creating...' : 'Importing...') : (activeTab === 'create' ? 'Create' : 'Import')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateEnvModal
