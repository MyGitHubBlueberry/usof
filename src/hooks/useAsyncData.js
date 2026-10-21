import { useState, useEffect } from 'react'

export function useAsyncData(asyncFn, deps = [], defaultData = []) {
  const [data, setData] = useState(defaultData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    asyncFn()
      .then((res) => {
        if (!isMounted) return
        const result = res.data?.data ?? res.data ?? defaultData
        setData(result)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err)
        setData(defaultData)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, setData }
}
