import { useState, useCallback, useRef } from 'react'
import { FlashContext } from './FlashContext'
import Flash from '../components/ui/Flash'

export function FlashProvider({ children, timeout = 3000 }) {
  const [flash, setFlash] = useState(null)
  const timerRef = useRef(null)

  const showFlash = useCallback((msg, type = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setFlash({ msg, type })
    timerRef.current = setTimeout(() => {
      setFlash(null)
    }, timeout)
  }, [timeout])

  const clearFlash = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setFlash(null)
  }, [])

  const value = { flash, showFlash, clearFlash }

  return (
    <FlashContext.Provider value={value}>
      <Flash />
      {children}
    </FlashContext.Provider>
  )
}

export default FlashProvider
