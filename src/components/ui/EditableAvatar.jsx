import { useRef, useState } from 'react'
import Avatar from './Avatar'
import { usersService } from '../../services/users.service'
import { useFlash } from '../../hooks/useFlash'
import { IconCamera, IconTrash } from './Icons'
import Loading from './Loading'
import s from './EditableAvatar.module.css'

export default function EditableAvatar({ userId, avatarPath, name, size = 'large', onProfileUpdate, className = '' }) {
  const { showFlash } = useFlash()
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)

  function handleClick() {
    if (uploading) return
    fileInputRef.current?.click()
  }

  function handleChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const formData = new FormData()
    formData.append('avatar', file)

    setUploading(true)
    usersService
      .uploadAvatar(formData)
      .then(() => usersService.getById(userId))
      .then((res) => {
        onProfileUpdate({ profile_picture_path: res.data?.profile_picture_path ?? null })
        showFlash('Avatar updated.', 'success')
      })
      .catch((err) => showFlash(err.message || 'Could not upload avatar.', 'error'))
      .finally(() => setUploading(false))
  }

  function handleRemove() {
    setRemoving(true)
    usersService
      .deleteAvatar()
      .then(() => {
        onProfileUpdate({ profile_picture_path: null })
        showFlash('Avatar removed.', 'success')
      })
      .catch((err) => showFlash(err.message || 'Could not remove avatar.', 'error'))
      .finally(() => setRemoving(false))
  }

  return (
    <div className={`${s.avatarWrap} ${className}`}>
      <Avatar userId={userId} avatarPath={avatarPath} name={name} size={size} />

      <button
        type="button"
        className={s.avatarEditBtn}
        onClick={handleClick}
        disabled={uploading}
        aria-label="Change avatar"
        title="Change avatar"
      >
        {uploading ? <Loading inline size="small" /> : <IconCamera size={18} />}
      </button>

      {avatarPath && (
        <button
          type="button"
          className={s.avatarRemoveOverlay}
          onClick={handleRemove}
          disabled={removing}
          aria-label="Remove avatar"
          title="Remove avatar"
        >
          {removing ? <Loading inline size="small" variant="light" /> : <IconTrash size={22} />}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className={s.hiddenFileInput}
        onChange={handleChange}
      />
    </div>
  )
}
