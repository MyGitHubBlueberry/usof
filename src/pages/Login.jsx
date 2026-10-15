import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loginThunk } from '../redux/slices/authSlice'
import { ROUTES } from '../constants/routes'
import Logo from '../components/ui/Logo'
import s from '../components/layouts/auth.module.css'

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { loading, error } = useSelector((state) => state.auth)

  const from = location.state?.from?.pathname ?? ROUTES.HOME

  const [form, setForm] = useState({ login: '', password: '' })
  const [touched, setTouched] = useState({})

  const errors = {
    login: !form.login.trim() ? 'Login is required' : '',
    password: !form.password ? 'Password is required' : '',
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
    setTouched({ login: true, password: true })
    if (!isFormValid) return

    await dispatch(loginThunk(form)).unwrap()
    navigate(from, { replace: true })
  }

  return (
    <div className={s.card}>
      <Logo className={s.logo} />

      <h1 className={s.heading}>Welcome back</h1>
      <p className={s.sub}>
        Don't have an account?{' '}
        <Link to={ROUTES.REGISTER} state={{ from: location.state?.from }}>
          Sign up
        </Link>
      </p>

      {error && <div className={s.banner}>{error}</div>}

      <form className={s.form} onSubmit={handleSubmit} noValidate>
        <div className={s.field}>
          <label className={s.label} htmlFor="login-login">Login</label>
          <input
            id="login-login"
            className={`${s.input} ${touched.login && errors.login ? s.invalid : ''}`}
            type="text"
            name="login"
            autoComplete="username"
            placeholder="your_username"
            value={form.login}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {touched.login && errors.login && (
            <span className={s.fieldError}>{errors.login}</span>
          )}
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor="login-password">Password</label>
          <input
            id="login-password"
            className={`${s.input} ${touched.password && errors.password ? s.invalid : ''}`}
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {touched.password && errors.password && (
            <span className={s.fieldError}>{errors.password}</span>
          )}
        </div>

        <div style={{ textAlign: 'right', marginTop: '-8px' }}>
          <Link to={ROUTES.PASSWORD_RESET} className={s.link}>
            Forgot password?
          </Link>
        </div>

        <button className={s.submit} type="submit" disabled={loading}>
          {loading ? <><span className={s.spinner} /> Signing in…</> : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
