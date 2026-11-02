import { useEffect, useState } from 'react'
import { leaderboardService } from '../services/leaderboard.service'
import TabBar from '../components/ui/TabBar'
import Pagination from '../components/ui/Pagination'
import LeaderboardList from '../components/leaderboard/LeaderboardList'
import { IconTrophy, IconArrowUp, IconRefresh } from '../components/ui/Icons'
import NavButtons from '../components/ui/NavButtons'
import s from './Leaderboard.module.css'

const LEADERS_PER_PAGE = 10

const TABS = [
  { id: 'overall', label: 'Overall', icon: IconTrophy },
  { id: 'weekly', label: 'Weekly', icon: IconArrowUp },
]

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('overall')
  const [page, setPage] = useState(1)
  const [users, setUsers] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const requestKey = `${activeTab}:${page}:${retryCount}`
  const [resolvedKey, setResolvedKey] = useState(null)
  const loading = resolvedKey !== requestKey

  useEffect(() => {
    let isMounted = true
    const fetchPage = activeTab === 'weekly' ? leaderboardService.getWeekly : leaderboardService.getOverall

    fetchPage({ page, limit: LEADERS_PER_PAGE })
      .then((res) => {
        if (!isMounted) return
        setUsers(res.data?.data ?? [])
        setTotalPages(res.data?.pagination?.totalPages ?? 1)
        setError(false)
      })
      .catch(() => {
        if (!isMounted) return
        setUsers([])
        setError(true)
      })
      .finally(() => {
        if (isMounted) setResolvedKey(requestKey)
      })

    return () => {
      isMounted = false
    }
  }, [activeTab, page, retryCount, requestKey])

  function handleTabChange(tab) {
    setActiveTab(tab)
    setPage(1)
  }

  function renderBody() {
    if (loading) {
      return (
        <div className={s.feedState}>
          <div className={s.spinner} />
          <span>Loading leaderboard…</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className={s.feedState}>
          <p className={s.errorTitle}>Error</p>
          <p className={s.errorMsg}>Could not load the leaderboard.</p>
          <button className={s.retryBtn} onClick={() => setRetryCount((c) => c + 1)}>
            <IconRefresh size={14} /> Retry
          </button>
        </div>
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
