import { useEffect, useRef, useState } from 'react'
import { IconChevron, IconX } from './Icons.jsx'
import s from './SelectDropdown.module.css'

export function MultiSelectDropdown({
  selectedValues = [],
  options = [], // [{ value: '1', label: 'Category', description?: '...' }]
  onChange, // returns array of selected values
  triggerLabel = 'Select options',
  emptyLabel = 'No options available',
  className = ''
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [wasOpen, setWasOpen] = useState(open)
  const ref = useRef(null)
  const searchRef = useRef(null)

  if (wasOpen !== open) {
    setWasOpen(open)
    if (!open && query !== '') setQuery('')
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  function toggleOption(value) {
    const next = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value]
    onChange(next)
  }

  const filteredOptions = query.trim()
    ? options.filter((opt) => opt.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options

  return (
    <div className={`${s.dropdownWrap} ${className}`} ref={ref}>
      <button
        type="button"
        className={`${s.dropdownTrigger} ${open ? s.open : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={s.triggerText}>{triggerLabel}</span>
        <IconChevron up={open} className={s.itemIcon} />
      </button>

      {open && (
        <div className={s.dropdownMenu} role="listbox" aria-multiselectable="true">
          {selectedValues.length > 0 && (
            <button type="button" className={s.clearSelectionBtn} onClick={() => onChange([])}>
              <IconX size={10} />
              <span>Clear selection</span>
            </button>
          )}

          {options.length > 0 && (
            <input
              ref={searchRef}
              type="text"
              className={s.dropdownSearch}
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search options"
            />
          )}

          {options.length === 0 ? (
            <div className={s.dropdownEmpty}>{emptyLabel}</div>
          ) : filteredOptions.length === 0 ? (
            <div className={s.dropdownEmpty}>No matching options</div>
          ) : (
            filteredOptions.map((opt) => {
              const checked = selectedValues.includes(opt.value)
              return (
                <label
                  key={opt.value}
                  className={`${s.checkItem} ${checked ? s.checked : ''}`}
                  title={opt.description || undefined}
                >
                  <input
                    type="checkbox"
                    className={s.hiddenCheck}
                    checked={checked}
                    onChange={() => toggleOption(opt.value)}
                  />
                  <span className={s.checkBox} />
                  <span className={s.checkLabel}>{opt.label}</span>
                </label>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
