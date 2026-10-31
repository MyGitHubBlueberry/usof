import { useLayoutEffect, useRef, useState } from 'react'

export function useCollapsible({ maxHeight, lineClamp, watchKey }) {
  const ref = useRef(null)
  const [collapsed, setCollapsed] = useState(true)
  const [canExpand, setCanExpand] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) {
      setCanExpand(false)
      return
    }

    const threshold = lineClamp ? parseFloat(getComputedStyle(el).lineHeight) * lineClamp : maxHeight
    setCanExpand(el.scrollHeight > threshold + 1)
  }, [maxHeight, lineClamp, watchKey])

  return { ref, collapsed, canExpand, toggle: () => setCollapsed((v) => !v) }
}
