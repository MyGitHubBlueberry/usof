import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ROUTES, toProfile, toUserPosts } from '../../constants/routes'
import { selectIsAuthenticated, logoutThunk } from '../../redux/slices/authSlice'
import { useTheme } from '../../hooks/useTheme'
import Logo from '../ui/Logo'
import {
  IconMenu,
  IconChevron,
  IconHome,
  IconStar,
  IconTrophy,
  IconPen,
  IconBell,
  IconShield,
  IconSun,
  IconMoon,
  IconUser,
  IconLogout,
  IconDocument,
  IconRss,
} from '../ui/Icons'
import s from './Header.module.css'

export default function Header() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector((state) => state.auth.user)
  const { theme, toggleTheme } = useTheme()

  const [navOpen, setNavOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  const navRef = useRef(null)
  const userRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setNavOpen(false)
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserOpen(false)
      }
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setNavOpen(false)
        setUserOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleLogout = async () => {
    setUserOpen(false)
    await dispatch(logoutThunk())
    navigate(ROUTES.HOME)
  }

  const closeMenus = () => {
    setNavOpen(false)
    setUserOpen(false)
  }

  const displayName = user?.login || user?.full_name || 'User'
  const initial = (user?.login?.[0] || user?.full_name?.[0] || 'U').toUpperCase()
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
  const profileRoute = user?.id ? toProfile(user.id) : ROUTES.LOGIN
  const myPostsRoute = user?.id ? toUserPosts(user.id) : ROUTES.LOGIN

  return (
    <header className={s.header}>
      <div className={s.left} ref={navRef}>
        <button
          className={s.menuBtn}
          type="button"
          aria-expanded={navOpen}
          aria-label="Navigation Menu"
          onClick={() => setNavOpen((prev) => !prev)}
        >
          <IconMenu className={s.itemIcon} size={18} />
          <span className={s.menuBtnText}>Menu</span>
          <IconChevron up={navOpen} className={s.itemIcon} />
        </button>

        {navOpen && (
          <div className={`${s.dropdown} ${s.leftDropdown}`}>
            <Link to={ROUTES.HOME} className={s.dropdownItem} onClick={closeMenus}>
              <IconHome className={s.itemIcon} />
              <span>Home Feed</span>
            </Link>
            <Link to={ROUTES.LEADERBOARD} className={s.dropdownItem} onClick={closeMenus}>
              <IconTrophy className={s.itemIcon} />
              <span>Leaderboard</span>
            </Link>
            <Link to={ROUTES.NOTIFICATIONS} className={s.dropdownItem} onClick={closeMenus}>
              <IconBell className={s.itemIcon} />
              <span>Notifications</span>
            </Link>

            {isAdmin && (
              <>
                <div className={s.dropdownDivider} />
                <Link to={ROUTES.ADMIN} className={s.dropdownItem} onClick={closeMenus}>
                  <IconShield className={s.itemIcon} />
                  <span>Admin Panel</span>
                </Link>
              </>
            )}

            <div className={s.dropdownDivider} />
            <button
              type="button"
              className={s.dropdownItem}
              onClick={() => {
                toggleTheme()
                closeMenus()
              }}
            >
              {theme === 'dark' ? (
                <IconSun className={s.itemIcon} />
              ) : (
                <IconMoon className={s.itemIcon} />
              )}
              <span>{theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}</span>
            </button>
          </div>
        )}
      </div>

      <div className={s.center}>
        <Logo responsive />
      </div>

      <div className={s.right} ref={userRef}>
        {isAuthenticated ? (
          <>
            <button
              className={s.userBtn}
              type="button"
              aria-expanded={userOpen}
              aria-label="User profile menu"
              onClick={() => setUserOpen((prev) => !prev)}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={displayName} className={s.avatar} />
              ) : (
                <div className={s.avatar}>{initial}</div>
              )}
              <span className={s.userName}>{displayName}</span>
              <IconChevron up={userOpen} className={s.itemIcon} />
            </button>

            {userOpen && (
              <div className={`${s.dropdown} ${s.rightDropdown}`}>
                <Link
                  to={profileRoute}
                  className={s.userInfoLink}
                  onClick={closeMenus}
                >
                  <div className={s.userInfo}>
                    <div className={s.userNameFull}>{user?.full_name || displayName}</div>
                    <div className={s.userLogin}>@{user?.login || 'user'}</div>
                    {user?.role && <span className={s.userBadge}>{user.role}</span>}
                  </div>
                </Link>

                <div className={s.dropdownDivider} />

                <Link
                  to={profileRoute}
                  className={s.dropdownItem}
                  onClick={closeMenus}
                >
                  <IconUser className={s.itemIcon} />
                  <span>Your Profile</span>
                </Link>

                <Link to={myPostsRoute} className={s.dropdownItem} onClick={closeMenus}>
                  <IconDocument className={s.itemIcon} />
                  <span>My Posts</span>
                </Link>

                <Link to={ROUTES.FAVORITES} className={s.dropdownItem} onClick={closeMenus}>
                  <IconStar className={s.itemIcon} />
                  <span>Favorite Posts</span>
                </Link>

                <Link to={ROUTES.SUBSCRIPTIONS} className={s.dropdownItem} onClick={closeMenus}>
                  <IconRss className={s.itemIcon} />
                  <span>Subscriptions</span>
                </Link>

                <Link to={ROUTES.POST_NEW} className={s.dropdownItem} onClick={closeMenus}>
                  <IconPen className={s.itemIcon} />
                  <span>Create Post</span>
                </Link>

                <div className={s.dropdownDivider} />

                <button
                  type="button"
                  className={s.dropdownItem}
                  onClick={handleLogout}
                >
                  <IconLogout className={s.itemIcon} />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className={s.guestGroup}>
            <Link to={ROUTES.LOGIN} className={s.loginBtn}>
              Sign in
            </Link>
            <Link to={ROUTES.REGISTER} className={s.registerBtn}>
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
