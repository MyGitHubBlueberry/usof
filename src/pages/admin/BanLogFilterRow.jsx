import Combobox from '../../components/ui/Combobox'
import { SelectDropdown } from '../../components/ui/SelectDropdown'
import fc from '../../components/posts/FeedControls.module.css'
import bf from './BanLogFilterRow.module.css'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'revoked', label: 'Revoked' },
]

const SORT_OPTIONS = [
  { value: 'banned_at', label: 'Banned Date' },
  { value: 'expires_at', label: 'Expires Date' },
  { value: 'target_login', label: 'Target User' },
]

const ORDER_OPTIONS = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
]

export default function BanLogFilterRow({
  filterParams,
  targetUserInput,
  bannedByInput,
  targetSuggestions,
  issuerSuggestions,
  onTargetUserChange,
  onBannedByChange,
  onStatusChange,
  onSortByChange,
  onOrderChange,
  onDateFromChange,
  onDateToChange,
}) {
  return (
    <div className={fc.filterRow}>
      <div className={fc.col}>
        <span className={fc.colLabel}>Filter</span>

        <div className={bf.sideBySideRow}>
          <Combobox
            value={targetUserInput}
            onChange={onTargetUserChange}
            suggestions={targetSuggestions}
            placeholder="Target user…"
            ariaLabel="Filter by target user"
            inputClassName={bf.searchLikeInput}
          />

          <Combobox
            value={bannedByInput}
            onChange={onBannedByChange}
            suggestions={issuerSuggestions}
            placeholder="Banned by…"
            ariaLabel="Filter by banned by"
            inputClassName={bf.searchLikeInput}
          />
        </div>

        <SelectDropdown
          value={filterParams.status || ''}
          options={STATUS_OPTIONS}
          onChange={onStatusChange}
          ariaLabel="Filter by status"
        />
      </div>

      <div className={fc.col}>
        <span className={fc.colLabel}>Sort</span>
        <SelectDropdown
          value={filterParams.sortBy || 'banned_at'}
          options={SORT_OPTIONS}
          onChange={onSortByChange}
          ariaLabel="Sort by"
        />
        <SelectDropdown
          value={filterParams.order || 'desc'}
          options={ORDER_OPTIONS}
          onChange={onOrderChange}
          ariaLabel="Sort order"
        />
      </div>

      <div className={fc.col}>
        <span className={fc.colLabel}>Date range</span>
        <div className={fc.dateGroup}>
          <label className={fc.dateLabel} htmlFor="ban-date-from">From</label>
          <input
            id="ban-date-from"
            type="date"
            className={fc.dateInput}
            value={filterParams.dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            max={filterParams.dateTo || undefined}
            aria-label="From date"
          />
        </div>
        <div className={fc.dateGroup}>
          <label className={fc.dateLabel} htmlFor="ban-date-to">To</label>
          <input
            id="ban-date-to"
            type="date"
            className={fc.dateInput}
            value={filterParams.dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            min={filterParams.dateFrom || undefined}
            aria-label="To date"
          />
        </div>
      </div>
    </div>
  )
}
