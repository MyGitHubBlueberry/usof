import { useEffect, useRef } from 'react'

// Runs `callback` every `intervalMs` while the tab is visible. Polling pauses
// when the tab is backgrounded and fires once immediately when the tab/window
// regains focus, so data stays fresh without wasting requests while idle.
export function usePolling(callback, intervalMs, deps) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    let timer = null

    function tick() {
      callbackRef.current()
    }

    function start() {
      if (timer) return
      timer = setInterval(tick, intervalMs)
    }

    function stop() {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        stop()
      } else {
        tick()
        start()
      }
    }

    if (!document.hidden) start()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
