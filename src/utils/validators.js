export const MIN_PASSWORD_LENGTH = 8
const LOGIN_PATTERN = /^[a-zA-Z0-9_]+$/

export function validateLogin(login) {
  const trimmed = (login || '').trim()
  if (!trimmed) return 'Login is required'
  if (trimmed.length < 3) return 'At least 3 characters'
  if (!LOGIN_PATTERN.test(trimmed)) return 'Letters, numbers and _ only'
  return ''
}

export function validatePassword(password) {
  if (!password) return 'Password is required'
  if (password.length < MIN_PASSWORD_LENGTH) return `At least ${MIN_PASSWORD_LENGTH} characters`
  return ''
}

export function validateConfirmedPassword(password, confirmedPassword) {
  if (!confirmedPassword) return 'Please confirm the password'
  if (password !== confirmedPassword) return 'Passwords do not match'
  return ''
}
