import { generateHfImage, orderedHfTokens, parsePersonalHfTokens, publicHfAttempts } from './_hf-image-provider.js'

export { parsePersonalHfTokens }

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ixqoosixhahrsgwoxyme.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
const GENERATION_BUDGET_MS = 52_000
const STORY_IMAGE_SUFFIX = 'Cinematic dark-fantasy story scene, coherent character identity and wardrobe, atmospheric depth, dramatic volumetric lighting, detailed environment, strong composition, no words, logos, UI, watermark, captions, or text.'

const supabaseRequest = (path, token, init = {}) => fetch(`${SUPABASE_URL}${path}`, {
  ...init,
  headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
})
const getBearer = (req) => { const value = req.headers?.authorization || ''; return value.startsWith('Bearer ') ? value.slice(7).trim() : '' }
const authenticate = async (token) => { if (!token) return null; const response = await supabaseRequest('/auth/v1/user', token); return response.ok ? response.json().catch(() => null) : null }
const verifySession = async (token, userId, sessionId) => {
  const response = await supabaseRequest(`/rest/v1/dragon_arena_sessions?id=eq.${encodeURIComponent(sessionId)}&user_id=eq.${encodeURIComponent(userId)}&select=id`, token)
  if (!response.ok) return false
  const rows = await response.json().catch(() => [])
  return Array.isArray(rows) && rows.length === 1
}

const saveImage = async (token, userId, bytes, mimeType) => {
  const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/webp' ? 'webp' : 'png'
  const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`
  const upload = await supabaseRequest(`/storage/v1/object/dragon-arena-assets/${storagePath}`, token, { method: 'POST', headers: { 'Content-Type': mimeType || 'image/png', 'x-upsert': 'false' }, body: bytes })
  if (!upload.ok) { const detail = await upload.text().catch(() => ''); throw new Error(`image_storage_upload_failed: ${detail.slice(0, 160)}`) }
  return { storagePath, publicUrl: `${SUPABASE_URL}/storage/v1/object/public/dragon-arena-assets/${storagePath}` }
}
const removeStoredImage = async (token, storagePath) => { if (storagePath) await supabaseRequest(`/storage/v1/object/dragon-arena-assets/${storagePath}`, token, { method: 'DELETE' }).catch(() => undefined) }

const persistAsset = async ({ token, userId, sessionId, prompt, generated, saved, generatedAt, turnNumber, usingPersonalKey }) => {
  const response = await supabaseRequest('/rest/v1/dragon_arena_assets?select=id,title,storage_path,is_public,metadata,created_at', token, {
    method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({
      session_id: sessionId, user_id: userId, asset_type: 'scene', storage_path: saved.storagePath, external_url: saved.publicUrl,
      mime_type: generated.mimeType, prompt: prompt.trim().slice(0, 4000), title: `Scene turn ${Math.max(1, Number(turnNumber) || 1)}`,
      is_public: false, mint_status: 'not_requested', metadata: { model: generated.model, provider: `huggingface:${generated.provider}`, provider_model: generated.providerModel, generated_at: generatedAt, size_bytes: generated.buffer.length, mime_type: generated.mimeType, personal_hf_token: usingPersonalKey, turn_number: Math.max(1, Number(turnNumber) || 1) },
    }),
  })
  const rows = await response.json().catch(() => [])
  if (!response.ok || !Array.isArray(rows) || !rows[0]?.id) throw new Error('asset_ledger_failed')
  return rows[0]
}

export default async function handler(req, res) {
  const startedAt = Date.now()
  const requestId = crypto.randomUUID()
  res.setHeader('x-appforge-request-id', requestId)
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed.', requestId }) }

  const token = getBearer(req)
  const user = await authenticate(token)
  if (!user?.id) return res.status(401).json({ error: 'Sign in to generate Story Studio scenes.', requestId })

  const personalHfTokens = parsePersonalHfTokens(req.headers)
  const hfTokens = orderedHfTokens(personalHfTokens)
  const usingPersonalKey = personalHfTokens.length > 0
  if (!hfTokens.length) return res.status(503).json({ error: 'Scene generation is offline until a Hugging Face token is configured.', requestId })

  const { prompt, sessionId, turnNumber } = req.body || {}
  if (typeof prompt !== 'string' || prompt.trim().length < 8) return res.status(400).json({ error: 'Describe the scene to generate.', requestId })
  if (typeof sessionId !== 'string' || !sessionId.trim()) return res.status(400).json({ error: 'A Story Studio session is required.', requestId })
  if (!await verifySession(token, user.id, sessionId.trim())) return res.status(403).json({ error: 'This Story Studio session is not available to the signed-in user.', requestId })

  let saved = null
  try {
    let generated
    try {
      generated = await generateHfImage({ prompt, tokens: hfTokens, promptSuffix: STORY_IMAGE_SUFFIX, budgetMs: GENERATION_BUDGET_MS })
    } catch (hfError) {
      const attempts = publicHfAttempts(hfError?.attempts || [])
      console.error('Story Studio Hugging Face provider rotation exhausted', { requestId, code: hfError?.message, attempts })
      return res.status(502).json({ error: 'Hugging Face image providers could not render this scene right now. Try again shortly or use a personal HF token with Inference Providers access.', provider: 'huggingface-inference-providers', requestId, durationMs: Date.now() - startedAt, attempts })
    }

    const generatedAt = new Date().toISOString()
    saved = await saveImage(token, user.id, generated.buffer, generated.mimeType)
    let asset
    try {
      asset = await persistAsset({ token, userId: user.id, sessionId: sessionId.trim(), prompt, generated, saved, generatedAt, turnNumber, usingPersonalKey })
    } catch (ledgerError) {
      await removeStoredImage(token, saved.storagePath)
      console.error('Story Studio scene asset ledger failed', { requestId, ledgerError })
      return res.status(502).json({ error: 'The scene was generated but could not be saved safely.', requestId, durationMs: Date.now() - startedAt })
    }

    return res.status(200).json({ imageUrl: saved.publicUrl, storagePath: saved.storagePath, model: generated.model, sessionId, assetId: asset.id, isPublic: Boolean(asset.is_public), generatedAt: asset.created_at || generatedAt, metadata: asset.metadata || {}, personalKeyUsed: usingPersonalKey, provider: `huggingface:${generated.provider}`, requestId, durationMs: Date.now() - startedAt })
  } catch (error) {
    if (saved?.storagePath) await removeStoredImage(token, saved.storagePath)
    console.error('Story Studio image request failed', { requestId, error })
    return res.status(502).json({ error: 'Could not reach the Story Studio scene generator.', requestId, durationMs: Date.now() - startedAt })
  }
}
