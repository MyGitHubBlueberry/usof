import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { logoutThunk } from '../../redux/slices/authSlice'
import { notificationsService } from '../../services/notifications.service'
import { useCountdown } from '../../hooks/useCountdown'
import { formatDate } from '../../utils/format'
import { IconBan, IconLogout } from './Icons'
import Logo from './Logo'
import s from './BannedScreen.module.css'

function pad(n) {
  return String(n).padStart(2, '0')
}

export default function BannedScreen({ ban }) {
  const dispatch = useDispatch()
  const { days, hours, minutes, seconds, expired } = useCountdown(ban?.expiresAt)
  const recheckedRef = useRef(false)

  useEffect(() => {
    if (!expired || recheckedRef.current) return
    recheckedRef.current = true
    notificationsService.getUnreadCount().catch(() => {})
  }, [expired])

  const isTemporary = !!ban?.expiresAt

  return (
    <div className={s.screen}>
      <div className={s.card}>
        <Logo className={s.logo} />

        <div className={`${s.icon} ${s.iconDanger}`}>
          <IconBan size={44} />
        </div>

        <h1 className={s.title}>Your account has been banned</h1>

        {ban?.reason && (
          <p className={s.msg}>
            Reason: <span className={s.reason}>{ban.reason}</span>
          </p>
        )}

        {isTemporary ? (
          <>
            <div className={s.countdown}>
              <div className={s.countdownUnit}>
                <span className={s.countdownValue}>{days}</span>
                <span className={s.countdownLabel}>days</span>
              </div>
              <div className={s.countdownUnit}>
                <span className={s.countdownValue}>{pad(hours)}</span>
                <span className={s.countdownLabel}>hrs</span>
              </div>
              <div className={s.countdownUnit}>
                <span className={s.countdownValue}>{pad(minutes)}</span>
                <span className={s.countdownLabel}>min</span>
              </div>
              <div className={s.countdownUnit}>
                <span className={s.countdownValue}>{pad(seconds)}</span>
                <span className={s.countdownLabel}>sec</span>
              </div>
            </div>
            <p className={s.msg}>
              {expired
                ? 'Your ban has expired. Refreshing your access…'
                : <>Access restored on{' '}
                    <span className={s.expiry}>
                      {formatDate(ban.expiresAt, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </>}
            </p>
          </>
        ) : (
          <p className={s.msg}>This ban does not have an expiration date.</p>
        )}

        <button type="button" className={s.logoutBtn} onClick={() => dispatch(logoutThunk())}>
          <IconLogout size={14} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )
}
