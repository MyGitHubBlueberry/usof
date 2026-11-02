import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { postsService } from '../../services/posts.service'
import { useFlash } from '../../hooks/useFlash'
import { commentsService } from '../../services/comments.service'
import { ROUTES, toPostEdit } from '../../constants/routes'
import ActionMenu, { ActionMenuItem } from '../ui/ActionMenu'
import ActionModal from '../ui/ActionModal'
import FavoriteButton from '../ui/FavoriteButton'
import { IconDots, IconShare, IconEye, IconEyeClosed, IconTrash, IconPencil } from '../ui/Icons'
import s from './PostHeader.module.css'

export default function PostHeader({
  post,
  categories,
  isAuthenticated,
  isFavorited,
  isAdmin,
  currentUser,
  onFavoriteChange,
  onStatusChange,
  onRequireCommentsRefresh,
}) {
  const { showFlash } = useFlash()
  const navigate = useNavigate()
  const [statusSaving, setStatusSaving] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isOwner = !!currentUser && Number(currentUser.id) === Number(post.user_id)
  const canDelete = isAdmin || isOwner;

  function handleDelete() {
    setDeleting(true)
    postsService
      .delete(post.id)
      .then(() => {
        navigate(ROUTES.HOME)
        showFlash('Post deleted.', 'success')
      })
      .catch((err) => {
        showFlash(err.message || 'Could not delete post.', 'error')
        setDeleting(false)
      })
  }

  function handleStatusChange(status) {
    const wasResolved = post.status === 'resolved'

    setStatusSaving(true)
    postsService
      .updateStatus(post.id, status)
      .then(() => {
        onStatusChange(status)
        showFlash(`Post status set to ${status}.`, 'success')

        if (!wasResolved) return

        return postsService
          .getComments(post.id, { limit: 100 })
          .then((res) => {
            const resolvedComments = (res.data?.data ?? []).filter((c) => c.status === 'resolved')
            return Promise.all(
              resolvedComments.map((c) => commentsService.updateStatus(c.id, 'active'))
            )
          })
          .then(() => onRequireCommentsRefresh?.())
          .catch(() =>
            showFlash(
              'Post status updated, but some resolved comments could not be reverted automatically.',
              'error'
            )
          )
      })
      .catch((err) => showFlash(err.message || 'Could not update status.', 'error'))
      .finally(() => setStatusSaving(false))
  }

  function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: post.title, url }).catch(() => { })
    } else if (navigator.clipboard) {
      navigator.clipboard
        .writeText(url)
        .then(() => showFlash('Link copied to clipboard.', 'success'))
        .catch(() => showFlash('Could not copy link.', 'error'))
    }
  }

  return (
    <div className={s.header}>
      <div className={s.titleRow}>
        <div>
          <FavoriteButton
            postId={post.id}
            isFavorited={isFavorited}
            isAuthenticated={isAuthenticated}
            onChange={onFavoriteChange}
            size={24}
          />
          <h1 className={s.title}>{post.title}</h1>
        </div>

        <ActionMenu
          trigger={({ toggle, open }) => (
            <button
              type="button"
              className={s.menuTrigger}
              onClick={toggle}
              aria-label="Post actions"
              aria-expanded={open}
            >
              <IconDots size={18} />
            </button>
          )}
        >
          <ActionMenuItem icon={<IconShare size={15} />} onClick={handleShare}>
            Share
          </ActionMenuItem>
          {isOwner && (
            <ActionMenuItem icon={<IconPencil size={13} />} onClick={() => navigate(toPostEdit(post.id))}>
              Edit
            </ActionMenuItem>
          )}
          {isAdmin && post.status !== 'active' && (
            <ActionMenuItem
              icon={<IconEye size={13} />}
              onClick={() => handleStatusChange('active')}
              disabled={statusSaving}
            >
              Set Active
            </ActionMenuItem>
          )}
          {isAdmin && post.status !== 'inactive' && (
            <ActionMenuItem
              icon={<IconEyeClosed size={13} />}
              onClick={() => handleStatusChange('inactive')}
              disabled={statusSaving}
            >
              Set Inactive
            </ActionMenuItem>
          )}
          {canDelete && (
            <ActionMenuItem icon={<IconTrash size={13} />} onClick={() => setDeleteModalOpen(true)} danger>
              Delete
            </ActionMenuItem>
          )}
        </ActionMenu>
      </div>

      {categories.length > 0 && (
        <div className={s.categories}>
          {categories.map((c) => (
            <span key={c.id} className={s.categoryTag} title={c.description || c.title}>
              {c.title}
            </span>
          ))}
        </div>
      )}

      {deleteModalOpen && (
        <ActionModal
          title="Delete post?"
          message="This action cannot be undone. The post and all its comments will be permanently deleted."
          confirmText="Delete"
          isDanger
          isLoading={deleting}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}
