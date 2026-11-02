import LeaderboardRow from './LeaderboardRow'
import s from './LeaderboardList.module.css'

export default function LeaderboardList({ users, mode, rankOffset = 0 }) {
  return (
    <div className={s.list}>
      {users.map((user, idx) => (
        <LeaderboardRow key={user.id} user={user} mode={mode} rank={rankOffset + idx + 1} />
      ))}
    </div>
  )
}
