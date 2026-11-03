import { useEffect, useRef, useState } from 'react'
import { usersService } from '../../services/users.service'
import { useDebouncedCallback } from '../../hooks/useDebounce'
import Avatar from '../ui/Avatar'
import s from './UserSearchCombobox.module.css'

export default function UserSearchCombobox({
  value,
  onChange,
  onSelect,
  placeholder,
  ariaLabel,
  className = '',
}) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  const [debouncedFetch, cancelFetch] = useDebouncedCallback((query) => {
    usersService
      .search(query, 8)
      .then((res) => {
        setSuggestions(res.data || [])
        setOpen(true)
      })
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false))
  }, 250)

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleChange(e) {
    const next = e.target.value
    onChange(next)
    setHighlightedIndex(-1)

    const trimmed = next.trim()
    if (!trimmed) {
      cancelFetch()
      setSuggestions([])
      setOpen(false)
      setLoading(false)
      return
    }

    setLoading(true)
    debouncedFetch(trimmed)
  }

  function handleSelect(user) {
    setOpen(false)
    setSuggestions([])
    onSelect(user.login)
    inputRef.current?.blur()
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setOpen(false)
      e.target.blur()
      return
    }
    if (!open || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[highlightedIndex])
    }
  }

  function handleFocus() {
    if (value.trim() && suggestions.length > 0) setOpen(true)
  }

  return (
    <div className={`${s.wrap} ${className}`} ref={wrapRef}>
      <input
        ref={inputRef}
        type="text"
        className={s.input}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-autocomplete="list"
        role="combobox"
        autoComplete="off"
      />

      {open && (
        <ul className={s.menu} role="listbox">
          {suggestions.map((user, i) => (
            <li key={user.id}>
              <button
                type="button"
                className={`${s.option} ${i === highlightedIndex ? s.highlighted : ''}`}
                onMouseEnter={() => setHighlightedIndex(i)}
                onClick={() => handleSelect(user)}
                role="option"
                aria-selected={i === highlightedIndex}
              >
                <Avatar
                  userId={user.id}
                  avatarPath={user.profile_picture_path}
                  name={user.login}
                  size="small"
                />
                <span className={s.login}>{user.login}</span>
              </button>
            </li>
          ))}
          {suggestions.length === 0 && (
            <li className={s.empty}>{loading ? 'Searching…' : 'No matching users'}</li>
          )}
        </ul>
      )}
    </div>
  )
}
