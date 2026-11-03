import { Link } from 'react-router-dom'
import s from './DevConfirmationLink.module.css'

export default function DevConfirmationLink({ link, label = 'Dev: Confirm Email Now', className = '' }) {
  if (!import.meta.env.DEV || !link) return null

  return (
    <Link to={link} className={`${s.devLink} ${className}`}>
      {label}
    </Link>
  )
}
