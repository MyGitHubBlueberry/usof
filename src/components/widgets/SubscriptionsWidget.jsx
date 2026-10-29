import { useSelector } from 'react-redux'
import { postsService } from '../../services/posts.service'
import { toProfile } from '../../constants/routes'
import { IconRss } from '../ui/Icons'
import PostListWidget from './PostListWidget'

export default function SubscriptionsWidget() {
  const user = useSelector((state) => state.auth.user)

  return (
    <PostListWidget
      title="Subscriptions"
      icon={<IconRss size={14} />}
      actionLink={toProfile(user?.id)}
      actionText="All"
      fetchFn={() => postsService.getSubscriptions({ limit: 4 })}
      emptyMessage="No subscribed posts"
    />
  )
}
