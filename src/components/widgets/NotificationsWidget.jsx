import { Link } from 'react-router-dom'
import { notificationsService } from '../../services/notifications.service'
import { ROUTES } from '../../constants/routes'
import { useAsyncData } from '../../hooks/useAsyncData'
import { formatDate } from '../../utils/format'
import { IconBell } from '../ui/Icons'
import SidebarWidget from './SidebarWidget'
import sw from './SidebarWidget.module.css'
import s from './NotificationsWidget.module.css'

export default function NotificationsWidget() {
  const { data: notifications, loading } = useAsyncData(
    () => notificationsService.getAll({ limit: 4 }),
    [],
    []
  )

  return (
    <SidebarWidget
      title="Notifications"
      icon={<IconBell size={14} />}
      actionLink={ROUTES.NOTIFICATIONS}
      actionText="All"
      loading={loading}
      empty={!loading && notifications.length === 0}
      emptyMessage="No new notifications"
    >
      <ul className={sw.list}>
        {notifications.map((n) => (
          <li key={n.id}>
            <Link to={ROUTES.NOTIFICATIONS} className={`${sw.item} ${s.item}`}>
              <span className={`${s.dot} ${n.is_read ? s.dotRead : ''}`} />
              <div className={s.content}>
                <span className={s.message}>{n.message}</span>
                {n.created_at && (
                  <span className={s.time}>{formatDate(n.created_at)}</span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </SidebarWidget>
  )
}
