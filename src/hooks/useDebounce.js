import { useEffect, useRef, useCallback } from 'react'

/**
 * Returns a debounced version of `callback` that delays invoking it
 * until `delay` milliseconds have elapsed since the last call.
 * Also returns a `cancel` function to abort any pending invocation.
 *
 * @param {Function} callback - Function to debounce
 * @param {number}   delay    - Delay in milliseconds (default: 400)
 * @returns {[Function, Function]} [debouncedCallback, cancel]
 */
export function useDebouncedCallback(callback, delay = 400) {
  const timerRef = useRef(null)
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const debounced = useCallback(
    (...args) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  )

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return [debounced, cancel]
}
