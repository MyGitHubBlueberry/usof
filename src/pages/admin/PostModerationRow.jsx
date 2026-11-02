import { IconTrash } from '../../components/ui/Icons'
import s from '../Admin.module.css'

const EDITABLE_POST_STATUSES = ['active', 'inactive']

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function PostModerationRow({
  post,
  userMap,
  postLikes,
  onTitleClick,
  onStatusChange,
  onDeleteOpen,
}) {
  const authorDisplay =
    post.author_login ||
    post.author?.login ||
    (post.user_id ? userMap[post.user_id] : null) ||
    '—'

  return (
    <tr>
      <td className={s.titleCell}>
        <button
          className={s.linkBtn}
          onClick={() => onTitleClick(post)}
          title={post.title}
          type="button"
        >
          {post.title?.length > 60 ? post.title.slice(0, 60) + '…' : post.title}
        </button>
      </td>
      <td className={s.dimCell}>{authorDisplay}</td>
      <td>
        {post.status === 'resolved' ? (
          <span className={`${s.statusBadge} ${s.statusSel_resolved}`}>Resolved</span>
        ) : (
          <select
            className={`${s.statusSelect} ${s[`statusSel_${post.status}`]}`}
            value={post.status}
            onChange={(e) => onStatusChange(post, e.target.value)}
            aria-label={`Change status for ${post.title}`}
          >
            {EDITABLE_POST_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </option>
            ))}
          </select>
        )}
      </td>
      <td className={`${s.dimCell} ${s.colLikes}`}>
        {post.like_count !== undefined
          ? Number(post.like_count)
          : (postLikes[post.id] !== undefined ? postLikes[post.id] : 0)}
      </td>
      <td className={`${s.dimCell} ${s.colPublishDate}`}>{formatDate(post.publish_date)}</td>
      <td className={`${s.dimCell} ${s.colAttachments}`}>{post.attachment_count ?? 0}</td>
      <td>
        <div className={s.actions}>
          <button
            className={`${s.actionBtn} ${s.actionDangerBtn}`}
            title="Delete post"
            onClick={() => onDeleteOpen(post)}
            type="button"
          >
            <IconTrash size={14} />
            <span className={s.actionBtnLabel}>Delete</span>
          </button>
        </div>
      </td>
    </tr>
  )
}
