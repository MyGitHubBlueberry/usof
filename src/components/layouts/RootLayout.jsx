import { Outlet, useLocation } from 'react-router-dom'
import { Suspense } from 'react'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from '../../redux/slices/authSlice'
import { ROUTES } from '../../constants/routes'
import Header from './Header'
import Footer from './Footer'
import LeaderboardWidget from '../widgets/LeaderboardWidget'
import CategoriesWidget from '../widgets/CategoriesWidget'
import NotificationsWidget from '../widgets/NotificationsWidget'
import SubscriptionsWidget from '../widgets/SubscriptionsWidget'
import FavoritesWidget from '../widgets/FavoritesWidget'
import s from './RootLayout.module.css'

export default function RootLayout() {
  const location = useLocation()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isHome = location.pathname === ROUTES.HOME
  const isFullSpan = location.pathname.startsWith(ROUTES.ADMIN)

  return (
    <div className={s.appShell}>
      <Header />

      <div className={s.contentArea}>
        {isHome && (
          <aside className={s.leftSidebar}>
            {isAuthenticated ? (
              <>
                <NotificationsWidget />
                <SubscriptionsWidget />
              </>
            ) : (
              <CategoriesWidget />
            )}
          </aside>
        )}

        <div className={`${s.centerColumn} ${isFullSpan ? s.fullSpan : ''}`}>
          <main className={s.main}>
            <Suspense fallback={<div className={s.pageFallback}>Loading…</div>}>
              <Outlet />
            </Suspense>
            <Footer />
          </main>
        </div>

        {isHome && (
          <aside className={s.rightSidebar}>
            <LeaderboardWidget />
            {isAuthenticated && <FavoritesWidget />}
          </aside>
        )}
      </div>
    </div>
  )
}
