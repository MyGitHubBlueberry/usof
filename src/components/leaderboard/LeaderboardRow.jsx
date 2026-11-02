import { Link } from 'react-router-dom'
import { toProfile } from '../../constants/routes'
import Avatar from '../ui/Avatar'
import s from './LeaderboardList.module.css'

export default function LeaderboardRow({ user, rank, mode }) {
  const isTopThree = rank <= 3
  const ratingValue = mode === 'weekly' ? user.weekly_rating : user.rating
  const ratingLabel = ratingValue > 0 ? `+${ratingValue}` : ratingValue

  return (
    <Link to={toProfile(user.id)} className={s.row}>
      <span className={`${s.rank} ${isTopThree ? s.rankTop : ''}`}>{rank}</span>

      <Avatar
        userId={user.id}
        avatarPath={user.profile_picture_path}
        name={user.login || user.full_name}
        size="medium"
      />

      <div className={s.nameGroup}>
        <span className={s.login}>{user.login}</span>
        {user.full_name && <span className={s.fullName}>{user.full_name}</span>}
      </div>

      {mode === 'weekly' && (
        <span className={s.totalRating}>{user.total_rating} total</span>
      )}

      <span className={`${s.rating} ${ratingValue < 0 ? s.ratingNegative : ''}`}>{ratingLabel}</span>
    </Link>
  )
}
