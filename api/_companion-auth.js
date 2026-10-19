export const COMPANION_SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ixqoosixhahrsgwoxyme.supabase.co'
export const COMPANION_SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

export const COMPANION_OWNER_EMAIL = (process.env.COMPANION_OWNER_EMAIL || 'dracorisz@gmail.com').trim().toLowerCase()

export async function authenticateCompanionRequest(req) {
  const authorization = String(req.headers?.authorization || '')
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
  if (!token || !COMPANION_SUPABASE_KEY) return { ok: false, status: 401, message: 'Sign in to use Companion.' }

  let response
  try {
    response = await fetch(`${COMPANION_SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: COMPANION_SUPABASE_KEY, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    return { ok: false, status: 503, message: 'Authentication service is temporarily unavailable.' }
  }
  if (!response.ok) return { ok: false, status: 401, message: 'Sign in to use Companion.' }

  const user = await response.json().catch(() => null)
  if (!user?.id) return { ok: false, status: 401, message: 'Sign in to use Companion.' }
  if (String(user.email || '').trim().toLowerCase() !== COMPANION_OWNER_EMAIL) {
    return { ok: false, status: 403, message: 'Companion is currently restricted to its owner.' }
  }
  return { ok: true, user, accessToken: token }
}
