import { useEffect, useRef } from 'react'
import { IconX } from './Icons'
import s from './Modal.module.css'

export default function Modal({ title, onClose, children }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div className={s.modalOverlay} ref={overlayRef} onClick={handleOverlayClick}>
      <div className={s.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className={s.modalHeader}>
          <span id="modal-title" className={s.modalTitle}>{title}</span>
          <button className={s.modalCloseBtn} onClick={onClose} type="button" aria-label="Close modal">
            <IconX size={16} />
          </button>
        </div>
        <div className={s.modalBody}>{children}</div>
      </div>
    </div>
  )
}
