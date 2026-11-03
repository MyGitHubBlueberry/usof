import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { usersService } from '../services/users.service'
import { useFlash } from '../hooks/useFlash'
import ActionModal from '../components/ui/ActionModal'
import FeedControls from '../components/posts/FeedControls'
import Pagination from '../components/ui/Pagination'
import { SelectDropdown } from '../components/ui/SelectDropdown'
import UserTableRow from './admin/UserTableRow'
import AddUserModal from './admin/AddUserModal'
import BanUserModal from './admin/BanUserModal'
import ErrorState from '../components/ui/ErrorState'
import Loading from '../components/ui/Loading'
import { validateLogin, validatePassword, validateConfirmedPassword } from '../utils/validators'
import s from './Admin.module.css'

import { IconUser, IconPlus } from '../components/ui/Icons'

const USERS_PER_PAGE = 10

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Superadmin' },
]

const USER_STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'banned', label: 'Banned' },
]

const USER_SORT_OPTIONS = [
  { value: 'login', label: 'Username' },
  { value: 'email', label: 'Email' },
  { value: 'rating', label: 'Rating' },
]

const USER_ORDER_OPTIONS = [
  { value: 'asc', label: 'Ascending (A–Z)' },
  { value: 'desc', label: 'Descending (Z–A)' },
]

function validateNewUser(form) {
  const e = {}
  const loginError = validateLogin(form.login)
  if (loginError) e.login = loginError

  if (!form.full_name.trim()) e.full_name = 'Full name is required'

  if (!form.email.trim()) e.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address'

  const passwordError = validatePassword(form.password)
  if (passwordError) e.password = passwordError

  const confirmedPasswordError = validateConfirmedPassword(form.password, form.confirmed_password)
  if (confirmedPasswordError) e.confirmed_password = confirmedPasswordError

  return e
}

const ROLE_LEVELS = {
  user: 1,
  admin: 2,
  superadmin: 3,
}

