import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPosts, checkForNewPosts, newPostsDismissed } from '../redux/slices/postsFeedSlice'
import { usePolling } from '../hooks/usePolling'
import { POLLING_INTERVALS } from '../constants/polling'
import PostCard from '../components/posts/PostCard'
import FeedControls from '../components/posts/FeedControls'
import Pagination from '../components/ui/Pagination'
import ErrorState from '../components/ui/ErrorState'
import Loading from '../components/ui/Loading'
import { IconChevron } from '../components/ui/Icons'
import s from './Home.module.css'

export default function Home() {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()

  const search = searchParams.get('search') || ''
  const author = searchParams.get('author') || ''
  const categories = searchParams.get('categories') || ''
  const status = searchParams.get('status') || ''
  const sort = searchParams.get('sort') || 'date'
  const order = searchParams.get('order') || 'desc'
  const dateFrom = searchParams.get('dateFrom') || ''
  const dateTo = searchParams.get('dateTo') || ''
  const page = searchParams.get('page') || '1'
  const pageParam = parseInt(page, 10)

  const params = useMemo(
    () => ({ search, author, categories, status, sort, order, dateFrom, dateTo, page }),
    [search, author, categories, status, sort, order, dateFrom, dateTo, page]
  )

  const { items: posts, totalPages, status: fetchStatus, error, hasNewPosts } = useSelector(
    (state) => state.postsFeed
  )
  const isLoading = fetchStatus === 'idle' || fetchStatus === 'pending'

  const query = useMemo(() => {
    const q = { page: pageParam, limit: 5 }
    if (search) q.search = search
    if (author) q.author = author
    if (categories) q.categories = categories
    if (status) q.status = status
    if (sort) q.sortBy = sort === 'date' ? 'publish_date' : sort
    if (order) q.order = order
    if (dateFrom) q.dateFrom = dateFrom
    if (dateTo) q.dateTo = dateTo
    return q
  }, [pageParam, search, author, categories, status, sort, order, dateFrom, dateTo])

  useEffect(() => {
    dispatch(fetchPosts(query))
  }, [dispatch, query])

  const handleControlChange = (patch) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v == null) next.delete(k)
      else next.set(k, v)
    })
    setSearchParams(next)
  }

  const handlePageChange = (newPage) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(newPage))
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRetry = () => dispatch(fetchPosts(query))

  usePolling(
    () => {
      if (hasNewPosts || isLoading) return
      dispatch(checkForNewPosts(query))
    },
    POLLING_INTERVALS.FEED_CHECK,
    [dispatch, query, hasNewPosts, isLoading]
  )

  const handleLoadNewPosts = () => {
    dispatch(fetchPosts(query))
    dispatch(newPostsDismissed())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function renderFeedBody() {
    if (isLoading) {
      return <Loading message="Loading posts…" />
    }

    if (error) {
      return (
        <ErrorState
          error={error}
          message="Could not load posts. Check your connection and try again."
          onRetry={handleRetry}
        />
      )
    }

    if (posts.length === 0) {
      return <div className={s.feedState}>No posts found matching your filters.</div>
    }

    return (
      <div className={s.postList}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    )
  }

  return (
    <div className={s.feedContainer}>
      <FeedControls params={params} onChange={handleControlChange} showSearchType={true} />

      {!isLoading && !error && hasNewPosts && (
        <button type="button" className={s.newItemsBar} onClick={handleLoadNewPosts}>
          <IconChevron size={13} up />
          <span>Load new posts</span>
        </button>
      )}

      {renderFeedBody()}

      {!isLoading && !error && posts.length > 0 && (
        <div className={s.paginationWrapper}>
          <Pagination
            currentPage={pageParam}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  )
}
