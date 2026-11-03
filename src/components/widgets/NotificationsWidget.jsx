import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toProfileTab, toPost } from '../../constants/routes'
import { usePolling } from '../../hooks/usePolling'
import { POLLING_INTERVALS } from '../../constants/polling'
import { formatDate } from '../../utils/format'
import { fetchNotifications, markNotificationRead, deleteNotification } from '../../redux/slices/notificationsSlice'
import { IconBell, IconCheck, IconTrash } from '../ui/Icons'
import SidebarWidget from './SidebarWidget'
import sw from './SidebarWidget.module.css'
import s from './NotificationsWidget.module.css'

export default function NotificationsWidget() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const { items: notifications, status } = useSelector((state) => state.notifications)
  const loading = status === 'idle' || (status === 'pending' && notifications.length === 0)
  const profileRoute = toProfileTab(user?.id, 'notifications')

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 10 }))
  }, [dispatch])

  function handleClick(n) {
    if (!n.is_read) {
      dispatch(markNotificationRead(n.id))
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
    () => dispatch(fetchNotifications({ limit: 10 })),
    POLLING_INTERVALS.NOTIFICATIONS,
    [dispatch]
  )

  function handleMarkRead(e, id) {
    e.stopPropagation()
    dispatch(markNotificationRead(id))
  }

  function handleDelete(e, id) {
    e.stopPropagation()
    dispatch(deleteNotification(id))
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
