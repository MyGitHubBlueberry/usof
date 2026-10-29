import { Link } from 'react-router-dom'
import { leaderboardService } from '../../services/leaderboard.service'
import { ROUTES, toProfile } from '../../constants/routes'
import { useAsyncData } from '../../hooks/useAsyncData'
import { IconTrophy } from '../ui/Icons'
import Avatar from '../ui/Avatar'
import SidebarWidget from './SidebarWidget'
import sw from './SidebarWidget.module.css'
import s from './LeaderboardWidget.module.css'

export default function LeaderboardWidget() {
  const { data: users, loading } = useAsyncData(
    () => leaderboardService.getOverall(),
    [],
    []
  )

  const topUsers = users.slice(0, 5)

  return (
    <SidebarWidget
      title="Leaderboard"
      icon={<IconTrophy size={14} />}
      actionLink={ROUTES.LEADERBOARD}
      actionText="Top users"
      loading={loading}
      empty={!loading && topUsers.length === 0}
      emptyMessage="No leaders yet"
    >
      <ul className={sw.list}>
        {topUsers.map((u, idx) => {
          const isTop3 = idx < 3

          return (
            <li key={u.id}>
              <Link to={toProfile(u.id)} className={sw.item}>
                <div className={s.userGroup}>
                  <span className={`${s.rank} ${isTop3 ? s.rankTop : ''}`}>
                    {idx + 1}
                  </span>
                  <Avatar
                    userId={u.id}
                    avatarPath={u.profile_picture_path}
                    name={u.login || u.full_name}
                    size="small"
                  />
                  <span className={s.name}>{u.login || u.full_name}</span>
                </div>
                <span className={s.rating}>
                  {u.rating > 0 ? `+${u.rating}` : u.rating}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </SidebarWidget>
  )
}
