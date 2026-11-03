import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loginThunk, clearError } from '../redux/slices/authSlice'
import { ROUTES } from '../constants/routes'
import Logo from '../components/ui/Logo'
import PasswordInput from '../components/ui/PasswordInput'
import DevConfirmationLink from '../components/ui/DevConfirmationLink'
import { validateLogin, validatePassword } from '../utils/validators'
import Loading from '../components/ui/Loading'
import s from '../components/layouts/auth.module.css'

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { loading, error, devLink } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  const from = location.state?.from?.pathname ?? ROUTES.HOME

  const [form, setForm] = useState({ login: '', password: '' })
  const [touched, setTouched] = useState({})

  const errors = {
    login: validateLogin(form.login),
    password: validatePassword(form.password),
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
      <DevConfirmationLink link={devLink} />

      <form className={s.form} onSubmit={handleSubmit} noValidate>
        <div className={s.field}>
          <label className={s.label} htmlFor="login-login">Login</label>
          <input
            id="login-login"
            name="login"
            type="text"
            autoComplete="username"
            className={`${s.input} ${touched.login && errors.login ? s.invalid : ''}`}
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
          {loading ? <Loading inline size="small" variant="light" message="Signing in…" /> : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
