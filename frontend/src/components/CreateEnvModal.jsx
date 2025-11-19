import { useState } from 'react'

function CreateEnvModal({ onClose, onCreate }) {
    const [name, setName] = useState('')
    const [pythonVersion, setPythonVersion] = useState('3.9')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            await onCreate(name, pythonVersion)
            onClose()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Create Environment</h2>
                {error && <div className="error-banner">{error}</div>}
                <form onSubmit={handleSubmit}>
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
                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="confirm-btn" disabled={loading}>
                            {loading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateEnvModal
