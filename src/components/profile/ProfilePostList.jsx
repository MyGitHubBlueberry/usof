import { useEffect, useMemo, useState } from 'react'
import PostCard from '../posts/PostCard'
import FeedControls from '../posts/FeedControls'
import Pagination from '../ui/Pagination'
import ErrorState from '../ui/ErrorState'
import Loading from '../ui/Loading'
import s from './ProfileTabContent.module.css'

const DEFAULT_FILTERS = {
  search: '',
  categories: '',
  status: '',
  sort: 'date',
  order: 'desc',
  dateFrom: '',
  dateTo: '',
  page: '1',
}

export default function ProfilePostList({
  fetchFn,
  emptyMessage = 'No posts found.',
  searchPlaceholder = 'Search posts…',
}) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [posts, setPosts] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  const { search, categories, status, sort, order, dateFrom, dateTo, page } = filters
  const pageParam = parseInt(page, 10) || 1

  const query = useMemo(() => {
    const q = { page: pageParam, limit: 5 }
    if (search) q.search = search
    if (categories) q.categories = categories
    if (status) q.status = status
    if (sort) q.sortBy = sort === 'date' ? 'publish_date' : sort
    if (order) q.order = order
    if (dateFrom) q.dateFrom = dateFrom
    if (dateTo) q.dateTo = dateTo
    return q
  }, [search, categories, status, sort, order, dateFrom, dateTo, pageParam])

  const [resolved, setResolved] = useState({ fetchFn: null, queryKey: null })
  const queryKey = `${JSON.stringify(query)}:${retryCount}`
  const loading = resolved.fetchFn !== fetchFn || resolved.queryKey !== queryKey

  useEffect(() => {
    let isMounted = true

    fetchFn(query)
      .then((res) => {
        if (!isMounted) return
        setPosts(res.data?.data || [])
        setTotalPages(res.data?.pagination?.totalPages || 1)
        setError(null)
      })
      .catch((err) => {
        if (!isMounted) return
        setPosts([])
        setError(err)
      })
      .finally(() => {
        if (isMounted) setResolved({ fetchFn, queryKey })
      })

    return () => {
      isMounted = false
    }
  }, [fetchFn, query, queryKey])

  function handleControlChange(patch) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  function handlePageChange(newPage) {
    setFilters((prev) => ({ ...prev, page: String(newPage) }))
  }

  function handleRetry() {
    setRetryCount((c) => c + 1)
  }

  function renderBody() {
    if (loading) {
      return <Loading message="Loading posts…" />
    }

    if (error) {
      return <ErrorState error={error} message="Could not load posts." onRetry={handleRetry} />
    }

    if (posts.length === 0) {
      return <div className={s.state}>{emptyMessage}</div>
    }

    return (
      <>
        <div className={s.list}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
        <Pagination
          currentPage={pageParam}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          hideOnSinglePage
        />
      </>
    )
  }

  return (
    <div className={s.tabContent}>
      <FeedControls params={filters} onChange={handleControlChange} placeholder={searchPlaceholder} />
      {renderBody()}
    </div>
  )
}
