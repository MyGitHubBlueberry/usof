export function formatDate(dateString, options = { month: 'short', day: 'numeric' }) {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleDateString(undefined, options)
  } catch {
    return ''
  }
}

export function formatFullDate(dateString) {
  return formatDate(dateString, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
