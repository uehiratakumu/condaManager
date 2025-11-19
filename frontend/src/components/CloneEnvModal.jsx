import { useState } from 'react'

function CloneEnvModal({ sourceEnv, onClose, onClone }) {
    const [newName, setNewName] = useState(`${sourceEnv}-clone`)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            await onClone(sourceEnv, newName)
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
                <h2>Clone Environment</h2>
                <p>Cloning <strong>{sourceEnv}</strong></p>
                {error && <div className="error-banner">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="new-name">New Name</label>
                        <input
                            id="new-name"
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="confirm-btn" disabled={loading}>
                            {loading ? 'Cloning...' : 'Clone'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CloneEnvModal
