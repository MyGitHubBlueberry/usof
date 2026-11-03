import s from './Loading.module.css'

const SIZE_CLASSES = {
  small: s.sizeSm,
  medium: s.sizeMd,
  large: s.sizeLg,
}

const VARIANT_CLASSES = {
  default: s.variantDefault,
  light: s.variantLight,
}

export default function Loading({
  message,
  size = 'medium',
  inline = false,
  variant = 'default',
  className = '',
}) {
  const wrapperClass = `${inline ? s.inline : s.block} ${className}`
  const spinnerClass = `${s.spinner} ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]}`

  return (
    <div className={wrapperClass} role="status" aria-live="polite">
      <span className={spinnerClass} aria-hidden="true" />
      {message ? <span className={s.message}>{message}</span> : <span className={s.srOnly}>Loading…</span>}
    </div>
  )
}
