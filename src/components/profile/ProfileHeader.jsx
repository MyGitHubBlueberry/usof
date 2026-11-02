import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import Avatar from '../ui/Avatar'
import ActionModal from '../ui/ActionModal'
import { usersService } from '../../services/users.service'
import { notificationsService } from '../../services/notifications.service'
import { postsService } from '../../services/posts.service'
import { logout } from '../../redux/slices/authSlice'
import { useFlash } from '../../hooks/useFlash'
import { usePolling } from '../../hooks/usePolling'
import { ROUTES } from '../../constants/routes'
import {
  IconCamera,
  IconPencil,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconBell,
  IconTrash,
} from '../ui/Icons'
import s from './ProfileHeader.module.css'

export default function ProfileHeader({ profile, isOwner, onProfileUpdate, onNotificationsClick }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { showFlash } = useFlash()

  const fileInputRef = useRef(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarRemoving, setAvatarRemoving] = useState(false)

  const [postCount, setPostCount] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(profile.full_name || '')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState(null)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    setNameInput(profile.full_name || '')
  }, [profile.full_name])

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

  usePolling(fetchUnreadCount, 25_000, [fetchUnreadCount])

  function handleAvatarClick() {
    if (!isOwner || avatarUploading) return
    fileInputRef.current?.click()
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const formData = new FormData()
    formData.append('avatar', file)

    setAvatarUploading(true)
    usersService
      .uploadAvatar(formData)
      .then(() => usersService.getById(profile.id))
      .then((res) => {
        onProfileUpdate({ profile_picture_path: res.data?.profile_picture_path ?? null })
        showFlash('Avatar updated.', 'success')
      })
      .catch((err) => {
        showFlash(err.message || 'Could not upload avatar.', 'error')
      })
      .finally(() => setAvatarUploading(false))
  }

  function handleRemoveAvatar() {
    setAvatarRemoving(true)
    usersService
      .deleteAvatar()
      .then(() => {
        onProfileUpdate({ profile_picture_path: null })
        showFlash('Avatar removed.', 'success')
      })
      .catch((err) => {
        showFlash(err.message || 'Could not remove avatar.', 'error')
      })
      .finally(() => setAvatarRemoving(false))
  }

  function startEditName() {
    setNameError(null)
    setNameInput(profile.full_name || '')
    setEditingName(true)
  }

  function cancelEditName() {
    setEditingName(false)
    setNameError(null)
    setNameInput(profile.full_name || '')
  }

  function saveName() {
    const trimmed = nameInput.trim()
    if (!trimmed) {
      setNameError('Full name cannot be empty.')
      return
    }
    if (trimmed === profile.full_name) {
      setEditingName(false)
      return
    }

    setNameSaving(true)
    setNameError(null)
    usersService
      .update(profile.id, { full_name: trimmed })
      .then((res) => {
        onProfileUpdate({ full_name: res.data?.user?.full_name ?? trimmed })
        setEditingName(false)
        showFlash('Full name updated.', 'success')
      })
      .catch((err) => {
        setNameError(err.message || 'Could not update full name.')
      })
      .finally(() => setNameSaving(false))
  }

  function handleNameKeyDown(e) {
    if (e.key === 'Enter') saveName()
    if (e.key === 'Escape') cancelEditName()
  }

  function handleDeleteAccount() {
    setDeleteLoading(true)
    usersService
      .deleteOwn()
      .then(() => {
        dispatch(logout())
        navigate(ROUTES.HOME)
      })
      .catch((err) => {
        showFlash(err.message || 'Could not delete account.', 'error')
        setDeleteLoading(false)
      })
  }

  return (
    <div className={s.header}>
      <div className={s.main}>
        <div className={s.avatarWrap}>
          <Avatar
            userId={profile.id}
            avatarPath={profile.profile_picture_path}
            name={profile.login || profile.full_name}
            size="large"
          />
          {isOwner && (
            <button
              type="button"
              className={s.avatarEditBtn}
              onClick={handleAvatarClick}
              disabled={avatarUploading}
              aria-label="Change avatar"
              title="Change avatar"
            >
              <IconCamera size={18} />
            </button>
          )}
          {isOwner && profile.profile_picture_path && (
            <button
              type="button"
              className={s.avatarRemoveOverlay}
              onClick={handleRemoveAvatar}
              disabled={avatarRemoving}
              aria-label="Remove avatar"
              title="Remove avatar"
            >
              <IconTrash size={22} />
            </button>
          )}
          {isOwner && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={s.hiddenFileInput}
              onChange={handleAvatarChange}
            />
          )}
        </div>

        <div className={s.identity}>
          <div>
            {editingName ? (
              <div className={s.nameEditRow}>
                <input
                  type="text"
                  className={s.nameInput}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  disabled={nameSaving}
                  autoFocus
                />
                <button
                  type="button"
                  className={s.nameActionBtn}
                  onClick={saveName}
                  disabled={nameSaving}
                  aria-label="Save full name"
                  title="Save"
                >
                  <IconCheck size={14} />
                </button>
                <button
                  type="button"
                  className={s.nameActionBtn}
                  onClick={cancelEditName}
                  disabled={nameSaving}
                  aria-label="Cancel editing full name"
                  title="Cancel"
                >
                  <IconX size={14} />
                </button>
              </div>
            ) : (
              <div className={s.nameRow}>
                <span className={s.fullName}>{profile.full_name}</span>
                {isOwner && (
                  <button
                    type="button"
                    className={s.editNameBtn}
                    onClick={startEditName}
                    aria-label="Edit full name"
                    title="Edit full name"
                  >
                    <IconPencil size={13} />
                  </button>
                )}
              </div>
            )}
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

          {nameError && <span className={s.nameError}>{nameError}</span>}
          <span className={s.login}>{profile.login}</span>


          <div className={s.bottomRow}>
            <div className={s.stats}>
              <span className={s.stat}>Posts: {postCount ?? '—'}</span>
              <span className={s.stat}>Rating: {profile.rating ?? 0}</span>
            </div>
            {isOwner && (
              <div className={s.dangerZone}>
                <button
                  type="button"
                  className={s.deleteAccountBtn}
                  onClick={() => setDeleteModalOpen(true)}
                >
                  <IconAlertTriangle size={14} />
                  Delete Account
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {
        deleteModalOpen && (
          <ActionModal
            title="Delete Account"
            message="This action is permanent and cannot be undone. All of your posts, comments, and account data will be removed."
            confirmText="Delete my account"
            isDanger
            isLoading={deleteLoading}
            onClose={() => setDeleteModalOpen(false)}
            onConfirm={handleDeleteAccount}
          />
        )
      }
    </div >
  )
}
