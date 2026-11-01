import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { usersService } from '../services/users.service'
import { useFlash } from '../hooks/useFlash'
import ActionModal from '../components/ui/ActionModal'
import FeedControls from '../components/posts/FeedControls'
import Pagination from '../components/ui/Pagination'
import { SelectDropdown } from '../components/ui/SelectDropdown'
import Avatar from '../components/ui/Avatar'
import s from './Admin.module.css'

import {
  IconUser,
  IconTrash,
  IconBan,
  IconCheck,
  IconRefresh,
  IconArrowUp,
  IconArrowDown,
  IconPlus,
} from '../components/ui/Icons'

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

const CREATE_ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Superadmin' },
]

const MIN_PASSWORD = 8

function validateNewUser(form) {
  const e = {}
  if (!form.login.trim()) e.login = 'Login is required'
  else if (form.login.trim().length < 3) e.login = 'At least 3 characters'
  else if (!/^[a-zA-Z0-9_]+$/.test(form.login)) e.login = 'Letters, numbers and _ only'

  if (!form.full_name.trim()) e.full_name = 'Full name is required'

  if (!form.email.trim()) e.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address'

  if (!form.password) e.password = 'Password is required'
  else if (form.password.length < MIN_PASSWORD) e.password = `At least ${MIN_PASSWORD} characters`

  if (!form.confirmed_password) e.confirmed_password = 'Please confirm the password'
  else if (form.password !== form.confirmed_password) e.confirmed_password = 'Passwords do not match'

  return e
}

