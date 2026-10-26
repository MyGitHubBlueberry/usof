import { useContext } from 'react'
import { FlashContext } from '../../context/FlashContext'
import { IconCheck, IconX } from './Icons'
import s from './Flash.module.css'

export default function Flash({ flash: flashProp, onDismiss }) {
  const context = useContext(FlashContext)
  const flash = flashProp !== undefined ? flashProp : context?.flash
  const dismiss = onDismiss || context?.clearFlash

  if (!flash) return null

  return (
    <div className={s.flashOverlay} role="status" aria-live="polite">
      <div className={`${s.flash} ${flash.type === 'error' ? s.flashError : s.flashSuccess}`}>
        <span className={s.flashIcon}>
          {flash.type === 'error' ? <IconX size={15} /> : <IconCheck size={15} />}
        </span>
        <span className={s.flashMsg}>{flash.msg}</span>
        {dismiss && (
          <button
            className={s.flashCloseBtn}
            onClick={dismiss}
            type="button"
            aria-label="Dismiss message"
          >
            <IconX size={13} />
          </button>
        )}
      </div>
    </div>
  )
}
