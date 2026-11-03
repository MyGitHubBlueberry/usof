import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ROUTES, toProfile, toProfileTab } from '../../constants/routes'
import { selectIsAuthenticated, logoutThunk } from '../../redux/slices/authSlice'
import { toggleTheme } from '../../redux/slices/themeSlice'
import Logo from '../ui/Logo'
import Avatar from '../ui/Avatar'
import ActionMenu, { ActionMenuItem, ActionMenuDivider, ActionMenuHeader } from '../ui/ActionMenu'
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
  const theme = useSelector((state) => state.theme.mode)

  const handleLogout = async () => {
    await dispatch(logoutThunk())
    navigate(ROUTES.HOME)
  }

  const displayName = user?.login || user?.full_name || 'User'
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
  const myPostsRoute = user?.id ? toProfile(user.id) : ROUTES.LOGIN
  const notificationsRoute = user?.id ? toProfileTab(user.id, 'notifications') : ROUTES.LOGIN
  const favoritesRoute = user?.id ? toProfileTab(user.id, 'favorites') : ROUTES.LOGIN
  const subscriptionsRoute = user?.id ? toProfileTab(user.id, 'subscriptions') : ROUTES.LOGIN

  return (
    <header className={s.header}>
      <div className={s.left}>
        <ActionMenu
          align="left"
          trigger={({ toggle, open }) => (
            <button
              className={s.menuBtn}
              type="button"
              aria-expanded={open}
              aria-label="Navigation Menu"
              onClick={toggle}
            >
              <IconMenu className={s.itemIcon} size={18} />
              <span className={s.menuBtnText}>Menu</span>
              <IconChevron up={open} className={s.itemIcon} />
            </button>
          )}
        >
          <ActionMenuItem icon={<IconHome className={s.itemIcon} />} to={ROUTES.HOME}>
            Home Feed
          </ActionMenuItem>
          <ActionMenuItem icon={<IconTrophy className={s.itemIcon} />} to={ROUTES.LEADERBOARD}>
            Leaderboard
          </ActionMenuItem>
          <ActionMenuItem icon={<IconBell className={s.itemIcon} />} to={notificationsRoute}>
            Notifications
          </ActionMenuItem>

          {isAdmin && (
            <>
              <ActionMenuDivider />
              <ActionMenuItem icon={<IconShield className={s.itemIcon} />} to={ROUTES.ADMIN}>
                Admin Panel
              </ActionMenuItem>
            </>
          )}

          <ActionMenuDivider />
          <ActionMenuItem
            icon={theme === 'dark' ? <IconSun className={s.itemIcon} /> : <IconMoon className={s.itemIcon} />}
            onClick={() => dispatch(toggleTheme())}
          >
            {theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          </ActionMenuItem>
        </ActionMenu>
      </div>

      <div className={s.center}>
        <Logo responsive />
      </div>

      <div className={s.right}>
        {isAuthenticated ? (
          <ActionMenu
            align="right"
            trigger={({ toggle, open }) => (
              <button
                className={s.userBtn}
                type="button"
                aria-expanded={open}
                aria-label="User profile menu"
                onClick={toggle}
              >
                <Avatar
                  userId={user?.id}
                  avatarPath={user?.profile_picture_path}
                  name={displayName}
                  size="medium"
                />
                <span className={s.userName}>{displayName}</span>
                <IconChevron up={open} className={s.itemIcon} />
              </button>
            )}
          >
            <ActionMenuHeader to={myPostsRoute}>
              <div className={s.userInfo}>
                <div className={s.userNameFull}>{user?.full_name || displayName}</div>
                <div className={s.userLogin}>@{user?.login || 'user'}</div>
                {user?.role && <span className={s.userBadge}>{user.role}</span>}
              </div>
            </ActionMenuHeader>

            <ActionMenuDivider />

            <ActionMenuItem icon={<IconDocument className={s.itemIcon} />} to={myPostsRoute}>
              My Posts
            </ActionMenuItem>

            <ActionMenuItem icon={<IconStar className={s.itemIcon} />} to={favoritesRoute}>
              Favorite Posts
            </ActionMenuItem>

            <ActionMenuItem icon={<IconRss className={s.itemIcon} />} to={subscriptionsRoute}>
              Subscriptions
            </ActionMenuItem>

            <ActionMenuItem icon={<IconPen className={s.itemIcon} />} to={ROUTES.POST_NEW}>
              Create Post
            </ActionMenuItem>

            <ActionMenuDivider />

            <ActionMenuItem icon={<IconLogout className={s.itemIcon} />} onClick={handleLogout}>
              Log out
            </ActionMenuItem>
          </ActionMenu>
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
