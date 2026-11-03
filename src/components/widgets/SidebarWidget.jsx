import { Link } from 'react-router-dom'
import { IconChevronRight } from '../ui/Icons'
import Loading from '../ui/Loading'
import s from './SidebarWidget.module.css'

export default function SidebarWidget({
  title,
  icon,
  actionLink,
  actionText = 'View all',
  loading = false,
  empty = false,
  emptyMessage = 'No items found',
  children,
  className = '',
}) {
  return (
    <section className={`${s.card} ${className}`.trim()}>
      <header className={s.header}>
        <div className={s.titleArea}>
          {icon && <span className={s.icon}>{icon}</span>}
          <span>{title}</span>
        </div>
        {actionLink && (
          <Link to={actionLink} className={s.actionLink}>
            <span>{actionText}</span>
            <IconChevronRight size={10} />
          </Link>
        )}
      </header>

      <div className={s.body}>
        {loading ? (
          <div className={s.loading}>
            <Loading inline size="small" />
          </div>
        ) : empty ? (
          <div className={s.empty}>{emptyMessage}</div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}
