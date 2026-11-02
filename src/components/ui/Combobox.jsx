import { useEffect, useRef, useState } from 'react'
import { IconX } from './Icons.jsx'
import sd from './SelectDropdown.module.css'
import s from './Combobox.module.css'

export default function Combobox({
  id,
  name,
  value,
  onChange,
  onBlur,
  suggestions = [],
  placeholder = '',
  ariaLabel,
  className = '',
  inputClassName = '',
  autoComplete = 'off',
  maxVisible = 8,
}) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
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

  const query = value.trim().toLowerCase()
  const filtered = (query
    ? suggestions.filter((item) => item.toLowerCase().includes(query) && item.toLowerCase() !== query)
    : suggestions
  ).slice(0, maxVisible)

  function selectOption(item) {
    onChange(item)
    setOpen(false)
    setHighlighted(-1)
  }

  function handleInputChange(e) {
    onChange(e.target.value)
    setOpen(true)
    setHighlighted(-1)
  }

  function handleKeyDown(e) {
    if (!open || filtered.length === 0) {
      if (e.key === 'ArrowDown' && filtered.length > 0) setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((i) => (i + 1) % filtered.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((i) => (i <= 0 ? filtered.length - 1 : i - 1))
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault()
      selectOption(filtered[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setHighlighted(-1)
    }
  }

  function clearValue() {
    onChange('')
    setOpen(false)
    setHighlighted(-1)
  }

  function suggestionList() {
    if (!open || filtered.length === 0) return null
    return (
      <div className={sd.dropdownMenu} role="listbox">
        {filtered.map((item, i) => (
          <button
            key={item}
            type="button"
            className={`${sd.dropdownOption} ${i === highlighted ? sd.selectedOption : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => selectOption(item)}
            role="option"
            aria-selected={i === highlighted}
          >
            {item}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={`${sd.dropdownWrap} ${className}`} ref={ref}>
      <div className={s.inputWrap}>
        <input
          id={id}
          name={name}
          type="text"
          className={`${s.input} ${inputClassName}`}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          aria-label={ariaLabel}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete={autoComplete}
        />
        {value && (
          <button
            type="button"
            className={s.clearBtn}
            onClick={clearValue}
            aria-label="Clear"
            tabIndex={-1}
          >
            <IconX/>
          </button>
        )}
      </div>

      {suggestionList()}
    </div>
  )
}
