const STORAGE_KEY = 'usof:recent-logins'
const MAX_ENTRIES = 5

export function getRecentLogins() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function addRecentLogin(login) {
  const trimmed = login?.trim()
  if (!trimmed) return
  try {
    const next = [trimmed, ...getRecentLogins().filter((l) => l !== trimmed)].slice(0, MAX_ENTRIES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // localStorage unavailable (private browsing, quota exceeded) — not critical, skip silently
  }
}
