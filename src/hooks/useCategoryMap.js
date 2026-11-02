import { useEffect, useState } from 'react'
import { categoriesService } from '../services/categories.service'

let cachedPromise = null

function loadCategoryMap() {
  if (!cachedPromise) {
    cachedPromise = categoriesService
      .getAll({ limit: 100 })
      .then((res) => {
        const cats = res.data?.data ?? []
        return Object.fromEntries(cats.map((c) => [c.title, c.description || '']))
      })
      .catch(() => {
        cachedPromise = null
        return {}
      })
  }
  return cachedPromise
}

export function useCategoryMap() {
  const [map, setMap] = useState({})

  useEffect(() => {
    let isMounted = true
    loadCategoryMap().then((result) => {
      if (isMounted) setMap(result)
    })
    return () => {
      isMounted = false
    }
  }, [])

  return map
}
