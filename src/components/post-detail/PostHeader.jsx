import { useState } from 'react'
import { postsService } from '../../services/posts.service'
import { useFlash } from '../../hooks/useFlash'
import { commentsService } from '../../services/comments.service'
import ActionMenu, { ActionMenuItem } from '../ui/ActionMenu'
import { IconDots, IconStar, IconShare, IconEye, IconEyeClosed, IconTrash, IconPencil } from '../ui/Icons'
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
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const isOwner = !!currentUser && Number(currentUser.id) === Number(post.user_id)
  const canDelete = isAdmin || isOwner;

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

  function requireAuth() {
    if (!isAuthenticated) {
      showFlash('Sign in to do that.', 'error')
      return false
    }
    return true
  }

  function toggleFavorite() {
    if (!requireAuth() || favoriteLoading) return
    setFavoriteLoading(true)
    const action = isFavorited ? postsService.unfavorite(post.id) : postsService.favorite(post.id)
    action
      .then(() => {
        onFavoriteChange(!isFavorited)
        showFlash(isFavorited ? 'Removed from favorites.' : 'Added to favorites.', 'success')
      })
      .catch((err) => showFlash(err.message || 'Could not update favorites.', 'error'))
      .finally(() => setFavoriteLoading(false))
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
        <button
          type="button"
          //todo className={}
          onClick={toggleFavorite}
          aria-label="Favorite post"
        >
          <IconStar size={24} filled={isFavorited} />
        </button>
        <h1 className={s.title}>{post.title}</h1>

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
            <ActionMenuItem icon={<IconPencil size={13} />} onClick={() => { /* todo: edit post */ }}>
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
            <ActionMenuItem icon={<IconTrash size={13} />} onClick={() => { /* todo: setDeleteModalOpen(true) */ }} danger>
              Delete
            </ActionMenuItem>
          )}
        </ActionMenu>
      </div>

      {categories.length > 0 && (
        <div className={s.categories}>
          {categories.map((c) => (
            <span key={c.id} className={s.categoryTag}>
              {c.title}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
