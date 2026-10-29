import s from './Avatar.module.css'

export default function Avatar({ src, name = '', size = 'medium', className = '' }) {
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
