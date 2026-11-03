import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { categoriesService } from '../../services/categories.service'
import { postsService } from '../../services/posts.service'
import { useDebouncedCallback } from '../../hooks/useDebounce'
import { IconChevron, IconFilter } from '../ui/Icons.jsx'
import { SelectDropdown } from '../ui/SelectDropdown.jsx'
import { MultiSelectDropdown } from '../ui/MultiSelectDropdown.jsx'
import UserSearchCombobox from './UserSearchCombobox.jsx'
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

const SEARCH_TARGET_OPTIONS = [
  { value: 'posts', label: 'Posts' },
  { value: 'user', label: 'Username' },
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

export default function FeedControls({
  params,
  onChange,
  onReset = null,
  placeholder = 'Search posts…',
  showFiltersToggle = true,
  showReset = true,
  showSearchType = false,
  rightAction = null,
  searchRowExtra = null,
  customFilterRow = null,
  showActiveTags = true,
  searchAriaLabel = 'Search posts',
  activeFiltersCount: customActiveCount,
  isDirty: customIsDirty,
}) {
  const user = useSelector((state) => state.auth.user)
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  const [categories, setCategories] = useState([])
  const [dateRange, setDateRange] = useState({ min: '', max: '' })

  // default to expanded on desktop (>640px), collapsed on mobile
  const [isExpanded, setIsExpanded] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth > 640 : true
  ))

  const [searchMode, setSearchMode] = useState(() => (
    params.author && !params.search ? 'user' : 'posts'
  ))
  const [searchInput, setSearchInput] = useState(() => (
    params.author && !params.search ? (params.author || '') : (params.search || '')
  ))

  const [debouncedUpdate, cancelUpdate] = useDebouncedCallback((patch) => {
    onChange(patch)
  }, 400)

  const curSearch = params.search || ''
  const curAuthor = params.author || ''

  const [syncedSearch, setSyncedSearch] = useState(curSearch)
  const [syncedAuthor, setSyncedAuthor] = useState(curAuthor)

  if (curSearch !== syncedSearch || curAuthor !== syncedAuthor) {
    setSyncedSearch(curSearch)
    setSyncedAuthor(curAuthor)
    if (curAuthor && !curSearch) {
      setSearchMode('user')
      setSearchInput(curAuthor)
    } else if (curSearch) {
      setSearchMode('posts')
      setSearchInput(curSearch)
    } else {
      setSearchInput('')
    }
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

  function handleSearchValueChange(value) {
    setSearchInput(value)
    if (showSearchType && searchMode === 'user') {
      debouncedUpdate({ author: value, search: '', page: '1' })
    } else {
      debouncedUpdate({ search: value, author: '', page: '1' })
    }
  }

  function handleSearch(e) {
    handleSearchValueChange(e.target.value)
  }

  function handleSelectUser(login) {
    cancelUpdate()
    setSearchInput(login)
    onChange({ author: login, search: '', page: '1' })
  }

  function handleSearchModeChange(mode) {
    if (mode === searchMode) return
    setSearchMode(mode)
    cancelUpdate()
    if (searchInput.trim()) {
      if (mode === 'user') {
        onChange({ search: '', author: searchInput.trim(), page: '1' })
      } else {
        onChange({ author: '', search: searchInput.trim(), page: '1' })
      }
    }
  }

  function handleSearchKey(e) { if (e.key === 'Escape') e.target.blur() }
  function handleDateFrom(e) { onChange({ dateFrom: e.target.value, page: '1' }) }
  function handleDateTo(e) { onChange({ dateTo: e.target.value, page: '1' }) }

  function openDatePicker(e) {
    try {
      e.target.showPicker?.()
    } catch {
      // Ignored if showPicker is unsupported or already open
    }
  }

  function removeCategory(title) {
    const next = selectedCats.filter((c) => c !== title)
    onChange({ categories: next.join(','), page: '1' })
  }

  function clearAll() {
    cancelUpdate()
    setSearchInput('')
    if (onReset) {
      onReset()
    } else {
      onChange({
        search: '', author: '', categories: '', status: '',
        sort: 'date', order: 'desc',
        dateFrom: '', dateTo: '', page: '1',
      })
    }
  }

  const activeCategoryTags = selectedCats.map((cat) => ({
    key: `cat:${cat}`,
    label: cat,
    onRemove: () => removeCategory(cat),
  }))

  const isSortChanged =
    (params.sort && params.sort !== 'date') ||
    (params.order && params.order !== 'desc')

  const defaultActiveFiltersCount =
    selectedCats.length +
    (params.status ? 1 : 0) +
    (isSortChanged ? 1 : 0) +
    (params.dateFrom || params.dateTo ? 1 : 0)

  const resolvedActiveCount = customActiveCount !== undefined
    ? customActiveCount
    : defaultActiveFiltersCount

  const defaultIsDirty =
    Boolean(searchInput && searchInput.trim()) ||
    Boolean(params.search && params.search.trim()) ||
    Boolean(params.author && params.author.trim()) ||
    defaultActiveFiltersCount > 0

  const resolvedIsDirty = customIsDirty !== undefined
    ? (customIsDirty || Boolean(searchInput && searchInput.trim()))
    : defaultIsDirty

  function renderSearchBar() {
    const computedPlaceholder = showSearchType
      ? (searchMode === 'user' ? 'Search by username…' : 'Search posts…')
      : placeholder

    const computedAriaLabel = showSearchType
      ? (searchMode === 'user' ? 'Search by username' : searchAriaLabel)
      : searchAriaLabel

    return (
      <div className={s.searchRow}>
        {showSearchType && (
          <SelectDropdown
            className={s.searchTypeWrap}
            value={searchMode}
            options={SEARCH_TARGET_OPTIONS}
            onChange={handleSearchModeChange}
            ariaLabel="Search target"
          />
        )}

        {showSearchType && searchMode === 'user' ? (
          <UserSearchCombobox
            value={searchInput}
            onChange={handleSearchValueChange}
            onSelect={handleSelectUser}
            placeholder={computedPlaceholder}
            ariaLabel={computedAriaLabel}
          />
        ) : (
          <input
            type="search"
            className={s.searchInput}
            placeholder={computedPlaceholder}
            value={searchInput}
            onChange={handleSearch}
            onKeyDown={handleSearchKey}
            aria-label={computedAriaLabel}
          />
        )}

        {showFiltersToggle && (
          <button
            type="button"
            className={`${s.toggleFiltersBtn} ${isExpanded ? s.open : ''}`}
            onClick={() => setIsExpanded((v) => !v)}
            aria-expanded={isExpanded}
            title={isExpanded ? 'Hide filters' : 'Show filters'}
          >
            <IconFilter size={14} className={s.itemIcon} />
            <span className={s.toggleBtnText}>Filters</span>
            {resolvedActiveCount > 0 && (
              <span className={s.filterBadge}>{resolvedActiveCount}</span>
            )}
            <IconChevron up={isExpanded} className={s.itemIcon} />
          </button>
        )}

        {searchRowExtra}

        {rightAction}

        {showReset && resolvedIsDirty && (
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
      selectedCats.length === 0
        ? 'All categories'
        : selectedCats.length === 1
          ? selectedCats[0]
          : `${selectedCats.length} categories`

    const categoryOptions = categories.map((cat) => ({
      value: cat.title,
      label: cat.title,
      description: cat.description || '',
    }))

    return (
      <div className={s.col}>
        <span className={s.colLabel}>Filter</span>

        <MultiSelectDropdown
          selectedValues={selectedCats}
          options={categoryOptions}
          onChange={(nextCats) => onChange({ categories: nextCats.join(','), page: '1' })}
          triggerLabel={triggerLabel}
          emptyLabel="No categories"
        />

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
            onClick={openDatePicker}
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
            onClick={openDatePicker}
            min={params.dateFrom || dateRange.min || undefined}
            max={dateRange.max || undefined}
            aria-label="To date"
          />
        </div>
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
      {customFilterRow
        ? (showFiltersToggle ? (isExpanded && customFilterRow) : customFilterRow)
        : (showFiltersToggle && isExpanded && (
          <div className={s.filterRow}>
            {renderFilterColumn()}
            {renderSortColumn()}
            {renderDateRangeColumn()}
          </div>
        ))
      }
      {showActiveTags && renderActiveCategoryTags()}
    </div>
  )
}
