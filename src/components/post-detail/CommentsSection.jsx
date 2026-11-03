import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { postsService } from '../../services/posts.service'
import { usersService } from '../../services/users.service'
import { commentsService } from '../../services/comments.service'
import { useFlash } from '../../hooks/useFlash'
import { useMarkdownFormatting } from '../../hooks/useMarkdownFormatting'
import { usePost } from '../../hooks/usePost'
import { PostProvider } from '../../context/PostProvider'
import { ROUTES } from '../../constants/routes'
import Pagination from '../ui/Pagination'
import CommentItem from './CommentItem'
import CommentComposer from './CommentComposer'
import { SelectDropdown } from '../ui/SelectDropdown'
import Loading from '../ui/Loading'
import s from './CommentsSection.module.css'

const ROOTS_PER_PAGE = 5
const MAX_COMMENTS = 100

const SORT_OPTIONS = [
  { value: 'liked', label: 'Most Liked' },
  { value: 'chrono', label: 'Chronological' },
]

function buildCommentTree(flatComments) {
  const byId = new Map()
  flatComments.forEach((c) => byId.set(c.id, { ...c, replies: [] }))

  const roots = []
  byId.forEach((comment) => {
    const parentId = comment.parent_comment_id
    if (parentId && byId.has(parentId)) {
      byId.get(parentId).replies.push(comment)
    } else {
      roots.push(comment)
    }
  })

  return roots
}

function collectDescendantIds(flatComments, rootId) {
  const toRemove = new Set([rootId])
  let changed = true
  while (changed) {
    changed = false
    flatComments.forEach((c) => {
      if (c.parent_comment_id && toRemove.has(c.parent_comment_id) && !toRemove.has(c.id)) {
        toRemove.add(c.id)
        changed = true
      }
    })
  }
  return toRemove
}

