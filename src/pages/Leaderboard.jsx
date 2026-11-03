import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchLeaderboard } from '../redux/slices/leaderboardSlice'
import TabBar from '../components/ui/TabBar'
import Pagination from '../components/ui/Pagination'
import LeaderboardList from '../components/leaderboard/LeaderboardList'
import ErrorState from '../components/ui/ErrorState'
import Loading from '../components/ui/Loading'
import { IconTrophy, IconArrowUp } from '../components/ui/Icons'
import NavButtons from '../components/ui/NavButtons'
import s from './Leaderboard.module.css'

const LEADERS_PER_PAGE = 10

const TABS = [
  { id: 'overall', label: 'Overall', icon: IconTrophy },
  { id: 'weekly', label: 'Weekly', icon: IconArrowUp },
]

export default function Leaderboard() {
  const dispatch = useDispatch()
  const [activeTab, setActiveTab] = useState('overall')
  const [page, setPage] = useState(1)
  const { items: users, totalPages, status, error } = useSelector((state) => state.leaderboard[activeTab])
  const loading = status === 'idle' || status === 'pending'

  useEffect(() => {
    dispatch(fetchLeaderboard({ mode: activeTab, page, limit: LEADERS_PER_PAGE }))
  }, [dispatch, activeTab, page])

  function handleTabChange(tab) {
    setActiveTab(tab)
    setPage(1)
  }

  function handleRetry() {
    dispatch(fetchLeaderboard({ mode: activeTab, page, limit: LEADERS_PER_PAGE }))
  }

  function renderBody() {
    if (loading) {
      return <Loading message="Loading leaderboard…" />
    }

    if (error) {
      return (
        <ErrorState
          error={error}
          message="Could not load the leaderboard."
          onRetry={handleRetry}
        />
      )
    }

    if (users.length === 0) {
      return (
        <div className={s.feedState}>
          <IconTrophy size={32} />
          <p>{activeTab === 'weekly' ? 'No rating changes this week yet.' : 'No leaders yet.'}</p>
        </div>
      )
    }

    return (
      <>
        <LeaderboardList users={users} mode={activeTab} rankOffset={(page - 1) * LEADERS_PER_PAGE} />
        {totalPages > 1 && (
          <div className={s.paginationWrapper}>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </>
    )
  }

  return (
    <div className={s.page}>
      <NavButtons/>
      <div className={s.header}>
        <IconTrophy size={18} />
        <h1 className={s.title}>Leaderboard</h1>
      </div>

      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} className={s.tabBar} />

      <div className={s.content}>{renderBody()}</div>
    </div>
  )
}
