import { useState } from 'react'
import { Link } from 'react-router-dom'
import { postsService } from '../../services/posts.service'
import { useFlash } from '../../hooks/useFlash'
import { usePost } from '../../hooks/usePost'
import { toProfile } from '../../constants/routes'
import { formatFullDate } from '../../utils/format'
import Avatar from '../ui/Avatar'
import Rating from '../ui/Rating'
import { IconRss } from '../ui/Icons'
import s from './PostFooter.module.css'

const STATUS_CLASSES = {
  active: 'statusActive',
  resolved: 'statusResolved',
  inactive: 'statusInactive',
}

export default function PostFooter({
  author,
  likeCounts,
  isSubscribed,
  onLikeCountsChange,
  onSubscribeChange,
}) {
  const { post, currentUser } = usePost()
  const isAuthenticated = !!currentUser
  const { showFlash } = useFlash()
  const [reacting, setReacting] = useState(false)
  const [subscribeLoading, setSubscribeLoading] = useState(false)
  const myReaction = likeCounts.myReaction ?? null

  async function refreshCounts() {
    return postsService
      .getLikes(post.id)
      .then((res) => onLikeCountsChange(res.data ?? { likes: 0, dislikes: 0, myReaction: null }))
      .catch(() => { })
  }

  function handleReact(type) {
    if (!isAuthenticated) {
      showFlash('Sign in to react to posts.', 'error')
      return
    }
    if (reacting) return

    setReacting(true)
    const action =
      myReaction === type ? postsService.removeLike(post.id) : postsService.like(post.id, type)

    action
      .then(async () => await refreshCounts())
      .catch((err) => showFlash(err.message || 'Could not save your reaction.', 'error'))
      .finally(() => setReacting(false))
  }

  function toggleSubscribe() {
    if (!isAuthenticated) {
      showFlash('Sign in to subscribe to posts.', 'error')
      return
    }
    if (subscribeLoading) return

    setSubscribeLoading(true)
    const action = isSubscribed ? postsService.unsubscribe(post.id) : postsService.subscribe(post.id)
    action
      .then(() => {
        onSubscribeChange(!isSubscribed)
        window.dispatchEvent(
          new CustomEvent('usof:subscriptions-updated', { detail: { postId: post.id, isSubscribed: !isSubscribed } })
        )
        showFlash(isSubscribed ? 'Unsubscribed from post.' : 'Subscribed to post.', 'success')
      })
      .catch((err) => showFlash(err.message || 'Could not update subscription.', 'error'))
      .finally(() => setSubscribeLoading(false))
  }

  return (
    <div className={s.footer}>
      <div className={s.authorRow}>
        <Avatar
          userId={author?.id}
          avatarPath={author?.profile_picture_path}
          name={author?.login || author?.full_name}
          size="small"
        />
        <div className={s.authorMeta}>
          {author ? (
            <Link to={toProfile(author.id)} className={s.authorName}>
              {author.login}
            </Link>
          ) : (
            <span className={s.authorName}>Unknown user</span>
          )}
          {post.publish_date && <span className={s.date}>{formatFullDate(post.publish_date)}</span>}
        </div>
      </div>

      <div className={s.actions}>
        {post.status !== 'active' && (
          <span className={`${s.statusBadge} ${s[STATUS_CLASSES[post.status]] || ''}`}>
            {post.status}
          </span>
        )}
        <button
          type="button"
          className={`${s.subscribeBtn} ${isSubscribed ? s.subscribeBtnActive : ''}`}
          onClick={toggleSubscribe}
          disabled={subscribeLoading}
          aria-label={isSubscribed ? 'Unsubscribe from post' : 'Subscribe to post'}
          title={isSubscribed ? 'Unsubscribe' : 'Subscribe'}
        >
          <IconRss size={14} />
          <span>{isSubscribed ? 'Subscribed' : 'Subscribe'}</span>
        </button>
        <Rating counts={likeCounts} myReaction={myReaction} onReact={handleReact} disabled={reacting} size="md" />
      </div>
    </div>
  )
}
