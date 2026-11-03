import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { usersService } from '../services/users.service'
import { updateUser } from '../redux/slices/authSlice'
import NavRow from '../components/ui/NavButtons'
import ProfileHeader from '../components/profile/ProfileHeader'
import ProfileTabs from '../components/profile/ProfileTabs'
import ErrorState from '../components/ui/ErrorState'
import Loading from '../components/ui/Loading'
import s from './Profile.module.css'

function isNotFound(error) {
  const status = error?.status ?? error?.response?.status ?? error?.raw?.response?.status
  return status === 404
}

export default function Profile() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const currentUser = useSelector((state) => state.auth.user)
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = searchParams.get('tab') || 'posts'
  const setActiveTab = (tab) => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', tab)
    setSearchParams(next)
  }

  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  const requestKey = `${id}:${retryCount}`
  const [resolvedKey, setResolvedKey] = useState(null)
  const loading = resolvedKey !== requestKey

  const isOwner = !!currentUser && String(currentUser.id) === String(id)

  useEffect(() => {
    let isMounted = true

    usersService
      .getById(id)
      .then((res) => {
        if (!isMounted) return
        setProfile(res.data)
        setError(null)
      })
      .catch((err) => {
        if (!isMounted) return
        setProfile(null)
        setError(err)
      })
      .finally(() => {
        if (isMounted) setResolvedKey(requestKey)
      })

    return () => {
      isMounted = false
    }
  }, [id, requestKey])

  const handleRetry = () => setRetryCount((c) => c + 1)

  const handleProfileUpdate = (patch) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev))
    if (isOwner) dispatch(updateUser(patch))
  }

  if (loading) {
    return <Loading message="Loading profile…" size="large" />
  }

  if (isNotFound(error)) {
    return (
      <div className={s.stateMsg}>
        <p>This user could not be found.</p>
      </div>
    )
  }

  if (error || !profile) {
    return <ErrorState className={s.error} error={error} message="Could not load this profile." onRetry={handleRetry} />
  }

  return (
    <div className={s.profilePage}>
      <NavRow/>
      <ProfileHeader
        key={profile.id}
        profile={profile}
        isOwner={isOwner}
        onProfileUpdate={handleProfileUpdate}
        onNotificationsClick={() => setActiveTab('notifications')}
      />
      <ProfileTabs
        profile={profile}
        isOwner={isOwner}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  )
}
