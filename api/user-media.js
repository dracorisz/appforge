const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ixqoosixhahrsgwoxyme.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_b56EltHyMfwOQjVQcQFHwA_VUiSn9zN'
const MAX_FILE_BYTES = 104857600

const getBearer = (req) => {
  const value = req.headers?.authorization || ''
  return value.startsWith('Bearer ') ? value.slice(7).trim() : ''
}

const supabaseRequest = (path, token, init = {}) => fetch(`${SUPABASE_URL}${path}`, {
  ...init,
  headers: {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(init.headers || {}),
  },
})

const authenticate = async (token) => {
  if (!token) return null
  const response = await supabaseRequest('/auth/v1/user', token)
  return response.ok ? response.json().catch(() => null) : null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const token = getBearer(req)
  const user = await authenticate(token)
  if (!user?.id) return res.status(401).json({ error: 'Sign in to upload media.' })

  const { kind, fileName, mimeType, sizeBytes } = req.body || {}
  if (typeof kind !== 'string' || !['image', 'video', 'document', 'audio', 'other'].includes(kind)) {
    return res.status(400).json({ error: 'Choose a supported media kind.' })
  }
  const size = Number(sizeBytes)
  if (!Number.isFinite(size) || size <= 0) return res.status(400).json({ error: 'File size is required.' })
  if (size > MAX_FILE_BYTES) return res.status(413).json({ error: 'Files over 100 MB are not allowed.' })

  const rpc = await supabaseRequest('/rest/v1/rpc/create_user_media_upload_url', token, {
    method: 'POST',
    body: JSON.stringify({ kind, file_name: String(fileName || 'media'), mime_type: String(mimeType || 'application/octet-stream'), size_bytes: size }),
  })
  const data = await rpc.json().catch(() => null)
  if (!rpc.ok || !data?.allowed) {
    return res.status(rpc.ok ? 400 : 502).json({ error: data?.error || 'Could not prepare upload.' })
  }

  return res.status(200).json({
    bucket: 'user-media-vault',
    path: data.path,
    uploadUrl: `${SUPABASE_URL}/storage/v1/object/user-media-vault/${data.path}`,
    remaining: data.remaining,
    token,
  })
}