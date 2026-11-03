import { useState, useEffect } from 'react'
import { usersService } from '../services/users.service'
import FeedControls from '../components/posts/FeedControls'
import Pagination from '../components/ui/Pagination'
import ActionModal from '../components/ui/ActionModal'
import { useFlash } from '../hooks/useFlash'
import { useDebouncedCallback } from '../hooks/useDebounce'
import BanLogFilterRow from './admin/BanLogFilterRow'
import BanLogRow from './admin/BanLogRow'
import ErrorState from '../components/ui/ErrorState'
import Loading from '../components/ui/Loading'
import { IconBan } from '../components/ui/Icons'
import s from './Admin.module.css'

const BANS_PER_PAGE = 10

const DEFAULT_FILTERS = {
  search: '',
  status: '',
  targetUser: '',
  bannedBy: '',
  sortBy: 'banned_at',
  order: 'desc',
  dateFrom: '',
  dateTo: '',
  page: '1',
}

export default function AdminPanelBansTab() {
  const { showFlash } = useFlash()

  const [bans, setBans] = useState([])
  const [total, setTotal] = useState(0)
  const [filterParams, setFilterParams] = useState(DEFAULT_FILTERS)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [loadedKey, setLoadedKey] = useState(null)

  const [unbanTarget, setUnbanTarget] = useState(null)
  const [unbanLoading, setUnbanLoading] = useState(false)

  const [targetUserInput, setTargetUserInput] = useState('')
  const [bannedByInput, setBannedByInput] = useState('')

  const handleControlChange = (patch) => {
    setFilterParams((prev) => {
      const next = { ...prev, ...patch }
      if (patch.page === undefined) next.page = '1'
      return next
    })
  }

  const [debouncedTargetUser] = useDebouncedCallback((val) => handleControlChange({ targetUser: val }), 400)
  const [debouncedBannedBy] = useDebouncedCallback((val) => handleControlChange({ bannedBy: val }), 400)

  const pageParam = parseInt(filterParams.page || '1', 10)
  const currentKey = `${filterParams.search}|${filterParams.status}|${filterParams.targetUser}|${filterParams.bannedBy}|${filterParams.sortBy}|${filterParams.order}|${filterParams.dateFrom}|${filterParams.dateTo}|${pageParam}|${retryCount}`
  const isLoading = loadedKey !== currentKey
  const totalPages = Math.max(1, Math.ceil(total / BANS_PER_PAGE))

  useEffect(() => {
    let isMounted = true

    const params = { page: pageParam, limit: BANS_PER_PAGE }
    if (filterParams.search.trim()) params.search = filterParams.search.trim()
    if (filterParams.status) params.status = filterParams.status
    if (filterParams.targetUser.trim()) params.targetUser = filterParams.targetUser.trim()
    if (filterParams.bannedBy.trim()) params.bannedBy = filterParams.bannedBy.trim()
    if (filterParams.sortBy) params.sortBy = filterParams.sortBy
    if (filterParams.order) params.order = filterParams.order
    if (filterParams.dateFrom) params.dateFrom = filterParams.dateFrom
    if (filterParams.dateTo) params.dateTo = filterParams.dateTo

    usersService
      .getBanLogs(params)
      .then((res) => {
        if (!isMounted) return
        const data = res.data
        setBans(data.data ?? [])
        setTotal(data.pagination?.totalItems ?? data.pagination?.total ?? 0)
        setError(null)
        setLoadedKey(currentKey)
      })
      .catch((err) => {
        if (!isMounted) return
        setBans([])
        setTotal(0)
        setError(err)
        setLoadedKey(currentKey)
      })

    return () => {
      isMounted = false
    }
  }, [pageParam, filterParams, retryCount, currentKey])

  const handleResetBans = () => {
    setTargetUserInput('')
    setBannedByInput('')
    setFilterParams(DEFAULT_FILTERS)
  }

  const handleSortToggle = (field) => {
    setFilterParams((prev) => {
      const isCurrent = prev.sortBy === field
      const nextOrder = isCurrent && prev.order === 'desc' ? 'asc' : 'desc'
      return { ...prev, sortBy: field, order: nextOrder, page: '1' }
    })
  }

  const isSortChanged = filterParams.sortBy !== 'banned_at' || filterParams.order !== 'desc'
  const activeFiltersCount =
    (filterParams.status ? 1 : 0) +
    (filterParams.targetUser ? 1 : 0) +
    (filterParams.bannedBy ? 1 : 0) +
    (filterParams.dateFrom || filterParams.dateTo ? 1 : 0) +
    (isSortChanged ? 1 : 0)
  const isDirty = Boolean(filterParams.search.trim()) || activeFiltersCount > 0

  const confirmUnban = async () => {
    if (!unbanTarget) return
    setUnbanLoading(true)
    try {
      await usersService.ban(unbanTarget.user_id, { ban: false })
      setBans((prev) =>
        prev.map((b) => (b.id === unbanTarget.id ? { ...b, unbanned_at: new Date().toISOString() } : b))
      )
      showFlash(`User "${unbanTarget.target_login}" has been unbanned`)
      setUnbanTarget(null)
    } catch (err) {
      showFlash(err?.message ?? 'Failed to unban user', 'error')
    } finally {
      setUnbanLoading(false)
    }
  }

  function sortableHeader(field, label) {
    return (
      <th
        className={`${s.sortableTh} ${field !== 'target_login' ? s.colPublishDate : ''}`}
        onClick={() => handleSortToggle(field)}
        title={`Sort by ${label.toLowerCase()}`}
      >
        {label} {filterParams.sortBy === field ? (filterParams.order === 'asc' ? '↑' : '↓') : ''}
      </th>
    )
  }

  function unbanModal() {
    return (
      <ActionModal
        title={`Unban User: ${unbanTarget.target_login}`}
        message={`Restore access for user "${unbanTarget.target_login}"? They will be able to log in and interact on the platform again.`}
        details={[
          { label: 'User', value: unbanTarget.target_login },
          { label: 'Reason', value: unbanTarget.reason ?? '—' },
        ]}
        confirmText="Unban User"
        isLoading={unbanLoading}
        onConfirm={confirmUnban}
        onClose={() => setUnbanTarget(null)}
      />
    )
  }

  function banLogTable() {
    const targetSuggestions = [...new Set(bans.map((b) => b.target_login).filter(Boolean))]
    const issuerSuggestions = [...new Set(bans.map((b) => b.issuer_login).filter(Boolean))]

    return (
      <>
        <FeedControls
          params={filterParams}
          onChange={handleControlChange}
          onReset={handleResetBans}
          placeholder="Search by username, email or reason…"
          showFiltersToggle={true}
          activeFiltersCount={activeFiltersCount}
          isDirty={isDirty}
          searchAriaLabel="Search ban logs"
          customFilterRow={
            <BanLogFilterRow
              filterParams={filterParams}
              targetUserInput={targetUserInput}
              bannedByInput={bannedByInput}
              targetSuggestions={targetSuggestions}
              issuerSuggestions={issuerSuggestions}
              onTargetUserChange={(val) => {
                setTargetUserInput(val)
                debouncedTargetUser(val)
              }}
              onBannedByChange={(val) => {
                setBannedByInput(val)
                debouncedBannedBy(val)
              }}
              onStatusChange={(val) => handleControlChange({ status: val })}
              onSortByChange={(val) => handleControlChange({ sortBy: val })}
              onOrderChange={(val) => handleControlChange({ order: val })}
              onDateFromChange={(val) => handleControlChange({ dateFrom: val })}
              onDateToChange={(val) => handleControlChange({ dateTo: val })}
            />
          }
        />

        {isLoading && <Loading message="Loading ban logs…" />}

        {!isLoading && error && (
          <ErrorState
            error={error}
            message="Failed to load ban logs."
            onRetry={() => setRetryCount((c) => c + 1)}
          />
        )}

        {!isLoading && !error && bans.length === 0 && (
          <div className={s.feedState}>
            <IconBan size={32} />
            <p>No ban records found{filterParams.search ? ` matching "${filterParams.search}"` : ''}</p>
          </div>
        )}

        {!isLoading && !error && bans.length > 0 && (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th className={s.colAvatar}>Avatar</th>
                  {sortableHeader('target_login', 'Target User')}
                  <th>Banned By</th>
                  <th>Reason</th>
                  {sortableHeader('banned_at', 'Banned At')}
                  {sortableHeader('expires_at', 'Expires At')}
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bans.map((ban) => (
                  <BanLogRow key={ban.id} ban={ban} onUnbanClick={setUnbanTarget} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {unbanTarget && unbanModal()}

        {!isLoading && !error && (totalPages > 1 || total > BANS_PER_PAGE) && (
          <div className={s.paginationWrapper}>
            <Pagination
              currentPage={pageParam}
              totalPages={totalPages}
              onPageChange={(p) => handleControlChange({ page: String(p) })}
            />
          </div>
        )}
      </>
    )
  }

  return (
    <div className={s.tabContent}>
      <div className={s.sectionHeader}>
        <div className={s.sectionTitle}>
          <IconBan size={16} />
          <span>Ban Logs</span>
        </div>
        <span className={s.countBadge}>{total}</span>
      </div>

      {banLogTable()}
    </div>
  )
}
