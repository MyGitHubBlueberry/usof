import { postsService } from '../../services/posts.service'
import { ROUTES } from '../../constants/routes'
import { IconRss } from '../ui/Icons'
import PostListWidget from './PostListWidget'

export default function SubscriptionsWidget() {
  return (
    <PostListWidget
      title="Subscriptions"
      icon={<IconRss size={14} />}
      actionLink={ROUTES.SUBSCRIPTIONS}
      actionText="All"
      fetchFn={() => postsService.getSubscriptions({ limit: 4 })}
      emptyMessage="No subscribed posts"
    />
  )
}
