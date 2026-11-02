import Avatar from '../../components/ui/Avatar'
import { IconArrowUp, IconArrowDown, IconBan, IconCheck, IconTrash } from '../../components/ui/Icons'
import s from '../Admin.module.css'

const ROLE_LEVELS = {
  user: 1,
  admin: 2,
  superadmin: 3,
}

export default function UserTableRow({
  user,
  currentUser,
  isSuperadmin,
  issuerLevel,
  roleLoadingId,
  onPromote,
  onDemote,
  onBanOpen,
  onUnbanOpen,
  onDeleteOpen,
}) {
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
    <tr className={user.is_banned ? s.bannedRow : ''}>
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
        <div className={s.actions}>
          <button
            className={s.actionBtn}
            title={promoteTitle}
            disabled={!canPromote}
            onClick={() => onPromote(user)}
            type="button"
          >
            <IconArrowUp size={13} />
            <span className={s.actionBtnLabel}>Promote</span>
          </button>
          <button
            className={s.actionBtn}
            title={demoteTitle}
            disabled={!canDemote}
            onClick={() => onDemote(user)}
            type="button"
          >
            <IconArrowDown size={13} />
            <span className={s.actionBtnLabel}>Demote</span>
          </button>
          {user.is_banned ? (
            <button
              className={`${s.actionBtn} ${s.actionBanBtn}`}
              title={banTitle}
              disabled={!canBanUser}
              onClick={() => onUnbanOpen(user)}
              type="button"
            >
              <IconCheck size={14} />
              <span className={s.actionBtnLabel}>Unban</span>
            </button>
          ) : (
            <button
              className={`${s.actionBtn} ${s.actionBanBtn}`}
              title={banTitle}
              disabled={!canBanUser}
              onClick={() => onBanOpen(user)}
              type="button"
            >
              <IconBan size={14} />
              <span className={s.actionBtnLabel}>Ban</span>
            </button>
          )}
          {canDeleteUser && (
            <button
              className={`${s.actionBtn} ${s.actionDangerBtn}`}
              title="Delete user"
              onClick={() => onDeleteOpen(user)}
              type="button"
            >
              <IconTrash size={14} />
              <span className={s.actionBtnLabel}>Delete</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
