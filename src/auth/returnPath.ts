const AUTH_RETURN_PATH_KEY = 'appforge-auth-return-path'

export function normalizeReturnPath(value?: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) return '/'
  return value
}

export function rememberReturnPath(value?: string | null) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(AUTH_RETURN_PATH_KEY, normalizeReturnPath(value))
}

export function consumeReturnPath(fallback = '/') {
  if (typeof window === 'undefined') return normalizeReturnPath(fallback)
  const stored = window.sessionStorage.getItem(AUTH_RETURN_PATH_KEY)
  window.sessionStorage.removeItem(AUTH_RETURN_PATH_KEY)
  return normalizeReturnPath(stored || fallback)
}
