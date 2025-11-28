function Modal({ title, message, onConfirm, onCancel, confirmText = 'Confirm', isLoading = false, isDanger = false, isWarning = false }) {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{title}</h2>
                <p style={{ whiteSpace: 'pre-wrap' }}>{message}</p>
                <div className="modal-actions">
                    <button
                        className={isWarning ? "create-btn" : "cancel-btn"}
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        className={isWarning ? "cancel-btn" : (isDanger ? "confirm-btn" : "create-btn")}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Modal
