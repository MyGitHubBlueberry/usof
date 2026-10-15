import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import s from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <div className={s.brand}>USOF — The Universal Stack Overflow Forum</div>
        <nav className={s.links}>
          <Link to={ROUTES.HOME} className={s.link}>Home Feed</Link>
          <Link to={ROUTES.FAVORITES} className={s.link}>Favorites</Link>
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
