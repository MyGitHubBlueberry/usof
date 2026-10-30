import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { commentsService } from '../../services/comments.service'
import { useFlash } from '../../hooks/useFlash'
import { toProfile } from '../../constants/routes'
import { formatFullDate } from '../../utils/format'
import Avatar from '../ui/Avatar'
import ActionModal from '../ui/ActionModal'
import {
  IconThumbsUp,
  IconThumbsDown,
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

const COLLAPSE_LENGTH = 280

export default function CommentItem({
  comment,
  postStatus,
  isAdmin,
  currentUser,
  usersById,
  depth,
  onCommentPatched,
  onCommentDeleted,
  onReplyAdded,
  onPostResolved,
}) {
  const { showFlash } = useFlash()
  const author = usersById[comment.user_id]
  const menuRef = useRef(null)

  const [likeCounts, setLikeCounts] = useState({ likes: 0, dislikes: 0 })
  const [myReaction, setMyReaction] = useState(null) //todo: should load if user have reacted to the comment already
  const [reacting, setReacting] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyPosting, setReplyPosting] = useState(false)
  const [collapsed, setCollapsed] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState(null)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    let isMounted = true
    commentsService
      .getLikes(comment.id)
      .then((res) => {
        if (isMounted) setLikeCounts(res.data ?? { likes: 0, dislikes: 0 })
      })
      .catch(() => { })
    return () => {
      isMounted = false
    }
  }, [comment.id])

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const isCommentOwner = !!currentUser && Number(currentUser.id) === Number(comment.user_id)
  const canReplyOrResolve = isAdmin || (postStatus !== 'resolved' && postStatus !== 'inactive')
  const canReact = isAdmin || postStatus !== 'inactive'
  const canEdit = isCommentOwner && canReplyOrResolve
  const canDelete = (isCommentOwner || isAdmin) && canReplyOrResolve
  const canResolve = (isCommentOwner || isAdmin) && canReplyOrResolve
  const isResolved = comment.status === 'resolved'
  const replyCount = comment.replies.length
  const isLongContent = comment.content.length > COLLAPSE_LENGTH
  const displayedContent =
    isLongContent && collapsed ? `${comment.content.slice(0, COLLAPSE_LENGTH)}…` : comment.content

  function refreshLikes() {
    return commentsService
      .getLikes(comment.id)
      .then((res) => setLikeCounts(res.data ?? { likes: 0, dislikes: 0 }))
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
      <div className={s.menuWrap} ref={menuRef}>
        <button
          type="button"
          className={s.menuTrigger}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Comment actions"
          aria-expanded={menuOpen}
        >
          <IconDots size={15} />
        </button>

        {menuOpen && (
          <div className={s.dropdown}>
            {canEdit && (
              <button
                type="button"
                className={s.dropdownItem}
                onClick={() => {
                  startEdit()
                  setMenuOpen(false)
                }}
              >
                <IconPencil size={13} />
                <span>Edit</span>
              </button>
            )}
            {isAdmin && postStatus !== 'active' && (
              <button
                type="button"
                className={s.dropdownItem}
                onClick={() => {
                  updateCommentStatus('active')
                  setMenuOpen(false)
                }}
              >
                <IconEye size={13} />
                <span>Set Active</span>
              </button>
            )}
            {isAdmin && postStatus !== 'inactive' && (
              <button
                type="button"
                className={s.dropdownItem}
                onClick={() => {
                  updateCommentStatus('inactive')
                  setMenuOpen(false)
                }}
              >
                <IconEyeClosed size={13} />
                <span>Set Inactive</span>
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className={s.dropdownItem}
                onClick={() => {
                  setDeleteModalOpen(true)
                  setMenuOpen(false)
                }}
              >
                <IconTrash size={13} />
                <span>Delete</span>
              </button>
            )}

          </div>
        )}
      </div>
    )
  }

  function commentEdit() {
    return (
      <div className={s.editBox}>
        <textarea
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
      <>
        <p className={s.content}>{displayedContent}</p>
        {isLongContent && (
          <button type="button" className={s.showMoreBtn} onClick={() => setCollapsed((v) => !v)}>
            {collapsed ? 'Show more' : 'Show less'}
          </button>
        )}
      </>
    )
  }

  function reactions() {
    return (
      <div className={s.rating}>
        <button
          type="button"
          className={`${s.reactBtn} ${myReaction === 'like' ? s.reactBtnActive : ''}`}
          onClick={() => handleReact('like')}
          disabled={reacting || !canReact}
          aria-label="Like"
          title="Like"
        >
          <IconThumbsUp size={13} filled={myReaction === 'like'} />
        </button>
        <span className={s.ratingCount}>{(likeCounts.likes ?? 0) - (likeCounts.dislikes ?? 0)}</span>
        <button
          type="button"
          className={`${s.reactBtn} ${myReaction === 'dislike' ? s.reactBtnActive : ''}`}
          onClick={() => handleReact('dislike')}
          disabled={reacting || !canReact}
          aria-label="Dislike"
          title="Dislike"
        >
          <IconThumbsDown size={13} filled={myReaction === 'dislike'} />
        </button>
      </div>
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
        <textarea
          className={s.replyTextarea}
          placeholder="Write a reply..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={handleReplyKeyDown}
          disabled={replyPosting}
          rows={2}
          autoFocus
        />
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
            isAdmin={isAdmin}
            currentUser={currentUser}
            usersById={usersById}
            depth={depth + 1}
            onCommentPatched={onCommentPatched}
            onCommentDeleted={onCommentDeleted}
            onReplyAdded={onReplyAdded}
            onPostResolved={onPostResolved}
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
    <div className={`${s.comment} ${depth > 0 ? s.nested : ''} ${isResolved ? s.resolved : ''}`}>
      <div className={s.header}>
        <Avatar
          userId={author?.id}
          avatarPath={author?.profile_picture_path}
          name={author?.login || author?.full_name}
          size="small"
        />
        <div className={s.headerMeta}>
          {author ? (
            <Link to={toProfile(author.id)} className={s.authorName}>
              {author.login}
            </Link>
          ) : (
            <span className={s.authorName}>Unknown user</span>
          )}
          <span className={s.date}>{formatFullDate(comment.publish_date)}</span>
        </div>
        {comment.status !== 'active' && <span className={s.statusBadge}>{comment.status}</span>}
        {(canEdit || canDelete) && commentActionsDropdown()}
      </div>

      {editing ? commentEdit() : commentContent()}

      <div className={s.footer}>
        {reactions()}

        <div>
          {!isResolved && canResolve && resolveButton()}

          {currentUser && canReplyOrResolve && !editing && responseButton()}

          {statusSaving && <span className={s.savingHint}>Saving…</span>}
        </div>
      </div>

      {replying && replyBox()}

      {replyCount > 0 && replies()}

      {deleteModalOpen && deleteModal()}
    </div>
  )
}
