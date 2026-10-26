import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toPost } from '../../constants/routes'
import { postsService } from '../../services/posts.service'
import { formatFullDate } from '../../utils/format'
import s from './PostCard.module.css'

export default function PostCard({ post }) {
  const [likes, setLikes] = useState(null)

  useEffect(() => {
    if (!post?.id || post.like_count !== undefined) return
    let isMounted = true
    postsService
      .getLikes(post.id)
      .then((res) => {
        if (!isMounted) return
        setLikes((res.data?.likes ?? 0) - (res.data?.dislikes ?? 0))
      })
      .catch(() => {
        if (!isMounted) return
        setLikes(0)
      })
    return () => {
      isMounted = false
    }
  }, [post?.id, post?.like_count])

  if (!post) return null

  const displayLikes =
    post.like_count !== undefined ? Number(post.like_count) : (likes ?? 0)

  const statusClass =
    post.status === 'resolved'
      ? s.statusResolved
      : post.status === 'active'
      ? s.statusActive
      : ''

  return (
    <Link to={toPost(post.id)} className={s.postCard}>
      <div className={s.postHeader}>
        <h2 className={s.postTitle}>{post.title}</h2>
        {post.status && (
          <span className={`${s.statusBadge} ${statusClass}`}>
            {post.status}
          </span>
        )}
      </div>

      {post.content && <p className={s.postSnippet}>{post.content}</p>}

      <div className={s.postFooter}>
        <div className={s.metaGroup}>
          <span className={s.ratingBadge}>
            {displayLikes} likes
          </span>
          {post.publish_date && (
            <span>{formatFullDate(post.publish_date)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
