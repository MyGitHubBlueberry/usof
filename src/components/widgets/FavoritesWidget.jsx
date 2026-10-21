import { postsService } from '../../services/posts.service'
import { ROUTES } from '../../constants/routes'
import { IconStar } from '../ui/Icons'
import PostListWidget from './PostListWidget'

export default function FavoritesWidget() {
  return (
    <PostListWidget
      title="Favorites"
      icon={<IconStar size={14} />}
      actionLink={ROUTES.FAVORITES}
      actionText="All"
      fetchFn={() => postsService.getFavorites({ limit: 4 })}
      emptyMessage="No favorited posts"
    />
  )
}
