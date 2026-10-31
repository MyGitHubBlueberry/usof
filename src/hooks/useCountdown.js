import { useEffect, useState } from 'react'

function getRemainingMs(targetDate) {
  if (!targetDate) return 0
  return Math.max(0, new Date(targetDate).getTime() - Date.now())
}

export function useCountdown(targetDate) {
  const [remainingMs, setRemainingMs] = useState(() => getRemainingMs(targetDate))

  useEffect(() => {
    if (!targetDate) return
    const id = setInterval(() => setRemainingMs(getRemainingMs(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  const totalSeconds = Math.floor(remainingMs / 1000)

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: !!targetDate && remainingMs <= 0,
  }
}
