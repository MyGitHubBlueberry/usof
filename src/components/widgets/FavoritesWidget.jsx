import { useSelector } from 'react-redux'
import { postsService } from '../../services/posts.service'
import { toProfileTab } from '../../constants/routes'
import { IconStar } from '../ui/Icons'
import PostListWidget from './PostListWidget'

export default function FavoritesWidget() {
  const user = useSelector((state) => state.auth.user)

  return (
    <PostListWidget
      title="Favorites"
      icon={<IconStar size={14} />}
      actionLink={toProfileTab(user?.id, 'favorites')}
      actionText="All"
      fetchFn={() => postsService.getFavorites({ limit: 13 })}
      emptyMessage="No favorited posts"
    />
  )
}
