import { useEffect, useRef, useState } from 'react'
import { IconChevron } from './Icons.jsx'
import s from './SelectDropdown.module.css'

export function MultiSelectDropdown({
  selectedValues = [],
  options = [], // [{ value: '1', label: 'Category' }]
  onChange, // returns array of selected values
  triggerLabel = 'Select options',
  emptyLabel = 'No options available',
  className = ''
}) {
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

  function toggleOption(value) {
    const next = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value]
    onChange(next)
  }

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
          {options.length === 0 ? (
            <div className={s.dropdownEmpty}>{emptyLabel}</div>
          ) : (
            options.map((opt) => {
              const checked = selectedValues.includes(opt.value)
              return (
                <label
                  key={opt.value}
                  className={`${s.checkItem} ${checked ? s.checked : ''}`}
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
