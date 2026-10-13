import { Outlet } from 'react-router-dom'
import { Suspense } from 'react'
import styles from './AuthLayout.module.css'

export default function AuthLayout() {
  return (
    <div className={styles.bg}>
      <Suspense fallback={<div className={styles.loader} />}>
        <Outlet />
      </Suspense>
    </div>
  )
}
