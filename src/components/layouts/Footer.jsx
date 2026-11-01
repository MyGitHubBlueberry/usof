import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ROUTES, toProfileTab } from '../../constants/routes'
import { selectIsAuthenticated } from '../../redux/slices/authSlice'
import s from './Footer.module.css'

export default function Footer() {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector((state) => state.auth.user)
  const favoritesRoute = isAuthenticated && user?.id ? toProfileTab(user.id, 'favorites') : ROUTES.LOGIN

  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <div className={s.brand}>USOF — The Universal Stack Overflow Forum</div>
        <nav className={s.links}>
          <Link to={ROUTES.HOME} className={s.link}>Home Feed</Link>
          <Link to={favoritesRoute} className={s.link}>Favorites</Link>
          <Link to={ROUTES.LEADERBOARD} className={s.link}>Leaderboard</Link>
          <Link to={ROUTES.POST_NEW} className={s.link}>Create Post</Link>
        </nav>
        <div className={s.copy}>
          © {new Date().getFullYear()} USOF. Built with React & Vite. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