export default function CommentsSection({ postId, refreshToken }) {
  const postContext = usePost()
  const { postStatus, currentUser, isAdmin, onPostStatusChange } = postContext
  const { showFlash } = useFlash()

  const [comments, setComments] = useState([])
  const [usersById, setUsersById] = useState({})
  const [likeNet, setLikeNet] = useState({})
  const [page, setPage] = useState(1)
  const [sortMode, setSortMode] = useState('liked')

  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)
  const { textareaRef: newCommentRef, applyFormat: applyNewCommentFormat } = useMarkdownFormatting(
    newComment,
    setNewComment
  )

  const revertingRef = useRef(false)

  const requestKey = `${postId}:${refreshToken}`
  const [resolvedKey, setResolvedKey] = useState(null)
  const loading = resolvedKey !== requestKey

  const loadComments = useCallback(() => {
    postsService
      .getComments(postId, { limit: MAX_COMMENTS })
      .then((res) => {
        const data = res.data?.data ?? []
        setComments(data)

        const uniqueUserIds = [...new Set(data.map((c) => c.user_id).filter(Boolean))]
        const usersPromise = Promise.all(
          uniqueUserIds.map((userId) =>
            usersService
              .getById(userId)
              .then((userRes) => [userId, userRes.data])
              .catch(() => [userId, null])
          )
        )

        const rootIds = data.filter((c) => !c.parent_comment_id).map((c) => c.id)
        const likesPromise = Promise.all(
          rootIds.map((id) =>
            commentsService
              .getLikes(id)
              .then((r) => [id, (r.data?.likes ?? 0) - (r.data?.dislikes ?? 0)])
              .catch(() => [id, 0])
          )
        )

        return Promise.all([usersPromise, likesPromise])
      })
      .then(([userEntries, likeEntries]) => {
        setUsersById(Object.fromEntries(userEntries))
        setLikeNet(Object.fromEntries(likeEntries))
      })
      .catch(() => {
        setComments([])
        setUsersById({})
        setLikeNet({})
      })
      .finally(() => {
        setResolvedKey(requestKey)
      })
  }, [postId, requestKey])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  // revert post to active from resolved if there are no more resolved comments
  useEffect(() => {
    if (!isAdmin || loading || postStatus !== 'resolved' || revertingRef.current) return
    const anyResolved = comments.some((c) => c.status === 'resolved')
    if (anyResolved) return

    revertingRef.current = true
    postsService
      .updateStatus(postId, 'active')
      .then(() => onPostStatusChange('active'))
      .catch(() => showFlash('Could not automatically revert post status.', 'error'))
      .finally(() => {
        revertingRef.current = false
      })
  }, [comments, postStatus, isAdmin, loading, postId, onPostStatusChange, showFlash])

  function ensureAuthorKnown(userId) {
    if (!currentUser || Number(userId) !== Number(currentUser.id)) return
    setUsersById((prev) => (prev[userId] ? prev : { ...prev, [userId]: currentUser }))
  }

  function handleCommentPatched(updated) {
    setComments((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)))
  }

  function handleCommentDeleted(commentId) {
    setComments((prev) => {
      const toRemove = collectDescendantIds(prev, commentId)
      return prev.filter((c) => !toRemove.has(c.id))
    })
  }

  function handleReplyAdded(newReply) {
    ensureAuthorKnown(newReply.user_id)
    setComments((prev) => [...prev, { status: 'active', publish_date: new Date().toISOString(), ...newReply }])
  }

  const roots = useMemo(() => buildCommentTree(comments), [comments])

  const sortedRoots = useMemo(() => {
    if (sortMode === 'chrono') {
      return [...roots].sort((a, b) => new Date(a.publish_date) - new Date(b.publish_date))
    }
    return [...roots].sort((a, b) => (likeNet[b.id] ?? 0) - (likeNet[a.id] ?? 0))
  }, [roots, sortMode, likeNet])

  const handleLikesChanged = useCallback((commentId, counts) => {
    setLikeNet((prev) => ({ ...prev, [commentId]: (counts.likes ?? 0) - (counts.dislikes ?? 0) }))
  }, [])

  const totalRootPages = Math.max(1, Math.ceil(sortedRoots.length / ROOTS_PER_PAGE))
  const clampedPage = Math.min(page, totalRootPages)
  const visibleRoots = sortedRoots.slice(
    (clampedPage - 1) * ROOTS_PER_PAGE,
    clampedPage * ROOTS_PER_PAGE
  )

  function handleSortChange(value) {
    setSortMode(value)
    setPage(1)
  }

  function handleSubmitComment() {
    const trimmed = newComment.trim()
    if (!trimmed || posting) return

    setPosting(true)
    postsService
      .addComment(postId, trimmed)
      .then((res) => {
        handleReplyAdded(res.data)
        setNewComment('')
      })
      .catch((err) => showFlash(err.message || 'Could not post comment.', 'error'))
      .finally(() => setPosting(false))
  }

  const canCreateRootComment = postStatus !== 'inactive'

  const commentContextValue = {
    ...postContext,
    onCommentPatched: handleCommentPatched,
    onCommentDeleted: handleCommentDeleted,
    onReplyAdded: handleReplyAdded,
    onLikesChanged: handleLikesChanged,
    commentsRefreshToken: refreshToken,
  }

  return (
    <div className={s.section}>
      <div className={s.headingRow}>
        <h2 className={s.heading}>Comments</h2>
        {roots.length > 1 && (
          <SelectDropdown
            className={s.sortDropdown}
            value={sortMode}
            options={SORT_OPTIONS}
            onChange={handleSortChange}
            ariaLabel="Sort comments"
          />
        )}
      </div>

      {currentUser ? (
        canCreateRootComment ? (
          <CommentComposer
            currentUser={currentUser}
            value={newComment}
            onChange={setNewComment}
            onSubmit={handleSubmitComment}
            posting={posting}
            textareaRef={newCommentRef}
            onFormat={applyNewCommentFormat}
          />
        ) : (
          <div className={s.noticeMsg}>This post is inactive and not accepting comments.</div>
        )
      ) : (
        <div className={s.noticeMsg}>
          <Link to={ROUTES.LOGIN}>Sign in</Link> to leave a comment.
        </div>
      )}

      {loading ? (
        <div className={s.noticeMsg}>
          <Loading inline message="Loading comments…" />
        </div>
      ) : roots.length === 0 ? (
        <div className={s.noticeMsg}>No comments yet. Be the first to share your thoughts.</div>
      ) : (
        <>
          <PostProvider value={commentContextValue}>
            <div className={s.list}>
              {visibleRoots.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  usersById={usersById}
                  depth={0}
                />
              ))}
            </div>
          </PostProvider>

          <Pagination
            currentPage={clampedPage}
            totalPages={totalRootPages}
            onPageChange={setPage}
            hideOnSinglePage
          />
        </>
      )}
    </div>
  )
}
