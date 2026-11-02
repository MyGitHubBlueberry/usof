import { useState } from 'react'
import { IconEye, IconEyeClosed } from './Icons.jsx'
import s from './PasswordInput.module.css'

export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  inputClassName = '',
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={s.wrap}>
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        className={`${s.input} ${inputClassName}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className={s.toggleBtn}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {visible ? <IconEyeClosed size={16} /> : <IconEye size={16} />}
      </button>
    </div>
  )
}
