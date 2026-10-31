import { useRef, useState } from 'react'
import { IconCheck } from '../ui/Icons'
import s from './CodeBlock.module.css'

export default function CodeBlock({ children, ...props }) {
  const preRef = useRef(null)
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const text = preRef.current?.textContent ?? ''
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className={s.wrap}>
      <button type="button" className={s.copyBtn} onClick={handleCopy}>
        {copied ? (
          <>
            <IconCheck size={11} />
            <span>Copied!</span>
          </>
        ) : (
          <span>Copy</span>
        )}
      </button>
      <pre ref={preRef} {...props}>
        {children}
      </pre>
    </div>
  )
}
