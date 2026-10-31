import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationsService } from '../../services/notifications.service'
import { useFlash } from '../../hooks/useFlash'
import { toPost } from '../../constants/routes'
import { formatDate } from '../../utils/format'
import Pagination from '../ui/Pagination'
import { IconCheck, IconTrash } from '../ui/Icons'
import s from './ProfileTabContent.module.css'
import sn from './ProfileNotifications.module.css'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
]

export default function ProfileNotifications() {
  const navigate = useNavigate()
  const { showFlash } = useFlash()

  const [notifications, setNotifications] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filterKey = `${search}|${statusFilter}`
  const [appliedFilterKey, setAppliedFilterKey] = useState(filterKey)
  if (appliedFilterKey !== filterKey) {
    setAppliedFilterKey(filterKey)
    setPage(1)
  }

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    notificationsService
      .getAll({ page, limit: 10, search: search || undefined, status: statusFilter === 'all' ? undefined : statusFilter })
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
  }, [page, search, statusFilter])

  function markRead(id) {
    notificationsService
      .read(id)
      .then(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        )
      })
      .catch(() => { })
  }

  function markAllRead() {
    notificationsService
      .readAll()
      .then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      })
      .catch(() => { })
  }

  function deleteOne(id) {
    notificationsService
      .delete(id)
      .then(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      })
      .catch((err) => showFlash(err.message || 'Could not delete notification.', 'error'))
  }

  function deleteAll() {
    notificationsService
      .deleteAll()
      .then(() => {
        setNotifications([])
        showFlash('All notifications deleted.', 'success')
      })
      .catch((err) => showFlash(err.message || 'Could not delete notifications.', 'error'))
  }

  function handleNotificationClick(n) {
    if (!n.is_read) {
      notificationsService.read(n.id).catch(() => { })
    }
    if (n.post_id) {
      navigate(toPost(n.post_id))
    }
  }

  if (loading) {
    return <div className={s.state}>Loading notifications…</div>
  }

  if (error) {
    return <div className={s.state}>Could not load notifications.</div>
  }

  const hasUnread = notifications.some((n) => !n.is_read)
  const hasAny = notifications.length > 0 || search || statusFilter !== 'all'

  return (
    <div className={s.tabContent}>
      <div className={sn.filters}>
        <input
          type="text"
          className={sn.searchInput}
          placeholder="Search notifications…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <div className={sn.filterToggle}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`${sn.filterBtn} ${statusFilter === f.value ? sn.filterBtnActive : ''}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className={sn.toolbar}>
          <button
            type="button"
            className={sn.markAllBtn}
            onClick={markAllRead}
            disabled={!hasUnread}>
            Mark all as read
          </button>
          <button
            type="button"
            className={sn.deleteAllBtn}
            onClick={deleteAll}
            disabled={notifications.length > 0}>
            Delete all
          </button>
        </div>
      </div>


      {notifications.length === 0 ? (
        <div className={s.state}>
          {hasAny ? 'No notifications match your filters.' : 'No notifications yet.'}
        </div>
      ) : (
        <ul className={sn.list}>
          {notifications.map((n) => (
            <li key={n.id} className={`${sn.item} ${n.is_read ? sn.itemRead : ''}`}>
              <span className={sn.dot} aria-hidden="true" />
              <button type="button" className={sn.body} onClick={() => handleNotificationClick(n)}>
                <span className={sn.message}>{n.message}</span>
                {n.created_at && <span className={sn.time}>{formatDate(n.created_at)}</span>}
              </button>
              <div className={sn.itemActions}>
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
                <button
                  type="button"
                  className={sn.deleteBtn}
                  onClick={() => deleteOne(n.id)}
                  aria-label="Delete notification"
                  title="Delete notification"
                >
                  <IconTrash size={13} />
                </button>
              </div>
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
