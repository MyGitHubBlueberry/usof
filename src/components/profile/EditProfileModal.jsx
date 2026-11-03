import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import Modal from '../ui/Modal'
import ActionModal from '../ui/ActionModal'
import EditableAvatar from '../ui/EditableAvatar'
import PasswordInput from '../ui/PasswordInput'
import DevConfirmationLink from '../ui/DevConfirmationLink'
import { usersService } from '../../services/users.service'
import { useFlash } from '../../hooks/useFlash'
import { logout } from '../../redux/slices/authSlice'
import { ROUTES } from '../../constants/routes'
import { validatePassword, validateConfirmedPassword } from '../../utils/validators'
import { IconAlertTriangle } from '../ui/Icons'
import Loading from '../ui/Loading'
import s from './EditProfileModal.module.css'

export default function EditProfileModal({ profile, onClose, onProfileUpdate }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { showFlash } = useFlash()

  const [fullName, setFullName] = useState(profile.full_name || '')
  const [email, setEmail] = useState(profile.email || '')
  const [password, setPassword] = useState('')
  const [confirmedPassword, setConfirmedPassword] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [devLink, setDevLink] = useState(null)
  const [emailChangePending, setEmailChangePending] = useState(false)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const emailWillChange = email.trim() !== (profile.email || '') && email.trim() !== ''

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

  function buildPayload() {
    const payload = {}
    if (fullName.trim() !== (profile.full_name || '')) payload.full_name = fullName.trim()
    if (email.trim() !== (profile.email || '')) payload.email = email.trim()
    if (password) payload.password = password
    return payload
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (password) {
      const passwordError = validatePassword(password)
      if (passwordError) {
        setError(passwordError)
        return
      }
      const confirmedPasswordError = validateConfirmedPassword(password, confirmedPassword)
      if (confirmedPasswordError) {
        setError(confirmedPasswordError)
        return
      }
    }

    const payload = buildPayload()
    if (Object.keys(payload).length === 0) {
      onClose()
      return
    }

    setSaving(true)
    try {
      const res = await usersService.update(profile.id, payload)
      const updatedUser = res.data?.user || {}

      onProfileUpdate({
        full_name: updatedUser.full_name,
        email: updatedUser.email,
        is_email_confirmed: updatedUser.is_email_confirmed,
      })

      if (payload.email !== undefined) {
        setDevLink(res.data?.dev_link ?? null)
        setEmailChangePending(true)
        showFlash('Profile updated. Please confirm your new email address.', 'success')
      } else {
        showFlash('Profile updated.', 'success')
        onClose()
      }
    } catch (err) {
      setError(err.message || 'Could not update profile.')
    } finally {
      setSaving(false)
    }
  }

  function renderAvatarSection() {
    return (
      <div className={s.avatarSection}>
        <EditableAvatar
          userId={profile.id}
          avatarPath={profile.profile_picture_path}
          name={profile.login || profile.full_name}
          size="large"
          onProfileUpdate={onProfileUpdate}
        />
      </div>
    )
  }

  function renderFullNameField() {
    return (
      <div className={s.section}>
        <label className={s.sectionLabel} htmlFor="edit-profile-full-name">Full Name</label>
        <input
          id="edit-profile-full-name"
          type="text"
          className={s.input}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={saving}
        />
      </div>
    )
  }

  function renderEmailField() {
    return (
      <div className={s.section}>
        <label className={s.sectionLabel} htmlFor="edit-profile-email">Email</label>
        <input
          id="edit-profile-email"
          type="email"
          className={s.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={saving}
        />
        {emailWillChange && (
          <span className={s.notice}>
            Changing your email will require re-confirmation before you can log in again.
          </span>
        )}
      </div>
    )
  }

  function renderPasswordSection() {
    return (
      <div className={s.section}>
        <span className={s.sectionLabel}>Change Password</span>
        <div className={s.passwordRow}>
          <PasswordInput
            id="edit-profile-password"
            name="password"
            placeholder="New password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordInput
            id="edit-profile-confirmed-password"
            name="confirmed_password"
            placeholder="Confirm new password"
            autoComplete="new-password"
            value={confirmedPassword}
            onChange={(e) => setConfirmedPassword(e.target.value)}
          />
        </div>
      </div>
    )
  }

  function renderEmailConfirmationNotice() {
    if (!emailChangePending) return null
    return (
      <div className={s.section}>
        <span className={s.notice}>
          A confirmation link has been sent to your new email address.
        </span>
        <DevConfirmationLink link={devLink} label="Dev: Confirm New Email Now" />
      </div>
    )
  }

  function renderDangerZone() {
    return (
      <div className={s.dangerZone}>
        <button
          type="button"
          className={s.deleteAccountBtn}
          onClick={() => setDeleteModalOpen(true)}
          disabled={saving}
        >
          <IconAlertTriangle size={14} />
          Delete Account
        </button>
      </div>
    )
  }

  return (
    <Modal title="Edit Profile" onClose={onClose}>
      <form className={s.form} onSubmit={handleSubmit}>
        {renderAvatarSection()}
        {renderFullNameField()}
        {renderEmailField()}
        {renderPasswordSection()}
        {renderEmailConfirmationNotice()}

        {error && <div className={s.error}>{error}</div>}

        <div className={s.actions}>
          <button type="submit" className={s.submitBtn} disabled={saving}>
            {saving ? <Loading inline size="small" variant="light" message="Saving…" /> : 'Save Changes'}
          </button>
          <button type="button" className={s.cancelBtn} onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>

        {renderDangerZone()}
      </form>

      {deleteModalOpen && (
        <ActionModal
          title="Delete Account"
          message="This action is permanent and cannot be undone. All of your posts, comments, and account data will be removed."
          confirmText="Delete my account"
          isDanger
          isLoading={deleteLoading}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
    </Modal>
  )
}
