import { Link } from 'react-router-dom'
import { toPost } from '../../constants/routes'
import { useAsyncData } from '../../hooks/useAsyncData'
import { formatDate } from '../../utils/format'
import SidebarWidget from './SidebarWidget'
import sw from './SidebarWidget.module.css'

export default function PostListWidget({
  title,
  icon,
  actionLink,
  actionText = 'All',
  fetchFn,
  emptyMessage = 'No posts found',
}) {
  const { data: posts, loading } = useAsyncData(fetchFn, [], [])

  return (
    <SidebarWidget
      title={title}
      icon={icon}
      actionLink={actionLink}
      actionText={actionText}
      loading={loading}
      empty={!loading && posts.length === 0}
      emptyMessage={emptyMessage}
    >
      <ul className={sw.list}>
        {posts.map((p) => (
          <li key={p.id}>
            <Link to={toPost(p.id)} className={sw.itemBlock}>
              <span className={sw.itemTitle}>{p.title}</span>
              <div className={sw.itemMeta}>
                <span>{p.like_count ?? 0} likes</span>
                {p.publish_date && <span>{formatDate(p.publish_date)}</span>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </SidebarWidget>
  )
}
