import { useNavigate } from 'react-router-dom'
import { IconChevronLeft } from './Icons'
import s from './BackButton.module.css'

export default function BackButton({ className = '' }) {
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
