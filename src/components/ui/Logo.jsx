import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import s from './Logo.module.css'

export default function Logo({ className = '', to = ROUTES.HOME }) {
  return (
    <Link to={to} className={`${s.logo} ${className}`.trim()}>
      <div className={s.logoMark}>U</div>
      <span className={s.logoText}>USOF</span>
    </Link>
  )
}
