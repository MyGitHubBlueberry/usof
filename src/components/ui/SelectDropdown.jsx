import { useEffect, useRef, useState } from 'react'
import { IconChevron } from './Icons.jsx'
import s from './SelectDropdown.module.css'

export function SelectDropdown({
  value,
  options,
  onChange,
  ariaLabel,
  className = '',
  triggerClassName = '',
  placeholder = 'Select an option'
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

  const selected = options.find((o) => o.value === value)
  const displayLabel = selected ? selected.label : placeholder

  return (
    <div className={`${s.dropdownWrap} ${className}`} ref={ref}>
      <button
        type="button"
        className={`${s.dropdownTrigger} ${open ? s.open : ''} ${triggerClassName}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className={s.triggerText}>{displayLabel}</span>
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
