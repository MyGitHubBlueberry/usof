import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { notificationsService } from '../../services/notifications.service'
import { toProfileTab, toPost } from '../../constants/routes'
import { useAsyncData } from '../../hooks/useAsyncData'
import { formatDate } from '../../utils/format'
import { IconBell, IconTrash } from '../ui/Icons'
import SidebarWidget from './SidebarWidget'
import sw from './SidebarWidget.module.css'
import s from './NotificationsWidget.module.css'

export default function NotificationsWidget() {
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const profileRoute = toProfileTab(user?.id, 'notifications')
  const { data: notifications, loading, setData } = useAsyncData(
    () => notificationsService.getAll({ limit: 4 }),
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
