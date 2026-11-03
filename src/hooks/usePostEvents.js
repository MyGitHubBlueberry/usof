import { useEffect, useRef } from 'react'

const EVENT_NAMES = ['likes_updated', 'post_updated', 'comments_updated']

export function usePostEvents(postId, handlers) {
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    if (!postId) return

    const eventSource = new EventSource(`${import.meta.env.VITE_API_URL}/posts/${postId}/events`)

    const listeners = EVENT_NAMES.map((eventName) => {
      const listener = (e) => {
        const handler = handlersRef.current?.[eventName]
        if (!handler) return
        try {
          handler(JSON.parse(e.data))
        } catch {
          handler(null)
        }
      }
      eventSource.addEventListener(eventName, listener)
      return { eventName, listener }
    })

    return () => {
      listeners.forEach(({ eventName, listener }) => eventSource.removeEventListener(eventName, listener))
      eventSource.close()
    }
  }, [postId])
}
