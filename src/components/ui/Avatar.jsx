import { useAvatarUrl } from '../../hooks/useAvatarUrl'
import s from './Avatar.module.css'

export default function Avatar({
  userId,
  avatarPath,
  name = '',
  size = 'medium',
  className = '',
}) {
  const src = useAvatarUrl(userId, avatarPath)
  const initial = (name.trim()[0] || '?').toUpperCase()
  const classes = [s.avatar, s[size], className].filter(Boolean).join(' ')

  if (src) {
    return <img src={src} alt={name || 'User avatar'} className={classes} />
  }

  return (
    <div className={classes} title={name || undefined}>
      {initial}
    </div>
  )
}
