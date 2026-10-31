import { useState } from 'react'
import { Link } from 'react-router-dom'
import { postsService } from '../../services/posts.service'
import { useFlash } from '../../hooks/useFlash'
import { toProfile } from '../../constants/routes'
import { formatFullDate } from '../../utils/format'
import Avatar from '../ui/Avatar'
import Rating from '../ui/Rating'
import s from './PostFooter.module.css'

export default function PostFooter({
  post,
  author,
  likeCounts,
  isAuthenticated,
  onLikeCountsChange,
}) {
  const { showFlash } = useFlash()
  const [reacting, setReacting] = useState(false)
  const myReaction = likeCounts.myReaction ?? null

  function refreshCounts() {
    return postsService
      .getLikes(post.id)
      .then((res) => onLikeCountsChange(res.data ?? { likes: 0, dislikes: 0, myReaction: null }))
      .catch(() => {})
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
      .then(() => refreshCounts())
      .catch((err) => showFlash(err.message || 'Could not save your reaction.', 'error'))
      .finally(() => setReacting(false))
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
        <Rating counts={likeCounts} myReaction={myReaction} onReact={handleReact} disabled={reacting} size="md" />
      </div>
    </div>
  )
}
