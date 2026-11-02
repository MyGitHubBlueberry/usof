import { useSelector } from 'react-redux'
import { postsService } from '../../services/posts.service'
import { toProfileTab } from '../../constants/routes'
import { IconRss } from '../ui/Icons'
import PostListWidget from './PostListWidget'
import sw from './SidebarWidget.module.css'

export default function SubscriptionsWidget() {
  const user = useSelector((state) => state.auth.user)

  function handleUnsubscribe(e, post, onRemove) {
    e.preventDefault()
    e.stopPropagation()
    postsService
      .unsubscribe(post.id)
      .then(() => {
        onRemove()
        window.dispatchEvent(
          new CustomEvent('usof:subscriptions-updated', { detail: { postId: post.id, isSubscribed: false } })
        )
      })
      .catch(() => {})
  }

  return (
    <PostListWidget
      title="Subscriptions"
      icon={<IconRss size={14} />}
      actionLink={toProfileTab(user?.id, 'subscriptions')}
      actionText="All"
      fetchFn={() => postsService.getSubscriptions({ limit: 10 })}
      refreshEvent="usof:subscriptions-updated"
      emptyMessage="No subscribed posts"
      renderItemAction={(post, onRemove) => (
        <button
          type="button"
          className={sw.itemActionBtn}
          onClick={(e) => handleUnsubscribe(e, post, onRemove)}
          aria-label="Unsubscribe"
          title="Unsubscribe"
        >
          <IconRss size={12} />
        </button>
      )}
    />
  )
}
