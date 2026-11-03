import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../../redux/slices/notificationsSlice'
import { useFlash } from '../../hooks/useFlash'
import { toPost } from '../../constants/routes'
import { formatDate } from '../../utils/format'
import Pagination from '../ui/Pagination'
import FeedControls from '../posts/FeedControls'
import { SelectDropdown } from '../ui/SelectDropdown'
import ErrorState from '../ui/ErrorState'
import Loading from '../ui/Loading'
import { IconCheck, IconTrash } from '../ui/Icons'
import s from './ProfileTabContent.module.css'
import sn from './ProfileNotifications.module.css'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
]

export default function ProfileNotifications() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { showFlash } = useFlash()
  const { items: notifications, totalPages, status, error } = useSelector((state) => state.notifications)
  const loading = status === 'pending'

  const [retryCount, setRetryCount] = useState(0)
  const [filters, setFilters] = useState({ search: '', status: 'all', page: '1' })
  const pageParam = parseInt(filters.page || '1', 10)

  useEffect(() => {
    dispatch(
      fetchNotifications({
        page: pageParam,
        limit: 10,
        search: filters.search || undefined,
        status: filters.status === 'all' ? undefined : filters.status,
      })
    )
  }, [dispatch, pageParam, filters.search, filters.status, retryCount])

  const handleRetry = () => setRetryCount((c) => c + 1)

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
    dispatch(markNotificationRead(id))
  }

  function markAllRead() {
    dispatch(markAllNotificationsRead())
  }

  function deleteOne(id) {
    dispatch(deleteNotification(id))
      .unwrap()
      .catch(() => showFlash('Could not delete notification.', 'error'))
  }

  function deleteAll() {
    dispatch(deleteAllNotifications())
      .unwrap()
      .then(() => showFlash('All notifications deleted.', 'success'))
      .catch(() => showFlash('Could not delete notifications.', 'error'))
  }

  function handleNotificationClick(n) {
    if (!n.is_read) {
      dispatch(markNotificationRead(n.id))
    }
    if (n.post_id) {
      navigate(toPost(n.post_id))
    }
  }

  if (loading) {
    return <Loading message="Loading notifications…" />
  }

  if (error) {
    return <ErrorState error={error} message="Could not load notifications." onRetry={handleRetry} />
  }

  const hasUnread = notifications.some((n) => !n.is_read)
  const isDirty = Boolean(filters.search && filters.search.trim()) || filters.status !== 'all'
  const activeFiltersCount = filters.status !== 'all' ? 1 : 0

  function statusFilterControl() {
    return (
      <SelectDropdown
        className={sn.statusFilterWrap}
        value={filters.status}
        options={STATUS_OPTIONS}
        onChange={(val) => handleControlChange({ status: val })}
        ariaLabel="Filter by read status"
      />
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
        customFilterRow={statusFilterControl()}
        rightAction={
          <div className={sn.toolbar}>
            <button
              type="button"
              className={sn.toolbarBtn}
              onClick={markAllRead}
              disabled={!hasUnread}>
              <IconCheck size={14} />
              <span className={sn.btnLabel}>Read All</span>
            </button>
            <button
              type="button"
              className={sn.toolbarBtn}
              onClick={deleteAll}
              disabled={notifications.length === 0}>
              <IconTrash size={14} />
              <span className={sn.btnLabel}>Delete All</span>
            </button>
          </div>
        }
      />

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
