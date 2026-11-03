import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { postsService } from '../../services/posts.service'
import { useFlash } from '../../hooks/useFlash'
import { useMarkdownFormatting } from '../../hooks/useMarkdownFormatting'
import { fetchComments, commentAdded, userSeeded, sortModeChanged, pageChanged } from '../../redux/slices/commentsSlice'
import { postStatusChanged } from '../../redux/slices/postDetailSlice'
import { selectIsAdmin } from '../../redux/slices/authSlice'
import { ROUTES } from '../../constants/routes'
import Pagination from '../ui/Pagination'
import CommentItem from './CommentItem'
import CommentComposer from './CommentComposer'
import { SelectDropdown } from '../ui/SelectDropdown'
import Loading from '../ui/Loading'
import s from './CommentsSection.module.css'

const ROOTS_PER_PAGE = 5

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

export default function CommentsSection({ postId, refreshToken }) {
  const dispatch = useDispatch()
  const postStatus = useSelector((state) => state.postDetail.post?.status)
  const currentUser = useSelector((state) => state.auth.user)
  const isAdmin = useSelector(selectIsAdmin)
  const { items: comments, usersById, likeNet, status, page, sortMode } = useSelector((state) => state.comments)
  const loading = status === 'pending'
  const { showFlash } = useFlash()

  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)
  const { textareaRef: newCommentRef, applyFormat: applyNewCommentFormat } = useMarkdownFormatting(
    newComment,
    setNewComment
  )

  const revertingRef = useRef(false)

  useEffect(() => {
    dispatch(fetchComments(postId))
  }, [dispatch, postId, refreshToken])

  // revert post to active from resolved if there are no more resolved comments
  useEffect(() => {
    if (!isAdmin || loading || postStatus !== 'resolved' || revertingRef.current) return
    const anyResolved = comments.some((c) => c.status === 'resolved')
    if (anyResolved) return

    revertingRef.current = true
    postsService
      .updateStatus(postId, 'active')
      .then(() => dispatch(postStatusChanged('active')))
      .catch(() => showFlash('Could not automatically revert post status.', 'error'))
      .finally(() => {
        revertingRef.current = false
      })
  }, [comments, postStatus, isAdmin, loading, postId, dispatch, showFlash])

  const roots = useMemo(() => buildCommentTree(comments), [comments])

  const sortedRoots = useMemo(() => {
    if (sortMode === 'chrono') {
      return [...roots].sort((a, b) => new Date(a.publish_date) - new Date(b.publish_date))
    }
    const net = (id) => (likeNet[id]?.likes ?? 0) - (likeNet[id]?.dislikes ?? 0)
    return [...roots].sort((a, b) => net(b.id) - net(a.id))
  }, [roots, sortMode, likeNet])

  const totalRootPages = Math.max(1, Math.ceil(sortedRoots.length / ROOTS_PER_PAGE))
  const clampedPage = Math.min(page, totalRootPages)
  const visibleRoots = sortedRoots.slice(
    (clampedPage - 1) * ROOTS_PER_PAGE,
    clampedPage * ROOTS_PER_PAGE
  )

  function handleSortChange(value) {
    dispatch(sortModeChanged(value))
  }

  function handleSubmitComment() {
    const trimmed = newComment.trim()
    if (!trimmed || posting) return

    setPosting(true)
    postsService
      .addComment(postId, trimmed)
      .then((res) => {
        if (currentUser && Number(res.data.user_id) === Number(currentUser.id) && !usersById[res.data.user_id]) {
          dispatch(userSeeded({ userId: res.data.user_id, user: currentUser }))
        }
        dispatch(commentAdded(res.data))
        setNewComment('')
      })
      .catch((err) => showFlash(err.message || 'Could not post comment.', 'error'))
      .finally(() => setPosting(false))
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

      {loading && comments.length === 0 ? (
        <div className={s.noticeMsg}>
          <Loading inline message="Loading comments…" />
        </div>
      ) : roots.length === 0 ? (
        <div className={s.noticeMsg}>No comments yet. Be the first to share your thoughts.</div>
      ) : (
        <>
          <div className={s.list}>
            {visibleRoots.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                usersById={usersById}
                depth={0}
                refreshToken={refreshToken}
              />
            ))}
          </div>

          <Pagination
            currentPage={clampedPage}
            totalPages={totalRootPages}
            onPageChange={(p) => dispatch(pageChanged(p))}
            hideOnSinglePage
          />
        </>
      )}
    </div>
  )
}
