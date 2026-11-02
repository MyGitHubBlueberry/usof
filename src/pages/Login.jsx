import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loginThunk, clearError } from '../redux/slices/authSlice'
import { ROUTES } from '../constants/routes'
import { getRecentLogins, addRecentLogin } from '../utils/recentLogins'
import Logo from '../components/ui/Logo'
import Combobox from '../components/ui/Combobox'
import PasswordInput from '../components/ui/PasswordInput'
import s from '../components/layouts/auth.module.css'

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { loading, error } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

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
    addRecentLogin(form.login)
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
          <Combobox
            id="login-login"
            name="login"
            inputClassName={touched.login && errors.login ? s.invalid : ''}
            placeholder="your_username"
            value={form.login}
            onChange={(val) => setForm((f) => ({ ...f, login: val }))}
            onBlur={handleBlur}
            suggestions={getRecentLogins()}
            ariaLabel="Login"
          />
          {touched.login && errors.login && (
            <span className={s.fieldError}>{errors.login}</span>
          )}
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor="login-password">Password</label>
          <PasswordInput
            id="login-password"
            name="password"
            inputClassName={touched.password && errors.password ? s.invalid : ''}
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

        <div className={s.forgotWrapper}>
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
