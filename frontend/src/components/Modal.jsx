function Modal({ title, message, onConfirm, onCancel, confirmText = 'Confirm', isLoading = false, isDanger = false }) {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{title}</h2>
                <p>{message}</p>
                <div className="modal-actions">
                    <button
                        className="cancel-btn"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        className={isDanger ? "confirm-btn" : "create-btn"}
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
