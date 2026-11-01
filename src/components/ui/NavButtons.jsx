import { useNavigate } from 'react-router-dom'
import { IconChevronLeft, IconChevronRight } from './Icons'
import s from './NavButtons.module.css'

export function BackButton({ className = '' }) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      className={`${s.backBtn} ${className}`.trim()}
      onClick={() => navigate(-1)}
      aria-label="Go back"
    >
      <IconChevronLeft size={16} />
      <span>Back</span>
    </button>
  )
}

export function ForwardButton({ className = '' }) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      className={`${s.forwardBtn} ${className}`.trim()}
      onClick={() => navigate(1)}
      aria-label="Go forward"
    >
      <span>Forward</span>
      <IconChevronRight size={16} />
    </button>
  )
}

export default function NavRow({ className = '', backBtnClassName = '', frwdBtnClassName = '' }) {
  return (
    <div className={`${s.navRow} ${className}`}>
      <BackButton className={backBtnClassName} />
      <ForwardButton className={frwdBtnClassName} />
    </div>
  )
}
