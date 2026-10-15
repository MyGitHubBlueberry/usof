import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import s from './Logo.module.css'

export default function Logo({ className = '', to = ROUTES.HOME, responsive = false }) {
  const classes = [s.logo, responsive ? s.responsive : '', className].filter(Boolean).join(' ')

  return (
    <Link to={to} className={classes}>
      <div className={s.logoMark}>U</div>
      <span className={s.logoText}>USOF</span>
    </Link>
  )
}
