import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { authService } from '../services/auth.service'
import { ROUTES } from '../constants/routes'
import Logo from '../components/ui/Logo'
import { IconCheckCircle, IconXCircle } from '../components/ui/Icons'
import Loading from '../components/ui/Loading'
import s from '../components/layouts/auth.module.css'

export default function EmailConfirm() {
  const { token } = useParams()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    authService.confirmEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setMessage(err.message ?? 'The link is invalid or has expired.')
        setStatus('error')
      })
  }, [token])

  const content = {
    loading: {
      icon: (
        <div className={s.spinnerWrapper}>
          <Loading inline size="large" />
        </div>
      ),
      title: 'Confirming your email…',
      msg: 'Hang tight, this only takes a moment.',
      action: null,
    },
    success: {
      icon: (
        <div className={s.icon}>
          <IconCheckCircle size={44} />
        </div>
      ),
      title: 'Email confirmed!',
      msg: 'Your account is now active. You can sign in.',
      action: (
        <Link to={ROUTES.LOGIN} className={`${s.submit} ${s.submitLink}`}>
          Go to sign in
        </Link>
      ),
    },
    error: {
      icon: (
        <div className={`${s.icon} ${s.iconError}`}>
          <IconXCircle size={44} />
        </div>
      ),
      title: 'Confirmation failed',
      msg: message,
      action: (
        <p className={`${s.sub} ${s.footerLinks}`}>
          <Link to={ROUTES.LOGIN} className={s.link}>Back to sign in</Link>
          {' · '}
          <Link to={ROUTES.REGISTER} className={s.link}>Register again</Link>
        </p>
      ),
    },
  }[status]

  return (
    <div className={s.card}>
      <Logo className={s.logo} />

      <div className={s.wrapper}>
        {content?.icon}
        <div className={s.title}>{content?.title}</div>
        <p className={s.msg}>{content?.msg}</p>
        {content?.action}
      </div>
    </div>
  )
}