const BAN_DURATION_UNIT_OPTIONS = [
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
]

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
        setError(err?.message ?? 'Failed to load users')
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

  function rowActionButtons(user) {
    const isSelf = Number(currentUser?.id) === Number(user.id)
    const isSuper = user.role === 'superadmin'
    const isAdmin = user.role === 'admin'
    const isUser = user.role === 'user'
    const isRoleBusy = roleLoadingId === user.id
    const targetLevel = ROLE_LEVELS[user.role] ?? 0

    const canPromote = isSuperadmin && !isSelf && isUser && !isRoleBusy
    const canDemote = isSuperadmin && !isSelf && isAdmin && !isRoleBusy

    let promoteTitle = 'Promote to admin'
    if (!isSuperadmin) {
      promoteTitle = 'Only superadmins can change user roles'
    } else if (isSelf) {
      promoteTitle = 'Cannot modify your own role'
    } else if (isSuper) {
      promoteTitle = 'Cannot promote superadmin'
    } else if (isAdmin) {
      promoteTitle = 'User is already an admin'
    }

    let demoteTitle = 'Demote to user'
    if (!isSuperadmin) {
      demoteTitle = 'Only superadmins can change user roles'
    } else if (isSelf) {
      demoteTitle = 'Cannot modify your own role'
    } else if (isSuper) {
      demoteTitle = 'Cannot demote superadmin'
    } else if (isUser) {
      demoteTitle = 'User is already at the lowest role'
    }

    const canBanUser = !isSelf && issuerLevel > targetLevel
    let banTitle = user.is_banned ? 'Unban user' : 'Ban user'
    if (isSelf) {
      banTitle = 'Cannot ban or unban your own account'
    } else if (issuerLevel <= targetLevel) {
      banTitle = 'Cannot ban or unban an account with equal or higher authority'
    }

    const canDeleteUser = isSuperadmin && !isSelf
    return (
      <div className={s.actions}>
        <button
          className={s.actionBtn}
          title={promoteTitle}
          disabled={!canPromote}
          onClick={() => setPromoteTargetUser(user)}
          type="button"
        >
          <IconArrowUp size={13} />
          Promote
        </button>
        <button
          className={s.actionBtn}
          title={demoteTitle}
          disabled={!canDemote}
          onClick={() => setDemoteTargetUser(user)}
          type="button"
        >
          <IconArrowDown size={13} />
          Demote
        </button>
        {user.is_banned ? (
          <button
            className={`${s.actionBtn} ${s.actionBanBtn}`}
            title={banTitle}
            disabled={!canBanUser}
            onClick={() => setUnbanTargetUser(user)}
            type="button"
          >
            <IconCheck size={14} />
            Unban
          </button>
        ) : (
          <button
            className={`${s.actionBtn} ${s.actionBanBtn}`}
            title={banTitle}
            disabled={!canBanUser}
            onClick={() => openBanModal(user)}
            type="button"
          >
            <IconBan size={14} />
            Ban
          </button>
        )}
        {canDeleteUser && (
          <button
            className={`${s.actionBtn} ${s.actionDangerBtn}`}
            title="Delete user"
            onClick={() => setDeleteTargetUser(user)}
            type="button"
          >
            <IconTrash size={14} />
            Delete
          </button>
        )}
      </div>
    )
  }

  function rowFromUser(user) {
    return (
      <tr key={user.id} className={user.is_banned ? s.bannedRow : ''}>
        <td className={s.colAvatar}>
          <Avatar
            userId={user.id}
            avatarPath={user.profile_picture_path}
            name={user.login || user.full_name}
            size="medium"
          />
        </td>
        <td className={s.loginCell}>{user.login}</td>
        <td className={`${s.dimCell} ${s.colRating}`}>{user.rating ?? 0}</td>
        <td className={`${s.dimCell} ${s.colFullName}`}>{user.full_name ?? '—'}</td>
        <td className={`${s.dimCell} ${s.colEmail}`}>{user.email}</td>
        <td>
          <span className={`${s.roleBadge} ${s[`role_${user.role}`]}`}>
            {user.role}
          </span>
        </td>
        <td>
          <span className={`${s.statusBadge} ${user.is_banned ? s.statusBanned : s.statusActive}`}>
            {user.is_banned ? 'Banned' : 'Active'}
          </span>
        </td>
        <td>
          {rowActionButtons(user)}
        </td>
      </tr>
    )
  }

  function addUserModal() {
    return (
      <ActionModal
        title="Create User"
        confirmText="Create User"
        isLoading={addUserLoading}
        onConfirm={handleAddUserSubmit}
        onClose={closeAddUserModal}
      >
        <label className={s.formLabel}>
          Login <span className={s.required}>*</span>
          <input
            className={s.input}
            type="text"
            placeholder="cool_username"
            value={addUserForm.login}
            onChange={handleAddUserChange('login')}
            autoFocus
            required
          />
          {addUserErrors.login && <span className={s.fieldError}>{addUserErrors.login}</span>}
        </label>

        <label className={s.formLabel}>
          Full name <span className={s.required}>*</span>
          <input
            className={s.input}
            type="text"
            placeholder="John Doe"
            value={addUserForm.full_name}
            onChange={handleAddUserChange('full_name')}
            required
          />
          {addUserErrors.full_name && <span className={s.fieldError}>{addUserErrors.full_name}</span>}
        </label>

        <label className={s.formLabel}>
          Email <span className={s.required}>*</span>
          <input
            className={s.input}
            type="email"
            placeholder="you@example.com"
            value={addUserForm.email}
            onChange={handleAddUserChange('email')}
            required
          />
          {addUserErrors.email && <span className={s.fieldError}>{addUserErrors.email}</span>}
        </label>

        <label className={s.formLabel}>
          Password <span className={s.required}>*</span>
          <input
            className={s.input}
            type="password"
            placeholder="••••••••"
            value={addUserForm.password}
            onChange={handleAddUserChange('password')}
            required
          />
          {addUserErrors.password && <span className={s.fieldError}>{addUserErrors.password}</span>}
        </label>

        <label className={s.formLabel}>
          Confirm password <span className={s.required}>*</span>
          <input
            className={s.input}
            type="password"
            placeholder="••••••••"
            value={addUserForm.confirmed_password}
            onChange={handleAddUserChange('confirmed_password')}
            required
          />
          {addUserErrors.confirmed_password && (
            <span className={s.fieldError}>{addUserErrors.confirmed_password}</span>
          )}
        </label>

        <label className={s.formLabel}>
          Role
          <SelectDropdown
            value={addUserForm.role}
            options={CREATE_ROLE_OPTIONS}
            onChange={(val) => setAddUserForm((prev) => ({ ...prev, role: val }))}
            ariaLabel="New user role"
          />
        </label>
      </ActionModal>
    )
  }

  function banModal() {
    return (
      <ActionModal
        title={`Ban User: ${banTargetUser.login}`}
        details={[
          { label: 'User', value: banTargetUser.login },
          { label: 'Email', value: banTargetUser.email },
          { label: 'Role', value: banTargetUser.role },
        ]}
        confirmText="Ban User"
        isDanger={true}
        isLoading={banLoading}
        disabled={!banReason.trim()}
        onConfirm={handleBanSubmit}
        onClose={closeBanModal}
      >
        <label className={s.formLabel}>
          Reason <span className={s.required}>*</span>
          <input
            className={s.input}
            type="text"
            placeholder="State the reason for this ban..."
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            autoFocus
            required
          />
        </label>

        <label className={s.formLabel}>
          Duration
          <div className={s.durationRow}>
            <input
              className={`${s.input} ${s.durationInput}`}
              type="number"
              placeholder="Leave blank for permanent ban"
              value={banDuration}
              onChange={(e) => setBanDuration(e.target.value)}
              min={1}
            />
            <SelectDropdown
              className={s.durationUnit}
              value={banDurationUnit}
              options={BAN_DURATION_UNIT_OPTIONS}
              onChange={setBanDurationUnit}
              ariaLabel="Ban duration unit"
            />
          </div>
        </label>
      </ActionModal>
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
            >
              <IconPlus size={14} />
              Create User
            </button>
          )
        }
      />

      {showAddUserModal && addUserModal()}

      {isLoading && (
        <div className={s.feedState}>
          <div className={s.spinner} />
          <span>Loading users…</span>
        </div>
      )}

      {!isLoading && error && (
        <div className={s.feedState}>
          <p className={s.errorTitle}>Error</p>
          <p className={s.errorMsg}>{error}</p>
          <button className={s.retryBtn} onClick={() => setRetryCount((c) => c + 1)}>
            <IconRefresh size={14} /> Retry
          </button>
        </div>
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
              {users.map(rowFromUser)}
            </tbody>
          </table>
        </div>
      )}

      {banTargetUser && banModal()}

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

