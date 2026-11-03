import { useDispatch, useSelector } from 'react-redux'
import { flashCleared } from '../../redux/slices/flashSlice'
import { IconCheck, IconX } from './Icons'
import s from './Flash.module.css'

export default function Flash() {
  const dispatch = useDispatch()
  const flash = useSelector((state) => state.flash)

  if (!flash.msg) return null

  return (
    <div className={s.flashOverlay} role="status" aria-live="polite">
      <div className={`${s.flash} ${flash.type === 'error' ? s.flashError : s.flashSuccess}`}>
        <span className={s.flashIcon}>
          {flash.type === 'error' ? <IconX size={15} /> : <IconCheck size={15} />}
        </span>
        <span className={s.flashMsg}>{flash.msg}</span>
        <button
          className={s.flashCloseBtn}
          onClick={() => dispatch(flashCleared())}
          type="button"
          aria-label="Dismiss message"
        >
          <IconX size={13} />
        </button>
      </div>
    </div>
  )
}
