import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { postsService } from '../services/posts.service'
import PostCard from '../components/posts/PostCard'
import Pagination from '../components/ui/Pagination'
import s from './Home.module.css'

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()

  const categoryParam = searchParams.get('category') || ''
  const pageParam = parseInt(searchParams.get('page') || '1', 10)

  const [posts, setPosts] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [loadedKey, setLoadedKey] = useState(null)

  const currentKey = `${categoryParam}:${pageParam}`
  const loading = loadedKey !== currentKey

  useEffect(() => {
    let isMounted = true

    const params = {
      page: pageParam,
      limit: 5,
    }
    if (categoryParam) {
      params.categories = categoryParam
    }

    postsService
      .getAll(params)
      .then((res) => {
        if (!isMounted) return
        setPosts(res.data?.data || [])
        setTotalPages(res.data?.pagination?.totalPages || 1)
        setLoadedKey(currentKey)
      })
      .catch(() => {
        if (!isMounted) return
        setPosts([])
        setTotalPages(1)
        setLoadedKey(currentKey)
      })

    return () => {
      isMounted = false
    }
  }, [categoryParam, pageParam, currentKey])

  const handlePageChange = (newPage) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('page', String(newPage))
    setSearchParams(nextParams)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleClearCategory = () => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('category')
    nextParams.set('page', '1')
    setSearchParams(nextParams)
  }

  return (
    <div className={s.feedContainer}>
      <div className={s.feedHeader}>
        <h1 className={s.feedTitle}>
          {categoryParam ? `Category: ${categoryParam}` : 'All Posts'}
        </h1>
        {categoryParam && (
          <button
            type="button"
            className={s.statusBadge}
            onClick={handleClearCategory}
            title="Clear category filter"
          >
            Clear filter &times;
          </button>
        )}
      </div>

      {loading ? (
        <div className={s.loadingFeed}>Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className={s.emptyFeed}>
          No posts found{categoryParam ? ` in "${categoryParam}"` : ''}.
        </div>
      ) : (
        <div className={s.postList}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {!loading && posts.length > 0 && (
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
