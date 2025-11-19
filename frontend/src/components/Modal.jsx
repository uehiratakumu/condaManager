function Modal({ title, message, onConfirm, onCancel, confirmText = "Delete" }) {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{title}</h2>
                <p>{message}</p>
                <div className="modal-actions">
                    <button className="cancel-btn" onClick={onCancel}>Cancel</button>
                    <button className="confirm-btn" onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>
    )
}

export default Modal
