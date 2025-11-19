import { useState } from 'react'

function CloneEnvModal({ sourceEnv, onClose, onClone, isLoading }) {
    const [newName, setNewName] = useState(`${sourceEnv}_clone`)

    const handleSubmit = (e) => {
        e.preventDefault()
        if (newName) {
            onClone(sourceEnv, newName)
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Clone Environment</h2>
                <p>Cloning <strong>{sourceEnv}</strong></p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="clone-name">New Environment Name</label>
                        <input
                            id="clone-name"
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </button>
                        <button type="submit" className="create-btn" disabled={isLoading}>
                            {isLoading ? 'Cloning...' : 'Clone'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CloneEnvModal
