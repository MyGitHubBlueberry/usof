import { Link } from 'react-router-dom'
import { toPost } from '../../constants/routes'
import { formatFullDate } from '../../utils/format'
import s from './PostCard.module.css'

export default function PostCard({ post }) {
  if (!post) return null

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
          <span className={s.ratingBadge}>{post.like_count ?? 0} likes</span>
          {post.publish_date && (
            <span>{formatFullDate(post.publish_date)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
