import { useEffect, useState } from 'react'
import { notificationsService } from '../../services/notifications.service'
import { formatDate } from '../../utils/format'
import Pagination from '../ui/Pagination'
import { IconCheck } from '../ui/Icons'
import s from './ProfileTabContent.module.css'
import sn from './ProfileNotifications.module.css'

export default function ProfileNotifications() {
  const [notifications, setNotifications] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    notificationsService
      .getAll({ page, limit: 10 })
      .then((res) => {
        if (!isMounted) return
        setNotifications(res.data?.data || [])
        setTotalPages(res.data?.pagination?.totalPages || 1)
        setError(false)
      })
      .catch(() => {
        if (!isMounted) return
        setNotifications([])
        setError(true)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [page])

  function markRead(id) {
    notificationsService
      .read(id)
      .then(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        )
      })
      .catch(() => {})
  }

  function markAllRead() {
    notificationsService
      .readAll()
      .then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      })
      .catch(() => {})
  }

  if (loading) {
    return <div className={s.state}>Loading notifications…</div>
  }

  if (error) {
    return <div className={s.state}>Could not load notifications.</div>
  }

  const hasUnread = notifications.some((n) => !n.is_read)

  return (
    <div className={s.tabContent}>
      {notifications.length > 0 && hasUnread && (
        <div className={sn.toolbar}>
          <button type="button" className={sn.markAllBtn} onClick={markAllRead}>
            Mark all as read
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className={s.state}>No notifications yet.</div>
      ) : (
        <ul className={sn.list}>
          {notifications.map((n) => (
            <li key={n.id} className={`${sn.item} ${n.is_read ? sn.itemRead : ''}`}>
              <span className={sn.dot} aria-hidden="true" />
              <div className={sn.body}>
                <span className={sn.message}>{n.message}</span>
                {n.created_at && <span className={sn.time}>{formatDate(n.created_at)}</span>}
              </div>
              {!n.is_read && (
                <button
                  type="button"
                  className={sn.readBtn}
                  onClick={() => markRead(n.id)}
                  aria-label="Mark as read"
                  title="Mark as read"
                >
                  <IconCheck size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        hideOnSinglePage
      />
    </div>
  )
}
