import { useState, useEffect } from 'react'

export function useAsyncData(asyncFn, deps = [], defaultData = []) {
  const [data, setData] = useState(defaultData)
  const [error, setError] = useState(null)
  const [resolvedKey, setResolvedKey] = useState(null)

  const requestKey = JSON.stringify(deps)
  const loading = resolvedKey !== requestKey

  useEffect(() => {
    let isMounted = true

    asyncFn()
      .then((res) => {
        if (!isMounted) return
        const result = res.data?.data ?? res.data ?? defaultData
        setData(result)
        setError(null)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err)
        setData(defaultData)
      })
      .finally(() => {
        if (isMounted) setResolvedKey(requestKey)
      })

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, setData }
}
