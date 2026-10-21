import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { categoriesService } from '../../services/categories.service'
import { postsService } from '../../services/posts.service'
import { useDebouncedCallback } from '../../hooks/useDebounce'
import { IconChevron, IconFilter } from '../ui/Icons.jsx'
import s from './FeedControls.module.css'

const BASE_STATUS_OPTIONS = [
  { value: '', label: 'Any status' },
  { value: 'active', label: 'Active' },
  { value: 'resolved', label: 'Resolved' },
]
const ADMIN_STATUS_OPTION = { value: 'inactive', label: 'Inactive' }

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'likes', label: 'Likes' },
]

function getOrderOptions(sort) {
  return sort === 'likes'
    ? [
      { value: 'desc', label: 'Most liked' },
      { value: 'asc', label: 'Least liked' },
    ]
    : [
      { value: 'desc', label: 'Newest first' },
      { value: 'asc', label: 'Oldest first' },
    ]
}

function SelectDropdown({ value, options, onChange, ariaLabel }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const selected = options.find((o) => o.value === value) || options[0]

  return (
    <div className={s.dropdownWrap} ref={ref}>
      <button
        type="button"
        className={`${s.dropdownTrigger} ${open ? s.open : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className={s.triggerText}>{selected?.label}</span>
        <IconChevron up={open} className={s.itemIcon} />
      </button>

      {open && (
        <div className={s.dropdownMenu} role="listbox">
          {options.map((o) => {
            const isSelected = o.value === value
            return (
              <button
                key={o.value}
                type="button"
                className={`${s.dropdownOption} ${isSelected ? s.selectedOption : ''}`}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                role="option"
                aria-selected={isSelected}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function FeedControls({ params, onChange }) {
  const user = useSelector((state) => state.auth.user)
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  const [categories, setCategories] = useState([])
  const [dateRange, setDateRange] = useState({ min: '', max: '' })
  const [catOpen, setCatOpen] = useState(false)
  const catRef = useRef(null)

  // default to expanded on desktop (>640px), collapsed on mobile
  const [isExpanded, setIsExpanded] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth > 640 : true
  ))

  const [searchInput, setSearchInput] = useState(params.search || '')
  const [prevSearchParam, setPrevSearchParam] = useState(params.search || '')

  const [debouncedSearch, cancelSearch] = useDebouncedCallback((value) => {
    onChange({ search: value, page: '1' })
  }, 400)

  if ((params.search || '') !== prevSearchParam) {
    setPrevSearchParam(params.search || '')
    setSearchInput(params.search || '')
  }

  const selectedCats = params.categories
    ? params.categories.split(',').filter(Boolean)
    : []

  const statusOptions = isAdmin
    ? [...BASE_STATUS_OPTIONS, ADMIN_STATUS_OPTION]
    : BASE_STATUS_OPTIONS

  const orderOptions = getOrderOptions(params.sort || 'date')

  useEffect(() => {
    categoriesService
      .getAll({ limit: 100 })
      .then((res) => setCategories(res.data?.data || []))
      .catch(() => setCategories([]))
  }, [])

  // oldest/newest post dates for date pickers
  useEffect(() => {
    Promise.all([
      postsService.getAll({ sort: 'date', order: 'asc', limit: 1 }),
      postsService.getAll({ sort: 'date', order: 'desc', limit: 1 }),
    ])
      .then(([oldest, newest]) => {
        const minDate = oldest.data?.data?.[0]?.publish_date
        const maxDate = newest.data?.data?.[0]?.publish_date
        setDateRange({
          min: minDate ? minDate.slice(0, 10) : '',
          max: maxDate ? maxDate.slice(0, 10) : '',
        })
      })
      .catch(() => { })
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (catRef.current && !catRef.current.contains(e.target)) {
        setCatOpen(false)
      }
    }
    if (catOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [catOpen])

  function handleSearch(e) {
    const value = e.target.value
    setSearchInput(value)
    debouncedSearch(value)
  }

  function handleSearchKey(e) { if (e.key === 'Escape') e.target.blur() }
  function handleDateFrom(e) { onChange({ dateFrom: e.target.value, page: '1' }) }
  function handleDateTo(e) { onChange({ dateTo: e.target.value, page: '1' }) }

  function toggleCategory(title) {
    const next = selectedCats.includes(title)
      ? selectedCats.filter((c) => c !== title)
      : [...selectedCats, title]
    onChange({ categories: next.join(','), page: '1' })
  }

  function removeCategory(title) {
    const next = selectedCats.filter((c) => c !== title)
    onChange({ categories: next.join(','), page: '1' })
  }

  function clearAll() {
    cancelSearch()
    onChange({
      search: '', categories: '', status: '',
      sort: 'date', order: 'desc',
      dateFrom: '', dateTo: '', page: '1',
    })
  }

  function clearDates() {
    onChange({ dateFrom: '', dateTo: '', page: '1' })
  }

  const activeCategoryTags = selectedCats.map((cat) => ({
    key: `cat:${cat}`,
    label: cat,
    onRemove: () => removeCategory(cat),
  }))

  const activeFiltersCount =
    selectedCats.length +
    (params.status ? 1 : 0) +
    (params.sort !== 'date' || params.order !== 'desc' ? 1 : 0) +
    (params.dateFrom || params.dateTo ? 1 : 0)

  const hasDirtyFilters =
    params.search ||
    activeFiltersCount > 0

  function renderSearchBar() {
    return (
      <div className={s.searchRow}>
        <input
          type="search"
          className={s.searchInput}
          placeholder="Search posts…"
          value={searchInput}
          onChange={handleSearch}
          onKeyDown={handleSearchKey}
          aria-label="Search posts"
        />

        <button
          type="button"
          className={`${s.toggleFiltersBtn} ${isExpanded ? s.open : ''}`}
          onClick={() => setIsExpanded((v) => !v)}
          aria-expanded={isExpanded}
          title={isExpanded ? 'Hide filters' : 'Show filters'}
        >
          <IconFilter size={14} />
          <span className={s.toggleBtnText}>Filters</span>
          {activeFiltersCount > 0 && (
            <span className={s.filterBadge}>{activeFiltersCount}</span>
          )}
          <IconChevron up={isExpanded} className={s.itemIcon} />
        </button>

        {hasDirtyFilters && (
          <button
            type="button"
            className={s.clearAllBtn}
            onClick={clearAll}
            title="Reset all filters"
          >
            Reset
          </button>
        )}
      </div>
    )
  }

  function renderFilterColumn() {
    const triggerLabel =
      selectedCats.length === 0 ? 'All categories' :
        selectedCats.length === 1 ? selectedCats[0] :
          `${selectedCats.length} categories`

    return (
      <div className={s.col}>
        <span className={s.colLabel}>Filter</span>

        <div className={s.dropdownWrap} ref={catRef}>
          <button
            type="button"
            className={`${s.dropdownTrigger} ${catOpen ? s.open : ''}`}
            onClick={() => setCatOpen((v) => !v)}
            aria-expanded={catOpen}
            aria-haspopup="listbox"
          >
            <span className={s.triggerText}>{triggerLabel}</span>
            <IconChevron up={catOpen} className={s.itemIcon} />
          </button>

          {catOpen && (
            <div className={s.dropdownMenu} role="listbox" aria-multiselectable="true">
              {categories.length === 0 ? (
                <div className={s.dropdownEmpty}>No categories</div>
              ) : (
                categories.map((cat) => {
                  const checked = selectedCats.includes(cat.title)
                  return (
                    <label
                      key={cat.id}
                      className={`${s.checkItem} ${checked ? s.checked : ''}`}
                    >
                      <input
                        type="checkbox"
                        className={s.hiddenCheck}
                        checked={checked}
                        onChange={() => toggleCategory(cat.title)}
                      />
                      <span className={s.checkBox} />
                      <span className={s.checkLabel}>{cat.title}</span>
                    </label>
                  )
                })
              )}
            </div>
          )}
        </div>

        <SelectDropdown
          value={params.status || ''}
          options={statusOptions}
          onChange={(val) => onChange({ status: val, page: '1' })}
          ariaLabel="Filter by status"
        />
      </div>
    )
  }

  function renderSortColumn() {
    return (
      <div className={s.col}>
        <span className={s.colLabel}>Sort</span>
        <SelectDropdown
          value={params.sort || 'date'}
          options={SORT_OPTIONS}
          onChange={(val) => onChange({ sort: val, order: 'desc', page: '1' })}
          ariaLabel="Sort by"
        />
        <SelectDropdown
          value={params.order || 'desc'}
          options={orderOptions}
          onChange={(val) => onChange({ order: val, page: '1' })}
          ariaLabel="Sort order"
        />
      </div>
    )
  }

  function renderDateRangeColumn() {
    return (
      <div className={s.col}>
        <span className={s.colLabel}>Date range</span>
        <div className={s.dateGroup}>
          <label className={s.dateLabel} htmlFor="feed-date-from">From</label>
          <input
            id="feed-date-from"
            type="date"
            className={s.dateInput}
            value={params.dateFrom || ''}
            onChange={handleDateFrom}
            min={dateRange.min || undefined}
            max={params.dateTo || dateRange.max || undefined}
            aria-label="From date"
          />
        </div>
        <div className={s.dateGroup}>
          <label className={s.dateLabel} htmlFor="feed-date-to">To</label>
          <input
            id="feed-date-to"
            type="date"
            className={s.dateInput}
            value={params.dateTo || ''}
            onChange={handleDateTo}
            min={params.dateFrom || dateRange.min || undefined}
            max={dateRange.max || undefined}
            aria-label="To date"
          />
        </div>
        {(params.dateFrom || params.dateTo) && (
          <button type="button" className={s.clearDatesBtn} onClick={clearDates}>
            Clear dates
          </button>
        )}
      </div>
    )
  }

  function renderActiveCategoryTags() {
    if (activeCategoryTags.length === 0) return null
    return (
      <div className={s.tagsRow}>
        {activeCategoryTags.map((tag) => (
          <button
            key={tag.key}
            type="button"
            className={s.tag}
            onClick={tag.onRemove}
            title={`Remove category: ${tag.label}`}
          >
            {tag.label}
            <span className={s.tagX} aria-hidden="true">×</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={s.controls}>
      {renderSearchBar()}
      {isExpanded && (
        <div className={s.filterRow}>
          {renderFilterColumn()}
          {renderSortColumn()}
          {renderDateRangeColumn()}
        </div>
      )}
      {renderActiveCategoryTags()}
    </div>
  )
}
