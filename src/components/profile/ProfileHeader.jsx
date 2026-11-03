import { useCallback, useEffect, useState } from 'react'
import Avatar from '../ui/Avatar'
import EditableAvatar from '../ui/EditableAvatar'
import EditProfileModal from './EditProfileModal'
import { notificationsService } from '../../services/notifications.service'
import { postsService } from '../../services/posts.service'
import { usePolling } from '../../hooks/usePolling'
import { POLLING_INTERVALS } from '../../constants/polling'
import {
  IconPencil,
  IconBell,
} from '../ui/Icons'
import s from './ProfileHeader.module.css'

export default function ProfileHeader({ profile, isOwner, onProfileUpdate, onNotificationsClick }) {
  const [postCount, setPostCount] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)

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

  const fetchUnreadCount = useCallback(() => {
    if (!isOwner) return
    notificationsService
      .getUnreadCount()
      .then((res) => setUnreadCount(res.data?.unreadCount ?? 0))
      .catch(() => setUnreadCount(0))
  }, [isOwner])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  usePolling(fetchUnreadCount, POLLING_INTERVALS.UNREAD_COUNT, [fetchUnreadCount])

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
