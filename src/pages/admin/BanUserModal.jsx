import ActionModal from '../../components/ui/ActionModal'
import { SelectDropdown } from '../../components/ui/SelectDropdown'
import s from '../Admin.module.css'

const BAN_DURATION_UNIT_OPTIONS = [
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
]

export default function BanUserModal({
  user,
  reason,
  duration,
  durationUnit,
  loading,
  onReasonChange,
  onDurationChange,
  onDurationUnitChange,
  onSubmit,
  onClose,
}) {
  return (
    <ActionModal
      title={`Ban User: ${user.login}`}
      details={[
        { label: 'User', value: user.login },
        { label: 'Email', value: user.email },
        { label: 'Role', value: user.role },
      ]}
      confirmText="Ban User"
      isDanger
      isLoading={loading}
      disabled={!reason.trim()}
      onConfirm={onSubmit}
      onClose={onClose}
    >
      <label className={s.formLabel}>
        Reason <span className={s.required}>*</span>
        <input
          className={s.input}
          type="text"
          placeholder="State the reason for this ban..."
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          autoFocus
          required
        />
      </label>

      <label className={s.formLabel}>
        Duration
        <div className={s.durationRow}>
          <input
            className={`${s.input} ${s.durationInput}`}
            type="number"
            placeholder="Leave blank for permanent ban"
            value={duration}
            onChange={(e) => onDurationChange(e.target.value)}
            min={1}
          />
          <SelectDropdown
            className={s.durationUnit}
            value={durationUnit}
            options={BAN_DURATION_UNIT_OPTIONS}
            onChange={onDurationUnitChange}
            ariaLabel="Ban duration unit"
          />
        </div>
      </label>
    </ActionModal>
  )
}
