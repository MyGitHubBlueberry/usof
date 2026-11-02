import Avatar from '../../components/ui/Avatar'
import { formatFullDate } from '../../utils/format'
import { IconCheck } from '../../components/ui/Icons'
import s from '../Admin.module.css'

const STATUS_LABELS = {
  active: 'Active',
  expired: 'Expired',
  revoked: 'Revoked',
}

function getBanStatus(ban) {
  if (ban.unbanned_at) return 'revoked'
  if (ban.expires_at && new Date(ban.expires_at) < new Date()) return 'expired'
  return 'active'
}

export default function BanLogRow({ ban, onUnbanClick }) {
  const status = getBanStatus(ban)
  const statusClass = status === 'active' ? s.statusBanned : status === 'expired' ? s.statusExpired : s.statusActive

  return (
    <tr>
      <td className={s.colAvatar}>
        <Avatar userId={ban.user_id} avatarPath={ban.target_avatar} name={ban.target_login} size="medium" />
      </td>
      <td className={s.loginCell}>{ban.target_login}</td>
      <td className={s.dimCell}>{ban.issuer_login ?? '—'}</td>
      <td className={`${s.dimCell} ${s.titleCell}`}>{ban.reason ?? '—'}</td>
      <td className={`${s.dimCell} ${s.colPublishDate}`}>{ban.banned_at ? formatFullDate(ban.banned_at) : '—'}</td>
      <td className={`${s.dimCell} ${s.colPublishDate}`}>
        {ban.expires_at ? formatFullDate(ban.expires_at) : 'Permanent'}
      </td>
      <td>
        <span className={`${s.statusBadge} ${statusClass}`}>{STATUS_LABELS[status]}</span>
      </td>
      <td>
        {status === 'active' && (
          <button
            className={s.actionBtn}
            title="Unban user"
            onClick={() => onUnbanClick(ban)}
            type="button"
          >
            <IconCheck size={13} />
            <span className={s.actionBtnLabel}>Unban</span>
          </button>
        )}
      </td>
    </tr>
  )
}