export default function UsersTab() {
  const currentUser = useSelector((state) => state.auth.user)
  const isSuperadmin = currentUser?.role === 'superadmin'
  const issuerLevel = ROLE_LEVELS[currentUser?.role] ?? 0

  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [userFilters, setUserFilters] = useState({
    search: '',
    role: '',
    status: '',
    sortBy: 'login',
    order: 'asc',
    page: '1',
  })
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [loadedKey, setLoadedKey] = useState(null)

  const [roleLoadingId, setRoleLoadingId] = useState(null)
  const [banTargetUser, setBanTargetUser] = useState(null)
  const [banReason, setBanReason] = useState('')
  const [banDuration, setBanDuration] = useState('')
  const [banDurationUnit, setBanDurationUnit] = useState('days')
  const [banLoading, setBanLoading] = useState(false)
  const [promoteTargetUser, setPromoteTargetUser] = useState(null)
  const [demoteTargetUser, setDemoteTargetUser] = useState(null)
  const [unbanTargetUser, setUnbanTargetUser] = useState(null)
  const [unbanLoading, setUnbanLoading] = useState(false)
  const [deleteTargetUser, setDeleteTargetUser] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [addUserForm, setAddUserForm] = useState({
    login: '',
    full_name: '',
    email: '',
    password: '',
    confirmed_password: '',
    role: 'user',
  })
  const [addUserTouched, setAddUserTouched] = useState(false)
  const [addUserLoading, setAddUserLoading] = useState(false)
  const { showFlash } = useFlash()

  const pageParam = parseInt(userFilters.page || '1', 10)
  const currentKey = `${pageParam}|${userFilters.search}|${userFilters.role}|${userFilters.status}|${userFilters.sortBy}|${userFilters.order}|${retryCount}`
  const isLoading = loadedKey !== currentKey

  const totalPages = Math.max(1, Math.ceil(total / USERS_PER_PAGE))

  useEffect(() => {
    let isMounted = true

    const params = { page: pageParam, limit: USERS_PER_PAGE }
    if (userFilters.search.trim()) params.search = userFilters.search.trim()
    if (userFilters.role) params.role = userFilters.role
    if (userFilters.status) params.status = userFilters.status
    if (userFilters.sortBy) params.sortBy = userFilters.sortBy
    if (userFilters.order) params.order = userFilters.order

    usersService
      .getAll(params)
      .then((res) => {
        if (!isMounted) return
        const data = res.data
        setUsers(data.data ?? data.users ?? (Array.isArray(data) ? data : []))
        setTotal(data.pagination?.totalItems ?? data.total ?? data.count ?? 0)
        setError(null)
        setLoadedKey(currentKey)
      })
      .catch((err) => {
        if (!isMounted) return
        setUsers([])
        setTotal(0)
        setError(err)
        setLoadedKey(currentKey)
      })

    return () => {
      isMounted = false
    }
  }, [pageParam, userFilters, retryCount, currentKey])

  const handleControlChange = (patch) => {
    setUserFilters((prev) => {
      const next = { ...prev, ...patch }
      if (patch.page === undefined) next.page = '1'
      return next
    })
  }

  const handleResetUsers = () => {
    setUserFilters({
      search: '',
      role: '',
      status: '',
      sortBy: 'login',
      order: 'asc',
      page: '1',
    })
  }

  const handleUserSortToggle = (field) => {
    setUserFilters((prev) => {
      const isCurrent = prev.sortBy === field
      const nextOrder = isCurrent && prev.order === 'desc' ? 'asc' : 'desc'
      return { ...prev, sortBy: field, order: nextOrder, page: '1' }
    })
  }

  const isUserSortChanged =
    (userFilters.sortBy && userFilters.sortBy !== 'login') ||
    (userFilters.order && userFilters.order !== 'asc')

  const usersActiveCount =
    (userFilters.role ? 1 : 0) +
    (userFilters.status ? 1 : 0) +
    (isUserSortChanged ? 1 : 0)

  const usersIsDirty =
    Boolean(userFilters.search && userFilters.search.trim()) ||
    usersActiveCount > 0

  const confirmPromoteUser = async () => {
    if (!promoteTargetUser) return
    setRoleLoadingId(promoteTargetUser.id)
    try {
      await usersService.updateRole(promoteTargetUser.id, 'admin')
      setUsers((prev) => prev.map((u) => (u.id === promoteTargetUser.id ? { ...u, role: 'admin' } : u)))
      showFlash(`Promoted "${promoteTargetUser.login}" to admin`)
      setPromoteTargetUser(null)
    } catch (err) {
      showFlash(err?.message ?? 'Failed to promote user', 'error')
    } finally {
      setRoleLoadingId(null)
    }
  }

  const confirmDemoteUser = async () => {
    if (!demoteTargetUser) return
    setRoleLoadingId(demoteTargetUser.id)
    try {
      await usersService.updateRole(demoteTargetUser.id, 'user')
      setUsers((prev) => prev.map((u) => (u.id === demoteTargetUser.id ? { ...u, role: 'user' } : u)))
      showFlash(`Demoted "${demoteTargetUser.login}" to user`)
      setDemoteTargetUser(null)
    } catch (err) {
      showFlash(err?.message ?? 'Failed to demote user', 'error')
    } finally {
      setRoleLoadingId(null)
    }
  }

  const confirmDeleteUser = async () => {
    if (!deleteTargetUser) return
    setDeleteLoading(true)
    try {
      await usersService.deleteById(deleteTargetUser.id)
      setUsers((prev) => prev.filter((u) => u.id !== deleteTargetUser.id))
      setTotal((prev) => Math.max(0, prev - 1))
      showFlash('User deleted')
      setDeleteTargetUser(null)
    } catch (err) {
      showFlash(err?.message ?? 'Failed to delete user', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  const closeAddUserModal = () => {
    setShowAddUserModal(false)
    setAddUserTouched(false)
    setAddUserForm({
      login: '',
      full_name: '',
      email: '',
      password: '',
      confirmed_password: '',
      role: 'user',
    })
  }

  const handleAddUserChange = (field) => (e) => {
    setAddUserForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const addUserErrors = addUserTouched ? validateNewUser(addUserForm) : {}

  const handleAddUserSubmit = async (e) => {
    e.preventDefault()
    setAddUserTouched(true)
    if (Object.keys(validateNewUser(addUserForm)).length > 0) return

    setAddUserLoading(true)
    try {
      await usersService.create(addUserForm)
      showFlash(`User "${addUserForm.login}" created`)
      closeAddUserModal()
      setRetryCount((c) => c + 1)
    } catch (err) {
      showFlash(err?.message ?? 'Failed to create user', 'error')
    } finally {
      setAddUserLoading(false)
    }
  }

  const openBanModal = (user) => {
    setBanTargetUser(user)
    setBanReason('')
    setBanDuration('')
    setBanDurationUnit('days')
  }

  const closeBanModal = () => {
    setBanTargetUser(null)
    setBanReason('')
    setBanDuration('')
    setBanDurationUnit('days')
  }

  const handleBanSubmit = async () => {
    if (!banTargetUser) return
    if (!banReason.trim()) {
      showFlash('Ban reason is required', 'error')
      return
    }
    setBanLoading(true)
    try {
      const payload = {
        ban: true,
        reason: banReason.trim(),
      }
      if (banDuration && Number(banDuration) > 0) {
        const expDate = new Date()
        if (banDurationUnit === 'hours') {
          expDate.setHours(expDate.getHours() + parseInt(banDuration, 10))
        } else {
          expDate.setDate(expDate.getDate() + parseInt(banDuration, 10))
        }
        payload.expires_at = expDate.toISOString()
      }
      await usersService.ban(banTargetUser.id, payload)
      setUsers((prev) => prev.map((u) => (u.id === banTargetUser.id ? { ...u, is_banned: true } : u)))
      closeBanModal()
      showFlash(`User "${banTargetUser.login}" has been banned`)
    } catch (err) {
      showFlash(err?.message ?? 'Failed to ban user', 'error')
    } finally {
      setBanLoading(false)
    }
  }

  const confirmUnbanUser = async () => {
    if (!unbanTargetUser) return
    setUnbanLoading(true)
    try {
      await usersService.ban(unbanTargetUser.id, { ban: false })
      setUsers((prev) => prev.map((u) => (u.id === unbanTargetUser.id ? { ...u, is_banned: false } : u)))
      showFlash(`User "${unbanTargetUser.login}" has been unbanned`)
      setUnbanTargetUser(null)
    } catch (err) {
      showFlash(err?.message ?? 'Failed to unban user', 'error')
    } finally {
      setUnbanLoading(false)
    }
  }

  function customFilterRow() {
    return (
      <div className={s.userFiltersRow}>
        <div className={s.filterGroup}>
          <span className={s.filterGroupLabel}>Role</span>
          <SelectDropdown
            value={userFilters.role || ''}
            options={ROLE_OPTIONS}
            onChange={(val) => handleControlChange({ role: val })}
            ariaLabel="Filter by role"
          />
        </div>
        <div className={s.filterGroup}>
          <span className={s.filterGroupLabel}>Status</span>
          <SelectDropdown
            value={userFilters.status || ''}
            options={USER_STATUS_OPTIONS}
            onChange={(val) => handleControlChange({ status: val })}
            ariaLabel="Filter by status"
          />
        </div>
        <div className={s.filterGroup}>
          <span className={s.filterGroupLabel}>Sort by</span>
          <SelectDropdown
            value={userFilters.sortBy || 'login'}
            options={USER_SORT_OPTIONS}
            onChange={(val) => handleControlChange({ sortBy: val })}
            ariaLabel="Sort by"
          />
        </div>
        <div className={s.filterGroup}>
          <span className={s.filterGroupLabel}>Order</span>
          <SelectDropdown
            value={userFilters.order || 'asc'}
            options={USER_ORDER_OPTIONS}
            onChange={(val) => handleControlChange({ order: val })}
            ariaLabel="Sort order"
          />
        </div>
      </div>
    )
  }

  function promoteModal() {
    return (
      <ActionModal
        title={`Promote User: ${promoteTargetUser.login}`}
        message={`Promote "${promoteTargetUser.login}" to admin? They will be granted elevated permissions.`}
        details={[
          { label: 'User', value: promoteTargetUser.login },
          { label: 'Current Role', value: promoteTargetUser.role },
        ]}
        confirmText="Promote to Admin"
        isLoading={roleLoadingId === promoteTargetUser.id}
        onConfirm={confirmPromoteUser}
        onClose={() => setPromoteTargetUser(null)}
      />
    )
  }

  function demoteModal() {
    return (
      <ActionModal
        title={`Demote User: ${demoteTargetUser.login}`}
        message={`Demote "${demoteTargetUser.login}" to regular user? Their admin privileges will be revoked.`}
        details={[
          { label: 'User', value: demoteTargetUser.login },
          { label: 'Current Role', value: demoteTargetUser.role },
        ]}
        confirmText="Demote to User"
        isDanger={true}
        isLoading={roleLoadingId === demoteTargetUser.id}
        onConfirm={confirmDemoteUser}
        onClose={() => setDemoteTargetUser(null)}
      />
    )
  }

  function unbanModal() {
    return (
      <ActionModal
        title={`Unban User: ${unbanTargetUser.login}`}
        message={`Restore access for user "${unbanTargetUser.login}"? They will be able to log in and interact on the platform again.`}
        details={[
          { label: 'User', value: unbanTargetUser.login },
          { label: 'Email', value: unbanTargetUser.email },
        ]}
        confirmText="Unban User"
        isLoading={unbanLoading}
        onConfirm={confirmUnbanUser}
        onClose={() => setUnbanTargetUser(null)}
      />
    )
  }

  function deleteModal() {
    return (
      <ActionModal
        title={`Delete User: ${deleteTargetUser.login}`}
        message={`Permanently delete user "${deleteTargetUser.login}"? This action cannot be undone.`}
        details={[
          { label: 'User ID', value: deleteTargetUser.id },
          { label: 'Email', value: deleteTargetUser.email },
          { label: 'Role', value: deleteTargetUser.role },
        ]}
        confirmText="Delete User"
        isDanger={true}
        isLoading={deleteLoading}
        onConfirm={confirmDeleteUser}
        onClose={() => setDeleteTargetUser(null)}
      />
    )
  }

  return (
    <div className={s.tabContent}>
      <div className={s.sectionHeader}>
        <div className={s.sectionTitle}>
          <IconUser size={16} />
          <span>Users</span>
        </div>
        <span className={s.countBadge}>{total}</span>
      </div>

      <FeedControls
        params={userFilters}
        onChange={handleControlChange}
        onReset={handleResetUsers}
        placeholder="Search by username or email…"
        showFiltersToggle={true}
        activeFiltersCount={usersActiveCount}
        isDirty={usersIsDirty}
        searchAriaLabel="Search users by username or email"
        customFilterRow={customFilterRow()}
        rightAction={
          isSuperadmin && (
            <button
              className={s.btnPrimary}
              type="button"
              onClick={() => setShowAddUserModal(true)}
              title="Create user"
            >
              <IconPlus size={14} />
              <span className={s.actionBtnLabel}>Create User</span>
            </button>
          )
        }
      />

      {showAddUserModal && (
        <AddUserModal
          form={addUserForm}
          errors={addUserErrors}
          loading={addUserLoading}
          onChange={handleAddUserChange}
          onRoleChange={(val) => setAddUserForm((prev) => ({ ...prev, role: val }))}
          onSubmit={handleAddUserSubmit}
          onClose={closeAddUserModal}
        />
      )}

      {isLoading && <Loading message="Loading users…" />}

      {!isLoading && error && (
        <ErrorState
          error={error}
          message="Failed to load users."
          onRetry={() => setRetryCount((c) => c + 1)}
        />
      )}

      {!isLoading && !error && users.length === 0 && (
        <div className={s.feedState}>
          <IconUser size={32} />
          <p>No users found{userFilters.search ? ` matching "${userFilters.search}"` : ''}</p>
        </div>
      )}

      {!isLoading && !error && users.length > 0 && (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th className={s.colAvatar}>Avatar</th>
                <th
                  className={s.sortableTh}
                  onClick={() => handleUserSortToggle('login')}
                  title="Sort by username"
                >
                  Login {userFilters.sortBy === 'login' ? (userFilters.order === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th
                  className={`${s.sortableTh} ${s.colRating}`}
                  onClick={() => handleUserSortToggle('rating')}
                  title="Sort by rating"
                >
                  Rating {userFilters.sortBy === 'rating' ? (userFilters.order === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className={s.colFullName}>Full Name</th>
                <th
                  className={`${s.sortableTh} ${s.colEmail}`}
                  onClick={() => handleUserSortToggle('email')}
                  title="Sort by email"
                >
                  Email {userFilters.sortBy === 'email' ? (userFilters.order === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  currentUser={currentUser}
                  isSuperadmin={isSuperadmin}
                  issuerLevel={issuerLevel}
                  roleLoadingId={roleLoadingId}
                  onPromote={setPromoteTargetUser}
                  onDemote={setDemoteTargetUser}
                  onBanOpen={openBanModal}
                  onUnbanOpen={setUnbanTargetUser}
                  onDeleteOpen={setDeleteTargetUser}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {banTargetUser && (
        <BanUserModal
          user={banTargetUser}
          reason={banReason}
          duration={banDuration}
          durationUnit={banDurationUnit}
          loading={banLoading}
          onReasonChange={setBanReason}
          onDurationChange={setBanDuration}
          onDurationUnitChange={setBanDurationUnit}
          onSubmit={handleBanSubmit}
          onClose={closeBanModal}
        />
      )}

      {promoteTargetUser && promoteModal()}

      {demoteTargetUser && demoteModal()}

      {unbanTargetUser && unbanModal()}

      {deleteTargetUser && deleteModal()}

      {!isLoading && !error && (totalPages > 1 || total > USERS_PER_PAGE) && (
        <div className={s.paginationWrapper}>
          <Pagination
            currentPage={pageParam}
            totalPages={totalPages}
            onPageChange={(p) => handleControlChange({ page: String(p) })}
          />
        </div>
      )}
    </div>
  )
}

