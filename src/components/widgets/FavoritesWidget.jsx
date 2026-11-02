import { useSelector } from 'react-redux'
import { postsService } from '../../services/posts.service'
import { toProfileTab } from '../../constants/routes'
import { IconStar } from '../ui/Icons'
import PostListWidget from './PostListWidget'
import sw from './SidebarWidget.module.css'

export default function FavoritesWidget() {
  const user = useSelector((state) => state.auth.user)

  function handleUnfavorite(e, post, onRemove) {
    e.preventDefault()
    e.stopPropagation()
    postsService
      .unfavorite(post.id)
      .then(() => {
        onRemove()
        window.dispatchEvent(
          new CustomEvent('usof:favorites-updated', { detail: { postId: post.id, isFavorited: false } })
        )
      })
      .catch(() => {})
  }

  return (
    <PostListWidget
      title="Favorites"
      icon={<IconStar size={14} />}
      actionLink={toProfileTab(user?.id, 'favorites')}
      actionText="All"
      fetchFn={() => postsService.getFavorites({ limit: 13 })}
      refreshEvent="usof:favorites-updated"
      emptyMessage="No favorited posts"
      renderItemAction={(post, onRemove) => (
        <button
          type="button"
          className={sw.itemActionBtn}
          onClick={(e) => handleUnfavorite(e, post, onRemove)}
          aria-label="Remove from favorites"
          title="Remove from favorites"
        >
          <IconStar filled size={12} />
        </button>
      )}
    />
  )
}
