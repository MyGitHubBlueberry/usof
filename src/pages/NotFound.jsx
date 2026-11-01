import { Link } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import { IconAlertTriangle, IconHome } from '../components/ui/Icons'
import s from './NotFound.module.css'

export default function NotFound() {
  return (
    <div className={s.page}>
      <IconAlertTriangle size={56} className={s.icon} />
      <p className={s.code}>404</p>
      <h1 className={s.title}>Page not found</h1>
      <p className={s.subtitle}>
        The page you're looking for doesn't exist, or it may have been moved.
      </p>
      <Link to={ROUTES.HOME} className={s.homeLink}>
        <IconHome size={15} />
        Back to Home
      </Link>
    </div>
  )
}
