import { useEffect } from 'react'

function Toast({ message, type = 'success', onClose }) {
    useEffect(() => {
        if (type !== 'loading') {
            const timer = setTimeout(() => {
                onClose()
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [type, onClose])

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✓'
            case 'error':
                return '✕'
            case 'loading':
                return '⟳'
            default:
                return ''
        }
    }

    return (
        <div className={`toast ${type}`}>
            <span className="toast-icon">{getIcon()}</span>
            <span className="toast-message">{message}</span>
        </div>
    )
}

export default Toast
