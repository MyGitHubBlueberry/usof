import { useState } from 'react'
import { Link } from 'react-router-dom'
import { postsService } from '../../services/posts.service'
import { useFlash } from '../../hooks/useFlash'
import { toProfile } from '../../constants/routes'
import { formatFullDate } from '../../utils/format'
import Avatar from '../ui/Avatar'
import { IconThumbsUp, IconThumbsDown } from '../ui/Icons'
import s from './PostFooter.module.css'

export default function PostFooter({
  post,
  author,
  likeCounts,
  isAuthenticated,
  onLikeCountsChange,
}) {
  const { showFlash } = useFlash()
  const [myReaction, setMyReaction] = useState(null)
  const [reacting, setReacting] = useState(false)

  function refreshCounts() {
    return postsService
      .getLikes(post.id)
      .then((res) => onLikeCountsChange(res.data ?? { likes: 0, dislikes: 0 }))
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
      .then(() => {
        setMyReaction(myReaction === type ? null : type)
        return refreshCounts()
      })
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
        <div className={s.rating}>
          <button
            type="button"
            className={`${s.reactBtn} ${myReaction === 'like' ? s.reactBtnActive : ''}`}
            onClick={() => handleReact('like')}
            disabled={reacting}
            aria-label="Like"
            title="Like"
          >
            <IconThumbsUp size={15} />
          </button>
          <span className={s.ratingCount}>{(likeCounts.likes ?? 0) - (likeCounts.dislikes ?? 0)}</span>
          <button
            type="button"
            className={`${s.reactBtn} ${myReaction === 'dislike' ? s.reactBtnActiveDown : ''}`}
            onClick={() => handleReact('dislike')}
            disabled={reacting}
            aria-label="Dislike"
            title="Dislike"
          >
            <IconThumbsDown size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
