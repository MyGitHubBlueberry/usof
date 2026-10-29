import { useEffect, useState } from 'react'
import { usersService } from '../services/users.service'

export function useAvatarUrl(userId, avatarPath) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!userId || !avatarPath) {
      setUrl(null)
      return
    }

    let objectUrl = null
    let cancelled = false

    usersService
      .getAvatar(userId)
      .then((res) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(res.data)
        setUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setUrl(null)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [userId, avatarPath])

  return url
}
