import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { authService } from '../services/auth.service'
import { ROUTES } from '../constants/routes'
import Logo from '../components/ui/Logo'
import s from '../components/layouts/auth.module.css'

const MIN_PASSWORD = 8

export default function PasswordResetConfirm() {
  const { token } = useParams()
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const errors = {
    password: !form.password
      ? 'Password is required'
      : form.password.length < MIN_PASSWORD
        ? `Password must be at least ${MIN_PASSWORD} characters`
        : '',
    confirmPassword: !form.confirmPassword
      ? 'Please confirm your password'
      : form.confirmPassword !== form.password
        ? 'Passwords do not match'
        : '',
  }

  const isFormValid = !Object.values(errors).some(Boolean)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleBlur = (e) => {
    setTouched((t) => ({ ...t, [e.target.name]: true }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ password: true, confirmPassword: true })
    if (!isFormValid) return

    setLoading(true)
    setError('')

    try {
      await authService.resetPassword(token, form.password)
      setSuccess(true)
    } catch (err) {
      setError(err.message ?? 'The password reset link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className={s.card}>
        <Logo className={s.logo} />
        <div className={s.wrapper}>
          <div className={s.icon}>✅</div>
          <div className={s.title}>Password updated!</div>
          <p className={s.msg}>
            Your password has been changed successfully. You can now sign in with your new password.
          </p>
          <Link to={ROUTES.LOGIN} className={`${s.submit} ${s.submitLink}`}>
            Go to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={s.card}>
      <Logo className={s.logo} />

      <h1 className={s.heading}>Set new password</h1>
      <p className={s.sub}>
        Please enter and confirm your new password below.
      </p>

      {error && <div className={s.banner}>{error}</div>}

      <form className={s.form} onSubmit={handleSubmit} noValidate>
        <div className={s.field}>
          <label className={s.label} htmlFor="reset-password">New password</label>
          <input
            id="reset-password"
            className={`${s.input} ${touched.password && errors.password ? s.invalid : ''}`}
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {touched.password && errors.password && (
            <span className={s.fieldError}>{errors.password}</span>
          )}
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor="reset-confirm-password">Confirm new password</label>
          <input
            id="reset-confirm-password"
            className={`${s.input} ${touched.confirmPassword && errors.confirmPassword ? s.invalid : ''}`}
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {touched.confirmPassword && errors.confirmPassword && (
            <span className={s.fieldError}>{errors.confirmPassword}</span>
          )}
        </div>

        <button className={s.submit} type="submit" disabled={loading}>
          {loading ? <><span className={s.spinner} /> Updating password…</> : 'Update password'}
        </button>
      </form>

      <p className={`${s.sub} ${s.footerLinks}`}>
        <Link to={ROUTES.LOGIN} className={s.link}>Back to sign in</Link>
      </p>
    </div>
  )
}
