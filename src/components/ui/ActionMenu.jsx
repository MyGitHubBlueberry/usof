import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import s from './ActionMenu.module.css'

const MenuContext = createContext(null)

export default function ActionMenu({ trigger, align = 'right', panelClassName = '', children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const close = () => setOpen(false)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) close()
    }
    function handleEscape(e) {
      if (e.key === 'Escape') close()
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div className={s.wrap} ref={ref}>
      {trigger({ open, toggle: () => setOpen((v) => !v) })}

      {open && (
        <div className={`${s.panel} ${align === 'left' ? s.alignLeft : s.alignRight} ${panelClassName}`}>
          <MenuContext.Provider value={{ close }}>{children}</MenuContext.Provider>
        </div>
      )}
    </div>
  )
}

export function ActionMenuItem({ icon, to, onClick, danger, disabled, keepOpen, children }) {
  const { close } = useContext(MenuContext)
  const className = `${s.item} ${danger ? s.itemDanger : ''}`

  function handleClick(e) {
    if (disabled) return
    onClick?.(e)
    if (!keepOpen) close()
  }

  if (to) {
    return (
      <Link to={to} className={className} onClick={handleClick}>
        {icon}
        <span>{children}</span>
      </Link>
    )
  }

  return (
    <button type="button" className={className} onClick={handleClick} disabled={disabled}>
      {icon}
      <span>{children}</span>
    </button>
  )
}

export function ActionMenuDivider() {
  return <div className={s.divider} />
}

export function ActionMenuHeader({ to, children }) {
  const { close } = useContext(MenuContext)

  if (to) {
    return (
      <Link to={to} className={s.header} onClick={close}>
        {children}
      </Link>
    )
  }

  return <div className={s.header}>{children}</div>
}
