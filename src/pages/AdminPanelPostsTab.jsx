import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { postsService } from "../services/posts.service"
import { usersService } from "../services/users.service"
import { useFlash } from "../hooks/useFlash"
import ActionModal from "../components/ui/ActionModal"
import { toPost } from '../constants/routes'
import Pagination from "../components/ui/Pagination"
import FeedControls from "../components/posts/FeedControls"
import PostModerationRow from "./admin/PostModerationRow"
import {
  IconDocument,
  IconRefresh,
} from '../components/ui/Icons'
import s from "./Admin.module.css"

const POSTS_PER_PAGE = 10

export default function PostsTab() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [total, setTotal] = useState(0)
  const [filterParams, setFilterParams] = useState({
    search: '',
    author: '',
    categories: '',
    status: '',
    sort: 'date',
    order: 'desc',
    dateFrom: '',
    dateTo: '',
    page: '1',
  })
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [loadedKey, setLoadedKey] = useState(null)
  const [userMap, setUserMap] = useState({})
  const [postLikes, setPostLikes] = useState({})
  const [deleteTargetPost, setDeleteTargetPost] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const { showFlash } = useFlash()

  const pageParam = parseInt(filterParams.page || '1', 10)
  const currentKey = `${filterParams.search || ''}|${filterParams.author || ''}|${filterParams.categories || ''}|${filterParams.status || ''}|${filterParams.sort || 'date'}|${filterParams.order || 'desc'}|${filterParams.dateFrom || ''}|${filterParams.dateTo || ''}|${pageParam}|${retryCount}`
  const isLoading = loadedKey !== currentKey

  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE))

  useEffect(() => {
    let isMounted = true

    const query = { page: pageParam, limit: POSTS_PER_PAGE }
    if (filterParams.search) query.search = filterParams.search
    if (filterParams.author) query.author = filterParams.author
    if (filterParams.categories) query.category = filterParams.categories
    if (filterParams.status) query.status = filterParams.status
    if (filterParams.sort) {
      query.sortBy = filterParams.sort === 'date' ? 'publish_date' : filterParams.sort
    }
    if (filterParams.order) query.order = filterParams.order
    if (filterParams.dateFrom) query.dateFrom = filterParams.dateFrom
    if (filterParams.dateTo) query.dateTo = filterParams.dateTo

    postsService
      .getAll(query)
      .then(async (res) => {
        if (!isMounted) return
        const data = res.data
        const fetchedPosts = data.data ?? data.posts ?? (Array.isArray(data) ? data : [])
        setPosts(fetchedPosts)
        setTotal(data.pagination?.totalItems ?? data.total ?? data.count ?? 0)
        setError(null)
        setLoadedKey(currentKey)

        // Resolve missing author logins if any post doesn't already have author_login
        const missingUserIds = [
          ...new Set(
            fetchedPosts
              .filter((p) => !p.author_login && p.user_id && !userMap[p.user_id])
              .map((p) => p.user_id)
          ),
        ]

        if (missingUserIds.length > 0) {
          const promises = missingUserIds.map((id) =>
            usersService
              .getById(id)
              .then((r) => ({ id, login: r.data?.login ?? `#${id}` }))
              .catch(() => ({ id, login: `#${id}` }))
          )
          const resolved = await Promise.all(promises)
          if (isMounted) {
            setUserMap((prev) => {
              const updated = { ...prev }
              resolved.forEach(({ id, login }) => {
                updated[id] = login
              })
              return updated
            })
          }
        }

        // Resolve missing like counts if any post doesn't already have like_count
        const missingLikePostIds = fetchedPosts
          .filter((p) => p.like_count === undefined)
          .map((p) => p.id)

        if (missingLikePostIds.length > 0) {
          const likePromises = missingLikePostIds.map((id) =>
            postsService
              .getLikes(id)
              .then((r) => ({
                id,
                count: (r.data?.likes ?? 0) - (r.data?.dislikes ?? 0),
              }))
              .catch(() => ({ id, count: 0 }))
          )
          const resolvedLikes = await Promise.all(likePromises)
          if (isMounted) {
            setPostLikes((prev) => {
              const updated = { ...prev }
              resolvedLikes.forEach(({ id, count }) => {
                updated[id] = count
              })
              return updated
            })
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return
        setPosts([])
        setTotal(0)
        setError(err?.message ?? 'Failed to load posts')
        setLoadedKey(currentKey)
      })

    return () => {
      isMounted = false
    }
  }, [currentKey, pageParam, filterParams, retryCount, userMap])

  const handleControlChange = (patch) => {
    setFilterParams((prev) => {
      const next = { ...prev }
      Object.entries(patch).forEach(([k, v]) => {
        if (v === '' || v == null) delete next[k]
        else next[k] = v
      })
      if (patch.page === undefined) next.page = '1'
      return next
    })
  }

  const handleResetPosts = () => {
    setFilterParams({
      search: '',
      author: '',
      categories: '',
      status: '',
      sort: 'date',
      order: 'desc',
      dateFrom: '',
      dateTo: '',
      page: '1',
    })
  }

  const handlePageChange = (newPage) => {
    setFilterParams((prev) => ({
      ...prev,
      page: String(newPage),
    }))
  }

  const handleSortToggle = (field) => {
    setFilterParams((prev) => {
      const isCurrent = field === 'date'
        ? (prev.sort === 'date' || !prev.sort)
        : prev.sort === field
      const nextOrder = isCurrent && prev.order === 'desc' ? 'asc' : 'desc'
      return {
        ...prev,
        sort: field,
        order: nextOrder,
        page: '1',
      }
    })
  }

  const handleStatusChange = async (post, newStatus) => {
    const prev = post.status
    setPosts((p) => p.map((x) => (x.id === post.id ? { ...x, status: newStatus } : x)))
    try {
      await postsService.updateStatus(post.id, newStatus)
      showFlash(`Status updated to "${newStatus}"`)
    } catch (err) {
      setPosts((p) => p.map((x) => (x.id === post.id ? { ...x, status: prev } : x)))
      showFlash(err?.message ?? 'Failed to update status', 'error')
    }
  }

  const handleDeletePost = (post) => {
    setDeleteTargetPost(post)
  }

  const confirmDeletePost = async () => {
    if (!deleteTargetPost) return
    setDeleteLoading(true)
    try {
      await postsService.delete(deleteTargetPost.id)
      setPosts((prev) => prev.filter((p) => p.id !== deleteTargetPost.id))
      setTotal((prev) => Math.max(0, prev - 1))
      showFlash('Post deleted')
      setDeleteTargetPost(null)
    } catch (err) {
      showFlash(err?.message ?? 'Failed to delete post', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className={s.tabContent}>
      <div className={s.sectionHeader}>
        <div className={s.sectionTitle}>
          <IconDocument size={16} />
          <span>Posts</span>
        </div>
        <span className={s.countBadge}>{total}</span>
      </div>

      <FeedControls
        params={filterParams}
        onChange={handleControlChange}
        onReset={handleResetPosts}
        showSearchType={true}
      />

      {isLoading && (
        <div className={s.feedState}>
          <div className={s.spinner} />
          <span>Loading posts…</span>
        </div>
      )}

      {!isLoading && error && (
        <div className={s.feedState}>
          <p className={s.errorTitle}>Error</p>
          <p className={s.errorMsg}>{error}</p>
          <button className={s.retryBtn} onClick={() => setRetryCount((c) => c + 1)}>
            <IconRefresh size={14} /> Retry
          </button>
        </div>
      )}

      {!isLoading && !error && posts.length === 0 && (
        <div className={s.feedState}>
          <IconDocument size={32} />
          <p>No posts found matching your filters</p>
        </div>
      )}

      {!isLoading && !error && posts.length > 0 && (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Status</th>
                <th
                  className={`${s.sortableTh} ${s.colLikes}`}
                  onClick={() => handleSortToggle('likes')}
                  title="Sort by likes"
                >
                  Likes {filterParams.sort === 'likes' ? (filterParams.order === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th
                  className={`${s.sortableTh} ${s.colPublishDate}`}
                  onClick={() => handleSortToggle('date')}
                  title="Sort by published date"
                >
                  Published {(!filterParams.sort || filterParams.sort === 'date') ? (filterParams.order === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className={s.colAttachments}>Attachments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <PostModerationRow
                  key={post.id}
                  post={post}
                  userMap={userMap}
                  postLikes={postLikes}
                  onTitleClick={(p) => navigate(toPost(p.id))}
                  onStatusChange={handleStatusChange}
                  onDeleteOpen={handleDeletePost}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTargetPost && (
        <ActionModal
          title="Delete Post"
          message={`Are you sure you want to permanently delete post "${deleteTargetPost.title}"? This cannot be undone.`}
          details={[
            { label: 'Post ID', value: deleteTargetPost.id },
            { label: 'Title', value: deleteTargetPost.title },
            { label: 'Status', value: deleteTargetPost.status },
          ]}
          confirmText="Delete Post"
          isDanger={true}
          isLoading={deleteLoading}
          onConfirm={confirmDeletePost}
          onClose={() => setDeleteTargetPost(null)}
        />
      )}

      {!isLoading && !error && (totalPages > 1 || total > POSTS_PER_PAGE) && (
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

