import { useSelector } from 'react-redux'
import { postsService } from '../../services/posts.service'
import { toProfile } from '../../constants/routes'
import { IconStar } from '../ui/Icons'
import PostListWidget from './PostListWidget'

export default function FavoritesWidget() {
  const user = useSelector((state) => state.auth.user)

  return (
    <PostListWidget
      title="Favorites"
      icon={<IconStar size={14} />}
      actionLink={toProfile(user?.id)}
      actionText="All"
      fetchFn={() => postsService.getFavorites({ limit: 4 })}
      emptyMessage="No favorited posts"
    />
  )
}
