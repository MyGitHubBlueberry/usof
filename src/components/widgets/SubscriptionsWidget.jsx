import { useSelector } from 'react-redux'
import { postsService } from '../../services/posts.service'
import { toProfileTab } from '../../constants/routes'
import { IconRss } from '../ui/Icons'
import PostListWidget from './PostListWidget'

export default function SubscriptionsWidget() {
  const user = useSelector((state) => state.auth.user)

  return (
    <PostListWidget
      title="Subscriptions"
      icon={<IconRss size={14} />}
      actionLink={toProfileTab(user?.id, 'subscriptions')}
      actionText="All"
      fetchFn={() => postsService.getSubscriptions({ limit: 10 })}
      emptyMessage="No subscribed posts"
    />
  )
}
