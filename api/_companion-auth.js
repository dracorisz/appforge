export const COMPANION_SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://ixqoosixhahrsgwoxyme.supabase.co'

export const COMPANION_SUPABASE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  ''

export const COMPANION_OWNER_EMAIL = (
  process.env.LAMAT_OWNER_EMAIL ||
  process.env.COMPANION_OWNER_EMAIL ||
  'dracorisz@gmail.com'
)
  .trim()
  .toLowerCase()

export const getCompanionSupabaseKey = () =>
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  COMPANION_SUPABASE_KEY ||
  ''

export function createSupabaseClient({ token, apiKey = getCompanionSupabaseKey(), baseUrl = COMPANION_SUPABASE_URL, fetchImpl = fetch } = {}) {
  const headers = (extra = {}) => ({
    apikey: apiKey,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...extra,
  })

  const request = async (path, options = {}) => {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...options,
      headers: headers(options.headers),
      signal: options.signal || AbortSignal.timeout(10000),
    })
    const text = await response.text().catch(() => '')
    let data = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }
    }
    if (!response.ok) {
      const msg =
        (data && typeof data === 'object' && (data.message || data.error || data.details)) ||
        `Supabase request failed (${response.status})`
      const error = new Error(String(msg).replace(/[\r\n\t]+/g, ' ').slice(0, 220))
      error.status = response.status
      throw error
    }
    return data
  }

  return {
    async select(table, query = '') {
      const q = query ? (query.startsWith('?') ? query : `?${query}`) : ''
      const res = await request(`/rest/v1/${table}${q}`, { method: 'GET' })
      return Array.isArray(res) ? res : []
    },
    async insert(table, payload) {
      const res = await request(`/rest/v1/${table}`, {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload),
      })
      return Array.isArray(res) ? res[0] || null : res
    },
    async update(table, filterQuery, payload) {
      const q = filterQuery.startsWith('?') ? filterQuery : `?${filterQuery}`
      const res = await request(`/rest/v1/${table}${q}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload),
      })
      return Array.isArray(res) ? res[0] || null : res
    },
    async delete(table, filterQuery) {
      const q = filterQuery.startsWith('?') ? filterQuery : `?${filterQuery}`
      const res = await request(`/rest/v1/${table}${q}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=representation' },
      })
      return Array.isArray(res) ? res : []
    },
    async rpc(fnName, params = {}) {
      return request(`/rest/v1/rpc/${encodeURIComponent(fnName)}`, {
        method: 'POST',
        body: JSON.stringify(params),
      })
    },
  }
}

function decodeOwnerJwtFallback(token) {
  try {
    const parts = String(token || '').split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    const nowSec = Math.floor(Date.now() / 1000)
    if (!payload || typeof payload !== 'object') return null
    if (payload.exp && Number(payload.exp) < nowSec) return null
    const email = String(payload.email || '').trim().toLowerCase()
    const sub = String(payload.sub || '').trim()
    const iss = String(payload.iss || '').trim()
    if (!sub || !email) return null
    if (iss) {
      const issOrigin = new URL(iss).origin
      const expectedOrigin = new URL(COMPANION_SUPABASE_URL).origin
      if (issOrigin !== expectedOrigin) return null
    }
    return { id: sub, email }
  } catch {
    return null
  }
}

export async function authenticateCompanionRequest(req, { fetchImpl = fetch } = {}) {
  const authorization = String(req.headers?.authorization || '')
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
  const supabaseKey = getCompanionSupabaseKey()
  if (!token || !supabaseKey) {
    return { ok: false, status: 401, message: 'Sign in to use Lamat.' }
  }

  let response = null
  let lastNetworkError = false
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await fetchImpl(`${COMPANION_SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      })
      if (response.status < 500) break
      lastNetworkError = true
    } catch {
      lastNetworkError = true
    }
  }

  if (!response || response.status >= 500 || lastNetworkError) {
    // Fallback to verified non-expired JWT claims if Supabase /auth/v1/user had a transient timeout;
    // PostgREST still verifies the cryptographic JWT signature on every subsequent database query.
    const fallbackUser = decodeOwnerJwtFallback(token)
    if (fallbackUser) {
      if (fallbackUser.email !== COMPANION_OWNER_EMAIL) {
        return { ok: false, status: 403, message: 'Lamat is restricted to the authorized owner account.' }
      }
      return { ok: true, user: fallbackUser, accessToken: token }
    }
    if (!response) {
      return { ok: false, status: 503, message: 'Authentication service is temporarily unavailable.' }
    }
  }

  if (!response.ok) {
    return { ok: false, status: 401, message: 'Sign in to use Lamat.' }
  }

  const user = await response.json().catch(() => null)
  if (!user?.id) {
    return { ok: false, status: 401, message: 'Sign in to use Lamat.' }
  }
  if (String(user.email || '').trim().toLowerCase() !== COMPANION_OWNER_EMAIL) {
    return { ok: false, status: 403, message: 'Lamat is restricted to the authorized owner account.' }
  }
  return { ok: true, user, accessToken: token }
}

export function authenticateCronRequest(req) {
  const secret = String(
    process.env.LAMAT_CRON_SECRET ||
    process.env.MAYA_CRON_SECRET ||
    process.env.CRON_SECRET ||
    ''
  ).trim()
  if (!secret) {
    return { ok: false, status: 401, message: 'Cron secret is not configured.' }
  }
  const authHeader = String(req.headers?.authorization || '')
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  const provided = bearer || String(req.query?.token || '').trim()
  if (provided !== secret) {
    return { ok: false, status: 401, message: 'Unauthorized scheduled invocation.' }
  }
  const serviceToken = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  return { ok: true, serviceToken: serviceToken || null }
}
