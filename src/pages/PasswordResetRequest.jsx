import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../services/auth.service'
import { ROUTES } from '../constants/routes'
import Logo from '../components/ui/Logo'
import s from '../components/layouts/auth.module.css'

export default function PasswordResetRequest() {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const emailError = !email.trim()
    ? 'Email is required'
    : !email.includes('@')
      ? 'Please enter a valid email address'
      : ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (emailError) return

    setLoading(true)
    setError('')

    try {
      await authService.requestPasswordReset(email.trim())
      setSubmitted(true)
    } catch (err) {
      setError(err.message ?? 'Failed to send password reset email.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className={s.card}>
        <Logo className={s.logo} />
        <div className={s.wrapper}>
          <div className={s.icon}>📬</div>
          <div className={s.title}>Check your inbox</div>
          <p className={s.msg}>
            If an account is associated with <strong>{email}</strong>, we've sent a link to reset your password.
          </p>
          <Link to={ROUTES.LOGIN} className={`${s.submit} ${s.submitLink}`}>
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={s.card}>
      <Logo className={s.logo} />

      <h1 className={s.heading}>Reset password</h1>
      <p className={s.sub}>
        Enter your email address and we'll send you instructions to reset your password.
      </p>

      {error && <div className={s.banner}>{error}</div>}

      <form className={s.form} onSubmit={handleSubmit} noValidate>
        <div className={s.field}>
          <label className={s.label} htmlFor="reset-email">Email</label>
          <input
            id="reset-email"
            className={`${s.input} ${touched && emailError ? s.invalid : ''}`}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
          />
          {touched && emailError && (
            <span className={s.fieldError}>{emailError}</span>
          )}
        </div>

        <button className={s.submit} type="submit" disabled={loading}>
          {loading ? <><span className={s.spinner} /> Sending link…</> : 'Send reset link'}
        </button>
      </form>

      <p className={`${s.sub} ${s.footerLinks}`}>
        Remember your password?{' '}
        <Link to={ROUTES.LOGIN} className={s.link}>Back to sign in</Link>
      </p>
    </div>
  )
}
