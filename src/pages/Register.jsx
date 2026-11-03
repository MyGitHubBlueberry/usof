import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { registerThunk, clearError } from '../redux/slices/authSlice'
import { ROUTES } from '../constants/routes'
import Logo from '../components/ui/Logo'
import PasswordInput from '../components/ui/PasswordInput'
import DevConfirmationLink from '../components/ui/DevConfirmationLink'
import { IconMail } from '../components/ui/Icons'
import { validateLogin, validatePassword, validateConfirmedPassword } from '../utils/validators'
import Loading from '../components/ui/Loading'
import s from '../components/layouts/auth.module.css'

function validate(form) {
  const e = {}
  const loginError = validateLogin(form.login)
  if (loginError) e.login = loginError

  if (!form.full_name.trim()) e.full_name = 'Full name is required'

  if (!form.email.trim()) e.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address'

  const passwordError = validatePassword(form.password)
  if (passwordError) e.password = passwordError

  const confirmedPasswordError = validateConfirmedPassword(form.password, form.confirmed_password)
  if (confirmedPasswordError) e.confirmed_password = confirmedPasswordError

  return e
}

export default function Register() {
  const dispatch = useDispatch()
  const location = useLocation()
  const { loading, error } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  const [form, setForm] = useState({
    login: '',
    full_name: '',
    email: '',
    password: '',
    confirmed_password: '',
  })
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [devLink, setDevLink] = useState(null)

  const errors = validate(form)
  const isFormValid = !Object.keys(errors).length

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleBlur = (e) => {
    setTouched((t) => ({ ...t, [e.target.name]: true }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const allTouched = Object.fromEntries(Object.keys(form).map((k) => [k, true]))
    setTouched(allTouched)
    if (!isFormValid) return

    const result = await dispatch(registerThunk(form)).unwrap()
    setDevLink(result?.dev_link ?? null)
    setSubmitted(true)
  }

  const fieldProps = (name) => ({
    id: `reg-${name}`,
    name,
    className: `${s.input} ${touched[name] && errors[name] ? s.invalid : ''}`,
    value: form[name],
    onChange: handleChange,
    onBlur: handleBlur,
  })

  if (submitted) {
    return (
      <div className={s.card}>
        <Logo className={s.logo} />
        <div className={s.wrapper}>
          <div className={s.icon}>
            <IconMail size={44} />
          </div>
          <div className={s.title}>Check your inbox!</div>
          <p className={s.msg}>
            We sent a verification link to <strong>{form.email}</strong>.
            <br />Click it to activate your account.
          </p>
          <DevConfirmationLink link={devLink} />
        </div>
        <p className={`${s.sub} ${s.footerLinks}`}>
          Already verified?{' '}
          <Link to={ROUTES.LOGIN} state={{ from: location.state?.from }}>Sign in</Link>
        </p>
      </div>
    )
  }

  return (
    <div className={s.card}>
      <Logo className={s.logo} />

      <h1 className={s.heading}>Create an account</h1>
      <p className={s.sub}>
        Already have one?{' '}
        <Link to={ROUTES.LOGIN} state={{ from: location.state?.from }}>Sign in</Link>
      </p>

      {error && <div className={s.banner}>{error}</div>}

      <form className={s.form} onSubmit={handleSubmit} noValidate>
        <div className={s.row}>
          <div className={s.field}>
            <label className={s.label} htmlFor="reg-login">Login</label>
            <input {...fieldProps('login')} type="text" autoComplete="username" placeholder="cool_username" />
            {touched.login && errors.login && <span className={s.fieldError}>{errors.login}</span>}
          </div>

          <div className={s.field}>
            <label className={s.label} htmlFor="reg-full_name">Full name</label>
            <input {...fieldProps('full_name')} type="text" autoComplete="name" placeholder="John Doe" />
            {touched.full_name && errors.full_name && <span className={s.fieldError}>{errors.full_name}</span>}
          </div>
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor="reg-email">Email</label>
          <input {...fieldProps('email')} type="email" autoComplete="email" placeholder="you@example.com" />
          {touched.email && errors.email && <span className={s.fieldError}>{errors.email}</span>}
        </div>

        <div className={s.row}>
          <div className={s.field}>
            <label className={s.label} htmlFor="reg-password">Password</label>
            <PasswordInput
              id="reg-password"
              name="password"
              inputClassName={touched.password && errors.password ? s.invalid : ''}
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {touched.password && errors.password && <span className={s.fieldError}>{errors.password}</span>}
          </div>

          <div className={s.field}>
            <label className={s.label} htmlFor="reg-confirmed_password">Confirm</label>
            <PasswordInput
              id="reg-confirmed_password"
              name="confirmed_password"
              inputClassName={touched.confirmed_password && errors.confirmed_password ? s.invalid : ''}
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.confirmed_password}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {touched.confirmed_password && errors.confirmed_password && (
              <span className={s.fieldError}>{errors.confirmed_password}</span>
            )}
          </div>
        </div>

        <button className={s.submit} type="submit" disabled={loading}>
          {loading ? <Loading inline size="small" variant="light" message="Creating account…" /> : 'Create account'}
        </button>
      </form>
    </div>
  )
}
