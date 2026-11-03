import { Outlet, useLocation, matchPath } from 'react-router-dom'
import { Suspense, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from '../../redux/slices/authSlice'
import { ROUTES } from '../../constants/routes'
import Header from './Header'
import Footer from './Footer'
import BannedScreen from '../ui/BannedScreen'
import LeaderboardWidget from '../widgets/LeaderboardWidget'
import CategoriesWidget from '../widgets/CategoriesWidget'
import NotificationsWidget from '../widgets/NotificationsWidget'
import SubscriptionsWidget from '../widgets/SubscriptionsWidget'
import FavoritesWidget from '../widgets/FavoritesWidget'
import Loading from '../ui/Loading'
import Flash from '../ui/Flash'
import s from './RootLayout.module.css'

export default function RootLayout() {
  const location = useLocation()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const banned = useSelector((state) => state.auth.banned)
  const theme = useSelector((state) => state.theme.mode)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const isHome = location.pathname === ROUTES.HOME
  const isPostDetail = !!matchPath({ path: ROUTES.POST, end: true }, location.pathname)
  const isLeaderboard = location.pathname === ROUTES.LEADERBOARD
  const showSidebars = isHome || isPostDetail || isLeaderboard
  const isFullSpan = location.pathname.startsWith(ROUTES.ADMIN)

  if (banned) {
    return <BannedScreen ban={banned} />
  }

  return (
    <div className={s.appShell}>
      <Flash />
      <Header />

      <div className={s.contentArea}>
        {showSidebars && (
          <aside className={s.leftSidebar}>
            {isAuthenticated ? (
              <>
                <NotificationsWidget />
                <SubscriptionsWidget />
              </>
            ) : (
              (isHome || isLeaderboard) && <CategoriesWidget />
            )}
          </aside>
        )}

        <div className={`${s.centerColumn} ${isFullSpan ? s.fullSpan : ''}`}>
          <main className={s.main}>
            <Suspense fallback={<Loading size="large" />}>
              <Outlet />
            </Suspense>
            <Footer />
          </main>
        </div>

        {showSidebars && (
          <aside className={s.rightSidebar}>
            {isHome && <LeaderboardWidget />}
            {isAuthenticated && <FavoritesWidget />}
          </aside>
        )}
      </div>
    </div>
  )
}
