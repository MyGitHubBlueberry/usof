import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { commentsService } from '../../services/comments.service'
import { useFlash } from '../../hooks/useFlash'
import { useMarkdownFormatting } from '../../hooks/useMarkdownFormatting'
import { usePost } from '../../hooks/usePost'
import { toProfile } from '../../constants/routes'
import { formatFullDate } from '../../utils/format'
import Avatar from '../ui/Avatar'
import ActionModal from '../ui/ActionModal'
import Rating from '../ui/Rating'
import ActionMenu, { ActionMenuItem } from '../ui/ActionMenu'
import ExpandableContent from '../ui/ExpandableContent'
import MarkdownToolbar from '../post-create/MarkdownToolbar'
import {
  IconChevron,
  IconCornerDownRight,
  IconCheck,
  IconSend,
  IconPencil,
  IconTrash,
  IconX,
  IconDots,
  IconEye,
  IconEyeClosed
} from '../ui/Icons'
import s from './CommentItem.module.css'

function countDescendants(comment) {
  return comment.replies.reduce((sum, reply) => sum + 1 + countDescendants(reply), 0)
}

export default function CommentItem({ comment, depth, usersById }) {
  const {
    postStatus,
    postAuthorId,
    isAdmin,
    currentUser,
    onCommentPatched,
    onCommentDeleted,
    onReplyAdded,
    onPostStatusChange: onPostResolved,
    onLikesChanged,
    commentsRefreshToken,
  } = usePost()
  const { showFlash } = useFlash()
  const author = usersById[comment.user_id]

  const [likeCounts, setLikeCounts] = useState({ likes: 0, dislikes: 0 })
  const [myReaction, setMyReaction] = useState(null)
  const [reacting, setReacting] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyPosting, setReplyPosting] = useState(false)
  const { textareaRef: replyTextareaRef, applyFormat: applyReplyFormat } = useMarkdownFormatting(
    replyText,
    setReplyText
  )

  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState(null)
  const { textareaRef: editTextareaRef, applyFormat: applyEditFormat } = useMarkdownFormatting(
    editText,
    setEditText
  )

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [isCollapsed, setIsCollapsed] = useState(false)

  const fetchLikes = useCallback(async () => {
    return commentsService
      .getLikes(comment.id)
      .then((res) => {
        const data = res.data ?? { likes: 0, dislikes: 0, myReaction: null }
        setLikeCounts(data)
        setMyReaction(data.myReaction ?? null)
        onLikesChanged?.(comment.id, data)
      })
      .catch(() => { })
  }, [comment.id, onLikesChanged])

  useEffect(() => {
    fetchLikes()
  }, [fetchLikes, commentsRefreshToken])

  const isTombstone = !comment.user_id
  const isCommentOwner = !!currentUser && Number(currentUser.id) === Number(comment.user_id)
  const isPostOwner = !!currentUser && !!postAuthorId && Number(currentUser.id) === Number(postAuthorId)
  const canReplyOrResolve = isAdmin || (postStatus !== 'resolved' && postStatus !== 'inactive')
  const canReact = isAdmin || (postStatus !== 'inactive' && comment.status !== 'inactive' && !isTombstone)
  const canEdit = isCommentOwner && canReplyOrResolve && !isTombstone
  const canDelete = (isCommentOwner || isAdmin) && canReplyOrResolve && !isTombstone
  const canResolve = (isPostOwner || isAdmin) && canReplyOrResolve
  const isResolved = comment.status === 'resolved'
  const replyCount = comment.replies.length
  const hiddenCount = countDescendants(comment)

  function handleReact(type) {
    if (!currentUser) {
      showFlash('Sign in to react to comments.', 'error')
      return
    }
    if (reacting || !canReact) return

    setReacting(true)
    const action =
      myReaction === type ? commentsService.removeLike(comment.id) : commentsService.like(comment.id, type)

    action
      .then(() => fetchLikes())
      .catch((err) => showFlash(err.message || 'Could not save your reaction.', 'error'))
      .finally(() => setReacting(false))
  }

  function handleResolve() {
    setResolving(true)
    commentsService
      .resolve(comment.id)
      .then((res) => {
        onCommentPatched(res.data?.comment ?? { ...comment, status: 'resolved' })
        onPostResolved?.(res.data?.post?.status ?? 'resolved')
        showFlash('Marked as resolved.', 'success')
      })
      .catch((err) => showFlash(err.message || 'Could not resolve comment.', 'error'))
      .finally(() => setResolving(false))
  }

  function updateCommentStatus(status) {
    setStatusSaving(true)
    commentsService
      .updateStatus(comment.id, status)
      .then((res) => {
        onCommentPatched(res.data)
        showFlash(`Comment status set to ${status}.`, 'success')
      })
      .catch((err) => showFlash(err.message || 'Could not update status.', 'error'))
      .finally(() => setStatusSaving(false))
  }

  function startEdit() {
    setEditText(comment.content)
    setEditError(null)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setEditError(null)
  }

  function saveEdit() {
    const trimmed = editText.trim()
    if (!trimmed) {
      setEditError('Comment cannot be empty.')
      return
    }
    setEditSaving(true)
    setEditError(null)
    commentsService
      .update(comment.id, trimmed)
      .then((res) => {
        onCommentPatched(res.data)
        setEditing(false)
      })
      .catch((err) => setEditError(err.message || 'Could not update comment.'))
      .finally(() => setEditSaving(false))
  }

  function handleEditKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      saveEdit()
    }
    if (e.key === 'Escape') cancelEdit()
  }

  function handleDelete() {
    setDeleteLoading(true)
    commentsService
      .delete(comment.id)
      .then((res) => {
        if (res.status === 200 && res.data) {
          onCommentPatched(res.data)
        } else {
          onCommentDeleted(comment.id)
        }
        showFlash('Comment deleted.', 'success')
      })
      .catch((err) => showFlash(err.message || 'Could not delete comment.', 'error'))
      .finally(() => {
        setDeleteLoading(false)
        setDeleteModalOpen(false)
      })
  }

  function handleReplySubmit() {
    const trimmed = replyText.trim()
    if (!trimmed || replyPosting) return

    setReplyPosting(true)
    commentsService
      .reply(comment.id, trimmed)
      .then((res) => {
        onReplyAdded(res.data)
        setReplyText('')
        setReplying(false)
      })
      .catch((err) => showFlash(err.message || 'Could not post reply.', 'error'))
      .finally(() => setReplyPosting(false))
  }

  function handleReplyKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleReplySubmit()
    }
  }

  function commentActionsDropdown() {
    return (
      <ActionMenu
        trigger={({ toggle, open }) => (
          <button
            type="button"
            className={s.menuTrigger}
            onClick={toggle}
            aria-label="Comment actions"
            aria-expanded={open}
          >
            <IconDots size={15} />
          </button>
        )}
      >
        {canEdit && (
          <ActionMenuItem icon={<IconPencil size={13} />} onClick={startEdit}>
            Edit
          </ActionMenuItem>
        )}
        {isAdmin && comment.status !== 'active' && (
          <ActionMenuItem icon={<IconEye size={13} />} onClick={() => updateCommentStatus('active')}>
            Set Active
          </ActionMenuItem>
        )}
        {isAdmin && comment.status !== 'inactive' && (
          <ActionMenuItem icon={<IconEyeClosed size={13} />} onClick={() => updateCommentStatus('inactive')}>
            Set Inactive
          </ActionMenuItem>
        )}
        {canDelete && (
          <ActionMenuItem icon={<IconTrash size={13} />} onClick={() => setDeleteModalOpen(true)} danger>
            Delete
          </ActionMenuItem>
        )}
      </ActionMenu>
    )
  }

  function commentEdit() {
    return (
      <div className={s.editBox}>
        <div className={s.textareaWithMd}>
          <MarkdownToolbar onFormat={applyEditFormat} />
          <textarea
            ref={editTextareaRef}
            className={s.replyTextarea}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleEditKeyDown}
            disabled={editSaving}
            rows={3}
            autoFocus
          />
        </div>
        {editError && <span className={s.editError}>{editError}</span>}
        <div className={s.editActions}>
          <button
            type="button"
            className={s.sendBtn}
            onClick={saveEdit}
            disabled={editSaving || !editText.trim()}
          >
            <IconCheck size={13} />
            <span>Save</span>
          </button>
          <button
            type="button"
            className={s.actionBtn}
            onClick={cancelEdit}
            disabled={editSaving}
          >
            <IconX size={13} />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    )
  }

  function commentContent() {
    return (
      <ExpandableContent
        lineClamp={6}
        watchKey={comment.content}
        className={s.content}
        collapsedClassName={s.clamped}
        toggleClassName={s.showMoreBtn}
        showChevron={false}
      >
        {comment.content}
      </ExpandableContent>
    )
  }

  function reactions() {
    return (
      <Rating
        counts={likeCounts}
        myReaction={myReaction}
        onReact={handleReact}
        disabled={reacting || !canReact}
        size="sm"
      />
    )
  }

  function responseButton() {
    return (
      <button type="button" className={s.actionBtn} onClick={() => setReplying((v) => !v)}>
        <IconCornerDownRight size={13} />
        <span>Respond</span>
      </button>
    )
  }

  function resolveButton() {
    return (
      <button type="button" className={s.actionBtn} onClick={handleResolve} disabled={resolving}>
        <IconCheck size={13} />
        <span>Mark as Resolved</span>
      </button>
    )
  }

  function replyBox() {
    return (
      <div className={s.replyBox}>
        <div className={s.textareaWithMd}>
          <MarkdownToolbar onFormat={applyReplyFormat} />
          <textarea
            ref={replyTextareaRef}
            className={s.replyTextarea}
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleReplyKeyDown}
            disabled={replyPosting}
            rows={2}
            autoFocus
          />
        </div>
        <div className={s.replyActions}>
          <button
            type="button"
            className={s.sendBtn}
            onClick={handleReplySubmit}
            disabled={replyPosting || !replyText.trim()}
          >
            <IconSend size={13} />
            <span>Reply</span>
          </button>
        </div>
      </div>
    )
  }

  function replies() {
    return (
      <div className={s.repliesWrap}>
        {comment.replies.map((reply) => (
          <CommentItem key={reply.id} comment={reply} usersById={usersById} depth={depth + 1} />
        ))}
      </div>
    )
  }

  function deleteModal() {
    return (
      <ActionModal
        title="Delete Comment"
        message={
          replyCount > 0
            ? 'This comment has replies, so its text and author will be erased but its place in the thread will stay. This action cannot be undone.'
            : 'This action cannot be undone.'
        }
        confirmText="Delete"
        isDanger
        isLoading={deleteLoading}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
    )
  }

  return (
    <div className={`${s.comment} ${depth > 0 ? s.nested : ''} ${isResolved ? s.resolved : ''} ${isTombstone ? s.tombstone : ''}`}>
      <div className={s.header}>
        {replyCount > 0 && (
          <button
            type="button"
            className={`${s.collapseBtn} ${isCollapsed ? s.collapseBtnActive : ''}`}
            onClick={() => setIsCollapsed((v) => !v)}
            aria-label={isCollapsed ? 'Show replies' : 'Hide replies'}
            title={isCollapsed ? 'Show replies' : 'Hide replies'}
          >
            <IconChevron size={13} up={!isCollapsed} />
          </button>
        )}
        <Avatar
          userId={isTombstone ? undefined : author?.id}
          avatarPath={isTombstone ? undefined : author?.profile_picture_path}
          name={isTombstone ? '' : author?.login || author?.full_name}
          size="small"
        />
        <div className={s.headerMeta}>
          {isTombstone ? (
            <span className={s.authorName}>[Deleted]</span>
          ) : author ? (
            <Link to={toProfile(author.id)} className={s.authorName}>
              {author.login}
            </Link>
          ) : (
            <span className={s.authorName}>Unknown user</span>
          )}
          <span className={s.date}>{formatFullDate(comment.publish_date)}</span>
          {isCollapsed && (
            <span className={s.collapsedInfo}>
              ({hiddenCount} {hiddenCount === 1 ? 'reply' : 'replies'} hidden)
            </span>
          )}
        </div>
        {comment.status !== 'active' && (
          <span className={`${s.statusBadge} ${comment.status === 'resolved' ? s.statusResolved : s.statusInactive}`}>
            {comment.status}
          </span>
        )}
        {!isTombstone && (canEdit || canDelete || isAdmin) && commentActionsDropdown()}
      </div>

      {isTombstone ? (
        <p className={s.content}>This comment has been removed or deleted.</p>
      ) : editing ? (
        commentEdit()
      ) : (
        commentContent()
      )}

      {!isTombstone && (
        <div className={s.footer}>
          {reactions()}

          <div>
            {!isResolved && canResolve && resolveButton()}

            {currentUser && canReplyOrResolve && !editing && responseButton()}

            {statusSaving && <span className={s.savingHint}>Saving…</span>}
          </div>
        </div>
      )}

      {!isTombstone && replying && replyBox()}

      {replyCount > 0 && !isCollapsed && replies()}

      {!isTombstone && deleteModalOpen && deleteModal()}
    </div>
  )
}
