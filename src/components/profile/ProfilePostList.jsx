import { useEffect, useState } from 'react'
import PostCard from '../posts/PostCard'
import Pagination from '../ui/Pagination'
import s from './ProfileTabContent.module.css'

export default function ProfilePostList({ fetchFn, emptyMessage = 'No posts found.' }) {
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    fetchFn(page)
      .then((res) => {
        if (!isMounted) return
        setPosts(res.data?.data || [])
        setTotalPages(res.data?.pagination?.totalPages || 1)
        setError(false)
      })
      .catch(() => {
        if (!isMounted) return
        setPosts([])
        setError(true)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [fetchFn, page])

  if (loading) {
    return <div className={s.state}>Loading…</div>
  }

  if (error) {
    return <div className={s.state}>Could not load posts.</div>
  }

  if (posts.length === 0) {
    return <div className={s.state}>{emptyMessage}</div>
  }

  return (
    <div className={s.tabContent}>
      <div className={s.list}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        hideOnSinglePage
      />
    </div>
  )
}
