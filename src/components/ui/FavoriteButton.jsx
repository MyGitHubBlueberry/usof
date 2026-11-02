import { useState } from 'react'
import { postsService } from '../../services/posts.service'
import { useFlash } from '../../hooks/useFlash'
import { IconStar } from './Icons'
import s from './FavoriteButton.module.css'

export default function FavoriteButton({
  postId,
  isFavorited,
  isAuthenticated,
  onChange,
  size = 24,
  className = '',
}) {
  const { showFlash } = useFlash()
  const [loading, setLoading] = useState(false)

  function toggleFavorite(e) {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      showFlash('Sign in to do that.', 'error')
      return
    }
    if (loading) return

    setLoading(true)
    const action = isFavorited ? postsService.unfavorite(postId) : postsService.favorite(postId)
    action
      .then(() => {
        onChange(!isFavorited)
        window.dispatchEvent(
          new CustomEvent('usof:favorites-updated', { detail: { postId, isFavorited: !isFavorited } })
        )
        showFlash(isFavorited ? 'Removed from favorites.' : 'Added to favorites.', 'success')
      })
      .catch((err) => showFlash(err.message || 'Could not update favorites.', 'error'))
      .finally(() => setLoading(false))
  }

  return (
    <button
      type="button"
      className={`${s.favoriteBtn} ${isFavorited ? s.favoriteBtnActive : ''} ${className}`.trim()}
      onClick={toggleFavorite}
      aria-label="Favorite post"
      disabled={loading}
    >
      <IconStar size={size} filled={isFavorited} />
    </button>
  )
}
