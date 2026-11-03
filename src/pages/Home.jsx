import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { postsService } from '../services/posts.service'
import { usePolling } from '../hooks/usePolling'
import { POLLING_INTERVALS } from '../constants/polling'
import { FlashProvider } from '../context/FlashProvider'
import PostCard from '../components/posts/PostCard'
import FeedControls from '../components/posts/FeedControls'
import Pagination from '../components/ui/Pagination'
import ErrorState from '../components/ui/ErrorState'
import Loading from '../components/ui/Loading'
import { IconChevron } from '../components/ui/Icons'
import s from './Home.module.css'

export default function Home() {
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

  const [posts, setPosts] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [loadedKey, setLoadedKey] = useState(null)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [hasNewPosts, setHasNewPosts] = useState(false)

  const currentKey = `${search}|${author}|${categories}|${status}|${sort}|${order}|${dateFrom}|${dateTo}|${pageParam}|${retryCount}`
  const isLoading = loadedKey !== currentKey

  useEffect(() => {
    let isMounted = true

    const query = { page: pageParam, limit: 5 }
    if (search) query.search = search
    if (author) query.author = author
    if (categories) query.categories = categories
    if (status) query.status = status
    if (sort) query.sortBy = sort === 'date' ? 'publish_date' : sort
    if (order) query.order = order
    if (dateFrom) query.dateFrom = dateFrom
    if (dateTo) query.dateTo = dateTo

    postsService
      .getAll(query)
      .then((res) => {
        if (!isMounted) return
        setPosts(res.data?.data || [])
        setTotalPages(res.data?.pagination?.totalPages || 1)
        setError(null)
        setLoadedKey(currentKey)
        setHasNewPosts(false)
      })
      .catch((err) => {
        if (!isMounted) return
        setPosts([])
        setTotalPages(1)
        setError(err)
        setLoadedKey(currentKey)
      })

    return () => { isMounted = false }
  }, [
    currentKey,
    pageParam,
    search,
    author,
    categories,
    status,
    sort,
    order,
    dateFrom,
    dateTo,
  ])

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

  const handleRetry = () => setRetryCount((c) => c + 1)

  usePolling(
    () => {
      if (hasNewPosts || isLoading) return
      const query = { page: 1, limit: 1 }
      if (search) query.search = search
      if (author) query.author = author
      if (categories) query.categories = categories
      if (status) query.status = status
      if (sort) query.sortBy = sort === 'date' ? 'publish_date' : sort
      if (order) query.order = order
      if (dateFrom) query.dateFrom = dateFrom
      if (dateTo) query.dateTo = dateTo

      postsService
        .getAll(query)
        .then((res) => {
          const latest = res.data?.data?.[0]
          if (!latest) return
          setPosts((prev) => {
            const current = prev[0]
            if (!current || Number(latest.id) !== Number(current.id)) {
              setHasNewPosts(true)
            }
            return prev
          })
        })
        .catch(() => {})
    },
    POLLING_INTERVALS.FEED_CHECK,
    [search, author, categories, status, sort, order, dateFrom, dateTo, hasNewPosts, isLoading]
  )

  const handleLoadNewPosts = () => {
    setRetryCount((c) => c + 1)
    setHasNewPosts(false)
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
    <FlashProvider>
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
    </FlashProvider>
  )
}
