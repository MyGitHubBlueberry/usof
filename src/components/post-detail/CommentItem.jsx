import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { commentsService } from '../../services/comments.service'
import { useFlash } from '../../hooks/useFlash'
import { useMarkdownFormatting } from '../../hooks/useMarkdownFormatting'
import { toProfile } from '../../constants/routes'
import { formatFullDate } from '../../utils/format'
import Avatar from '../ui/Avatar'
import ActionModal from '../ui/ActionModal'
import Rating from '../ui/Rating'
import ActionMenu, { ActionMenuItem } from '../ui/ActionMenu'
import ExpandableContent from '../ui/ExpandableContent'
import MarkdownToolbar from '../post-create/MarkdownToolbar'
import {
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

export default function CommentItem({
  comment,
  postStatus,
  postAuthorId,
  isAdmin,
  currentUser,
  usersById,
  depth,
  onCommentPatched,
  onCommentDeleted,
  onReplyAdded,
  onPostResolved,
  onLikesChanged,
}) {
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

  useEffect(() => {
    let isMounted = true
    commentsService
      .getLikes(comment.id)
      .then((res) => {
        if (!isMounted) return
        const data = res.data ?? { likes: 0, dislikes: 0, myReaction: null }
        setLikeCounts(data)
        setMyReaction(data.myReaction ?? null)
        onLikesChanged?.(comment.id, data)
      })
      .catch(() => { })
    return () => {
      isMounted = false
    }
  }, [comment.id, onLikesChanged])

  const isTombstone = comment.status === 'inactive'
  const isCommentOwner = !!currentUser && Number(currentUser.id) === Number(comment.user_id)
  const isPostOwner = !!currentUser && !!postAuthorId && Number(currentUser.id) === Number(postAuthorId)
  const canReplyOrResolve = isAdmin || (postStatus !== 'resolved' && postStatus !== 'inactive')
  const canReact = isAdmin || (postStatus !== 'inactive' && !isTombstone)
  const canEdit = isCommentOwner && canReplyOrResolve
  const canDelete = (isCommentOwner || isAdmin) && canReplyOrResolve
  const canResolve = (isPostOwner || isAdmin) && canReplyOrResolve
  const isResolved = comment.status === 'resolved'
  const replyCount = comment.replies.length

  function refreshLikes() {
    return commentsService
      .getLikes(comment.id)
      .then((res) => {
        const data = res.data ?? { likes: 0, dislikes: 0 }
        setLikeCounts(data)
        onLikesChanged?.(comment.id, data)
      })
      .catch(() => { })
  }

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
      .then(() => {
        setMyReaction(myReaction === type ? null : type)
        return refreshLikes()
      })
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
      .then(() => {
        onCommentDeleted(comment.id)
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
        {isAdmin && postStatus !== 'active' && (
          <ActionMenuItem icon={<IconEye size={13} />} onClick={() => updateCommentStatus('active')}>
            Set Active
          </ActionMenuItem>
        )}
        {isAdmin && postStatus !== 'inactive' && (
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
          <CommentItem
            key={reply.id}
            comment={reply}
            postStatus={postStatus}
            postAuthorId={postAuthorId}
            isAdmin={isAdmin}
            currentUser={currentUser}
            usersById={usersById}
            depth={depth + 1}
            onCommentPatched={onCommentPatched}
            onCommentDeleted={onCommentDeleted}
            onReplyAdded={onReplyAdded}
            onPostResolved={onPostResolved}
            onLikesChanged={onLikesChanged}
          />
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
            ? `This will also delete ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}. This action cannot be undone.`
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
        </div>
        {comment.status !== 'active' && (
          <span className={`${s.statusBadge} ${comment.status === 'resolved' ? s.statusResolved : s.statusInactive}`}>
            {comment.status}
          </span>
        )}
        {(canEdit || canDelete) && commentActionsDropdown()}
      </div>

      {isTombstone ? (
        <p className={s.content}>This comment has been removed or deleted.</p>
      ) : editing ? (
        commentEdit()
      ) : (
        commentContent()
      )}

      <div className={s.footer}>
        {reactions()}

        {!isTombstone && (
          <div>
            {!isResolved && canResolve && resolveButton()}

            {currentUser && canReplyOrResolve && !editing && responseButton()}

            {statusSaving && <span className={s.savingHint}>Saving…</span>}
          </div>
        )}
      </div>

      {!isTombstone && replying && replyBox()}

      {replyCount > 0 && replies()}

      {!isTombstone && deleteModalOpen && deleteModal()}
    </div>
  )
}
