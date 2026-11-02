import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { notificationsService } from '../../services/notifications.service'
import { toProfileTab, toPost } from '../../constants/routes'
import { useAsyncData } from '../../hooks/useAsyncData'
import { usePolling } from '../../hooks/usePolling'
import { formatDate } from '../../utils/format'
import { IconBell, IconCheck, IconTrash } from '../ui/Icons'
import SidebarWidget from './SidebarWidget'
import sw from './SidebarWidget.module.css'
import s from './NotificationsWidget.module.css'

export default function NotificationsWidget() {
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const profileRoute = toProfileTab(user?.id, 'notifications')
  const { data: notifications, loading, setData } = useAsyncData(
    () => notificationsService.getAll({ limit: 10 }),
    [],
    []
  )

  function handleClick(n) {
    if (!n.is_read) {
      notificationsService.read(n.id).catch(() => {})
      setData((prev) => prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item)))
    }
    navigate(n.post_id ? toPost(n.post_id) : profileRoute)
  }

  function handleKeyDown(e, n) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick(n)
    }
  }

  usePolling(
    () => {
      notificationsService
        .getAll({ limit: 10 })
        .then((res) => {
          const fresh = res.data?.data ?? []
          setData((prev) => {
            const changed =
              fresh.length !== prev.length ||
              fresh.some((n, i) => prev[i]?.id !== n.id || prev[i]?.is_read !== n.is_read)
            return changed ? fresh : prev
          })
        })
        .catch(() => {})
    },
    25_000,
    [user?.id]
  )

  function handleMarkRead(e, id) {
    e.stopPropagation()
    notificationsService.read(id).catch(() => {})
    setData((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)))
  }

  function handleDelete(e, id) {
    e.stopPropagation()
    notificationsService
      .delete(id)
      .then(() => setData((prev) => prev.filter((n) => n.id !== id)))
      .catch(() => {})
  }

  return (
    <SidebarWidget
      title="Notifications"
      icon={<IconBell size={14} />}
      actionLink={profileRoute}
      actionText="All"
      loading={loading}
      empty={!loading && notifications.length === 0}
      emptyMessage="No new notifications"
    >
      <ul className={sw.list}>
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`${sw.item} ${s.item}`}
            role="button"
            tabIndex={0}
            onClick={() => handleClick(n)}
            onKeyDown={(e) => handleKeyDown(e, n)}
          >
            <span className={`${s.dot} ${n.is_read ? s.dotRead : ''}`} />
            <div className={s.content}>
              <span className={s.message}>{n.message}</span>
              {n.created_at && (
                <span className={s.time}>{formatDate(n.created_at)}</span>
              )}
            </div>
            {!n.is_read && (
              <button
                type="button"
                className={s.markReadBtn}
                onClick={(e) => handleMarkRead(e, n.id)}
                aria-label="Mark as read"
                title="Mark as read"
              >
                <IconCheck size={12} />
              </button>
            )}
            <button
              type="button"
              className={s.deleteBtn}
              onClick={(e) => handleDelete(e, n.id)}
              aria-label="Delete notification"
              title="Delete notification"
            >
              <IconTrash size={12} />
            </button>
          </li>
        ))}
      </ul>
    </SidebarWidget>
  )
}
