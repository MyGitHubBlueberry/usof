import ActionModal from '../../components/ui/ActionModal'
import { SelectDropdown } from '../../components/ui/SelectDropdown'
import s from '../Admin.module.css'

const CREATE_ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Superadmin' },
]

export default function AddUserModal({ form, errors, loading, onChange, onRoleChange, onSubmit, onClose }) {
  return (
    <ActionModal
      title="Create User"
      confirmText="Create User"
      isLoading={loading}
      onConfirm={onSubmit}
      onClose={onClose}
    >
      <label className={s.formLabel}>
        Login <span className={s.required}>*</span>
        <input
          className={s.input}
          type="text"
          placeholder="cool_username"
          value={form.login}
          onChange={onChange('login')}
          autoFocus
          required
        />
        {errors.login && <span className={s.fieldError}>{errors.login}</span>}
      </label>

      <label className={s.formLabel}>
        Full name <span className={s.required}>*</span>
        <input
          className={s.input}
          type="text"
          placeholder="John Doe"
          value={form.full_name}
          onChange={onChange('full_name')}
          required
        />
        {errors.full_name && <span className={s.fieldError}>{errors.full_name}</span>}
      </label>

      <label className={s.formLabel}>
        Email <span className={s.required}>*</span>
        <input
          className={s.input}
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={onChange('email')}
          required
        />
        {errors.email && <span className={s.fieldError}>{errors.email}</span>}
      </label>

      <label className={s.formLabel}>
        Password <span className={s.required}>*</span>
        <input
          className={s.input}
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={onChange('password')}
          required
        />
        {errors.password && <span className={s.fieldError}>{errors.password}</span>}
      </label>

      <label className={s.formLabel}>
        Confirm password <span className={s.required}>*</span>
        <input
          className={s.input}
          type="password"
          placeholder="••••••••"
          value={form.confirmed_password}
          onChange={onChange('confirmed_password')}
          required
        />
        {errors.confirmed_password && (
          <span className={s.fieldError}>{errors.confirmed_password}</span>
        )}
      </label>

      <label className={s.formLabel}>
        Role
        <SelectDropdown
          value={form.role}
          options={CREATE_ROLE_OPTIONS}
          onChange={onRoleChange}
          ariaLabel="New user role"
        />
      </label>
    </ActionModal>
  )
}
