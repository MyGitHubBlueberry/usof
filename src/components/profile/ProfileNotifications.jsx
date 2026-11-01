import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationsService } from '../../services/notifications.service'
import { useFlash } from '../../hooks/useFlash'
import { toPost } from '../../constants/routes'
import { formatDate } from '../../utils/format'
import Pagination from '../ui/Pagination'
import FeedControls from '../posts/FeedControls'
import { SelectDropdown } from '../ui/SelectDropdown'
import { IconCheck, IconTrash } from '../ui/Icons'
import fc from '../posts/FeedControls.module.css'
import s from './ProfileTabContent.module.css'
import sn from './ProfileNotifications.module.css'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
]

export default function ProfileNotifications() {
  const navigate = useNavigate()
  const { showFlash } = useFlash()

  const [notifications, setNotifications] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [filters, setFilters] = useState({ search: '', status: 'all', page: '1' })
  const pageParam = parseInt(filters.page || '1', 10)

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    notificationsService
      .getAll({
        page: pageParam,
        limit: 10,
        search: filters.search || undefined,
        status: filters.status === 'all' ? undefined : filters.status,
      })
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
  }, [pageParam, filters.search, filters.status])

  const handleControlChange = (patch) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch }
      if (patch.page === undefined) next.page = '1'
      return next
    })
  }

  const handleReset = () => {
    setFilters({ search: '', status: 'all', page: '1' })
  }

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
  const isDirty = Boolean(filters.search && filters.search.trim()) || filters.status !== 'all'
  const activeFiltersCount = filters.status !== 'all' ? 1 : 0

  function customFilterRow() {
    return (
      <div className={fc.col}>
        <span className={fc.colLabel}>Status</span>
        <SelectDropdown
          value={filters.status}
          options={STATUS_OPTIONS}
          onChange={(val) => handleControlChange({ status: val })}
          ariaLabel="Filter by read status"
        />
      </div>
    )
  }

  return (
    <div className={s.tabContent}>
      <FeedControls
        params={filters}
        onChange={handleControlChange}
        onReset={handleReset}
        placeholder="Search notifications…"
        activeFiltersCount={activeFiltersCount}
        isDirty={isDirty}
        searchAriaLabel="Search notifications"
        showActiveTags={false}
        customFilterRow={customFilterRow()}
      />

      {notifications.length > 0 && (
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
            disabled={notifications.length === 0}>
            Delete all
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className={s.state}>
          {isDirty ? 'No notifications match your filters.' : 'No notifications yet.'}
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
        currentPage={pageParam}
        totalPages={totalPages}
        onPageChange={(p) => handleControlChange({ page: String(p) })}
        hideOnSinglePage
      />
    </div>
  )
}
