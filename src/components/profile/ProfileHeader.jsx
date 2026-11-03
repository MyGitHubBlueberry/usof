import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Avatar from '../ui/Avatar'
import EditableAvatar from '../ui/EditableAvatar'
import EditProfileModal from './EditProfileModal'
import { postsService } from '../../services/posts.service'
import { fetchUnreadCount } from '../../redux/slices/notificationsSlice'
import { usePolling } from '../../hooks/usePolling'
import { POLLING_INTERVALS } from '../../constants/polling'
import {
  IconPencil,
  IconBell,
} from '../ui/Icons'
import s from './ProfileHeader.module.css'

export default function ProfileHeader({ profile, isOwner, onProfileUpdate, onNotificationsClick }) {
  const dispatch = useDispatch()
  const unreadCount = useSelector((state) => state.notifications.unreadCount)
  const [postCount, setPostCount] = useState(null)

  const [editModalOpen, setEditModalOpen] = useState(false)

  useEffect(() => {
    let isMounted = true
    postsService
      .getAll({ author: profile.login, limit: 1 })
      .then((res) => {
        if (isMounted) setPostCount(res.data?.pagination?.totalItems ?? 0)
      })
      .catch(() => {
        if (isMounted) setPostCount(0)
      })
    return () => {
      isMounted = false
    }
  }, [profile.id, profile.login])

  useEffect(() => {
    if (isOwner) dispatch(fetchUnreadCount())
  }, [dispatch, isOwner])

  usePolling(
    () => {
      if (isOwner) dispatch(fetchUnreadCount())
    },
    POLLING_INTERVALS.UNREAD_COUNT,
    [dispatch, isOwner]
  )

  return (
    <div className={s.header}>
      <div className={s.main}>
        {isOwner ? (
          <EditableAvatar
            userId={profile.id}
            avatarPath={profile.profile_picture_path}
            name={profile.login || profile.full_name}
            size="large"
            onProfileUpdate={onProfileUpdate}
          />
        ) : (
          <Avatar
            userId={profile.id}
            avatarPath={profile.profile_picture_path}
            name={profile.login || profile.full_name}
            size="large"
          />
        )}

        <div className={s.identity}>
          <div>
            <div className={s.nameRow}>
              <span className={s.fullName}>{profile.full_name}</span>
              {isOwner && (
                <button
                  type="button"
                  className={s.editNameBtn}
                  onClick={() => setEditModalOpen(true)}
                  aria-label="Edit profile"
                  title="Edit profile"
                >
                  <IconPencil size={13} />
                </button>
              )}
            </div>
            {isOwner && (
              <button
                type="button"
                className={s.bellBtn}
                onClick={onNotificationsClick}
                aria-label="View notifications"
                title="Notifications"
              >
                <IconBell size={20} />
                {unreadCount > 0 && <span className={s.bellBadge}>{unreadCount}</span>}
              </button>
            )}
          </div>

          <span className={s.login}>{profile.login}</span>


          <div className={s.stats}>
            <span className={s.stat}>Posts: {postCount ?? '—'}</span>
            <span className={s.stat}>Rating: {profile.rating ?? 0}</span>
          </div>
        </div>
      </div>

      {
        editModalOpen && (
          <EditProfileModal
            profile={profile}
            onClose={() => setEditModalOpen(false)}
            onProfileUpdate={onProfileUpdate}
          />
        )
      }
    </div >
  )
}
