import { useEffect, useRef, useState } from 'react'
import { postsService } from '../../services/posts.service'
import { useFlash } from '../../hooks/useFlash'
import { commentsService } from '../../services/comments.service'
import { IconDots, IconStar, IconRss, IconShare, IconEye, IconEyeClosed, IconBell, IconTrash, IconPencil } from '../ui/Icons'
import s from './PostHeader.module.css'

export default function PostHeader({
  post,
  categories,
  isAuthenticated,
  isFavorited,
  isSubscribed,
  isAdmin,
  currentUser,
  onFavoriteChange,
  onSubscribeChange,
  onStatusChange,
  onRequireCommentsRefresh,
}) {
  const { showFlash } = useFlash()
  const [menuOpen, setMenuOpen] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [subscribeLoading, setSubscribeLoading] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const menuRef = useRef(null)
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

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

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
      .finally(() => {
        setFavoriteLoading(false)
        setMenuOpen(false)
      })
  }

  function toggleSubscribe() {
    if (!requireAuth() || subscribeLoading) return
    setSubscribeLoading(true)
    const action = isSubscribed ? postsService.unsubscribe(post.id) : postsService.subscribe(post.id)
    action
      .then(() => {
        onSubscribeChange(!isSubscribed)
        showFlash(isSubscribed ? 'Unsubscribed from post.' : 'Subscribed to post.', 'success')
      })
      .catch((err) => showFlash(err.message || 'Could not update subscription.', 'error'))
      .finally(() => {
        setSubscribeLoading(false)
        setMenuOpen(false)
      })
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
    setMenuOpen(false)
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

        <div className={s.menuWrap} ref={menuRef}>
          <button
            type="button"
            className={s.menuTrigger}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Post actions"
            aria-expanded={menuOpen}
          >
            <IconDots size={18} />
          </button>

          {menuOpen && (
            <div className={s.dropdown}>
              <button type="button" className={s.dropdownItem} onClick={toggleSubscribe}>
                <IconRss size={15} />
                <span>{isSubscribed ? 'Unsubscribe' : 'Subscribe'}</span>
              </button>
              <button type="button" className={s.dropdownItem} onClick={handleShare}>
                <IconShare size={15} />
                <span>Share</span>
              </button>
              {isOwner && (
                <button
                  type="button"
                  className={s.dropdownItem}
                  onClick={() => {
                    // todo: edit post, idk???
                    setMenuOpen(false)
                  }}
                >
                  <IconPencil size={13} />
                  <span>Edit</span>
                </button>
              )}
              {isAdmin && post.status !== 'active' && (
                <button
                  type="button"
                  className={s.dropdownItem}
                  onClick={() => {
                    handleStatusChange('active')
                    setMenuOpen(false)
                  }}
                >
                  <IconEye size={13} />
                  <span>Set Active</span>
                </button>
              )}
              {isAdmin && post.status !== 'inactive' && (
                <button
                  type="button"
                  className={s.dropdownItem}
                  onClick={() => {
                    handleStatusChange('inactive')
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
                    // todo: setDeleteModalOpen(true)
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
