import Modal from './Modal'
import s from './ActionModal.module.css'

export default function ActionModal({
  title,
  onClose,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  isLoading = false,
  disabled = false,
  message,
  details = [],
  children,
}) {
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isLoading && !disabled && onConfirm) {
      onConfirm(e)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form className={s.form} onSubmit={handleSubmit}>
        {details && details.length > 0 && (
          <div className={s.detailsCard}>
            {details.map((item, idx) => (
              <div key={idx} className={s.detailRow}>
                <span className={s.detailLabel}>{item.label}:</span>
                <span className={s.detailValue}>{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {message && <p className={s.message}>{message}</p>}

        {children}

        <div className={s.actions}>
          <button
            className={`${s.btnConfirm} ${isDanger ? s.btnDanger : s.btnPrimary}`}
            type="submit"
            disabled={isLoading || disabled}
          >
            {isLoading ? 'Processing…' : confirmText}
          </button>
          <button
            className={s.btnGhost}
            type="button"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
        </div>
      </form>
    </Modal>
  )
}
