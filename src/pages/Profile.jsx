import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { usersService } from '../services/users.service'
import { updateUser } from '../redux/slices/authSlice'
import { FlashProvider } from '../context/FlashProvider'
import NavRow from '../components/ui/NavButtons'
import ProfileHeader from '../components/profile/ProfileHeader'
import ProfileTabs from '../components/profile/ProfileTabs'
import s from './Profile.module.css'

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
  const [notFound, setNotFound] = useState(false)

  const [resolvedId, setResolvedId] = useState(null)
  const loading = resolvedId !== id

  const isOwner = !!currentUser && String(currentUser.id) === String(id)

  useEffect(() => {
    let isMounted = true

    usersService
      .getById(id)
      .then((res) => {
        if (!isMounted) return
        setProfile(res.data)
        setNotFound(false)
      })
      .catch(() => {
        if (!isMounted) return
        setNotFound(true)
      })
      .finally(() => {
        if (isMounted) setResolvedId(id)
      })

    return () => {
      isMounted = false
    }
  }, [id])

  const handleProfileUpdate = (patch) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev))
    if (isOwner) dispatch(updateUser(patch))
  }

  if (loading) {
    return <div className={s.stateMsg}>Loading profile…</div>
  }

  if (notFound || !profile) {
    return (
      <div className={s.stateMsg}>
        <p>This user could not be found.</p>
      </div>
    )
  }

  return (
    <FlashProvider>
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
    </FlashProvider>
  )
}
