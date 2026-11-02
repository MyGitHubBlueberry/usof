import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { postsService } from '../../services/posts.service'
import { usersService } from '../../services/users.service'
import { commentsService } from '../../services/comments.service'
import { useFlash } from '../../hooks/useFlash'
import { useMarkdownFormatting } from '../../hooks/useMarkdownFormatting'
import { usePolling } from '../../hooks/usePolling'
import { ROUTES } from '../../constants/routes'
import Avatar from '../ui/Avatar'
import Pagination from '../ui/Pagination'
import CommentItem from './CommentItem'
import MarkdownToolbar from '../post-create/MarkdownToolbar'
import { SelectDropdown } from '../ui/SelectDropdown'
import { IconSend } from '../ui/Icons'
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

export default function CommentsSection({
  postId,
  postStatus,
  postAuthorId,
  isAdmin,
  currentUser,
  refreshToken,
  onPostStatusChange,
}) {
  const { showFlash } = useFlash()

  const [comments, setComments] = useState([])
  const [autoRefreshToken, setAutoRefreshToken] = useState(0)
  const [usersById, setUsersById] = useState({})
  const [likeNet, setLikeNet] = useState({})
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [sortMode, setSortMode] = useState('liked')

  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)
  const { textareaRef: newCommentRef, applyFormat: applyNewCommentFormat } = useMarkdownFormatting(
    newComment,
    setNewComment
  )

  const revertingRef = useRef(false)

  const loadComments = useCallback(() => {
    setLoading(true)

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
      .finally(() => setLoading(false))
  }, [postId])

  useEffect(() => {
    loadComments()
  }, [loadComments, refreshToken, autoRefreshToken])

  usePolling(
    () => {
      postsService
        .getComments(postId, { limit: 1 })
        .then((res) => {
          const freshTotal = res.data?.pagination?.totalItems ?? res.data?.total ?? res.data?.count ?? 0
          setComments((prev) => {
            if (freshTotal !== prev.length) {
              setAutoRefreshToken((t) => t + 1)
            }
            return prev
          })
        })
        .catch(() => {})
    },
    20_000,
    [postId]
  )

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

  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmitComment()
    }
  }

  const canCreateRootComment = postStatus !== 'inactive'

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
          <div className={s.composer}>
            <Avatar
              userId={currentUser.id}
              avatarPath={currentUser.profile_picture_path}
              name={currentUser.login}
              size="small"
            />
            <div className={s.composerBody}>
              <span className={s.composerName}>{currentUser.login}</span>
              <div className={s.inputGroup}>
                <MarkdownToolbar onFormat={applyNewCommentFormat} />
                <textarea
                  ref={newCommentRef}
                  className={s.textarea}
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={posting}
                  rows={3}
                />
              </div>
              <div className={s.composerActions}>
                <button
                  type="button"
                  className={s.sendBtn}
                  onClick={handleSubmitComment}
                  disabled={posting || !newComment.trim()}
                >
                  <IconSend size={14} />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className={s.noticeMsg}>This post is inactive and not accepting comments.</div>
        )
      ) : (
        <div className={s.noticeMsg}>
          <Link to={ROUTES.LOGIN}>Sign in</Link> to leave a comment.
        </div>
      )}

      {loading ? (
        <div className={s.noticeMsg}>Loading comments…</div>
      ) : roots.length === 0 ? (
        <div className={s.noticeMsg}>No comments yet. Be the first to share your thoughts.</div>
      ) : (
        <>
          <div className={s.list}>
            {visibleRoots.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postStatus={postStatus}
                postAuthorId={postAuthorId}
                isAdmin={isAdmin}
                currentUser={currentUser}
                usersById={usersById}
                depth={0}
                onCommentPatched={handleCommentPatched}
                onCommentDeleted={handleCommentDeleted}
                onReplyAdded={handleReplyAdded}
                onPostResolved={onPostStatusChange}
                onLikesChanged={handleLikesChanged}
              />
            ))}
          </div>

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
