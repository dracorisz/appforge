import { supabase, SUPABASE_PUBLISHABLE_KEY } from '@/lib/supabase'

export type VaultMedia = {
  id: string
  user_id: string
  kind: 'image' | 'video' | 'document' | 'audio' | 'other'
  storage_path: string
  file_name: string | null
  mime_type: string | null
  size_bytes: number
  width: number | null
  height: number | null
  duration_seconds: number | null
  title: string | null
  description: string | null
  is_public: boolean
  metadata: Record<string, unknown>
  created_at: string
  source_bucket?: 'user-media-vault' | 'dragon-arena-assets' | 'external'
  external_url?: string | null
}

export type VaultQuota = {
  quota_bytes: number
  used_bytes: number
  remaining_bytes: number
}

export type VaultFolder = 'general' | 'dragon-arena' | 'scrapper-pro' | string

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ixqoosixhahrsgwoxyme.supabase.co'

export const vaultPublicUrl = (path: string | null) =>
  path ? `${SUPABASE_URL}/storage/v1/object/public/user-media-vault/${path}` : null

export const vaultSignedUrl = async (path: string, expires = 3600, bucket = 'user-media-vault') => {
  if (!path) return null
  if (bucket === 'dragon-arena-assets') return `${SUPABASE_URL}/storage/v1/object/public/dragon-arena-assets/${path}`
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expires)
  if (error) throw error
  return data?.signedUrl || null
}

export const vaultItemUrl = async (item: VaultMedia, expires = 3600) => {
  if (item.source_bucket === 'external') return item.external_url || null
  if (item.source_bucket === 'dragon-arena-assets') {
    return item.storage_path ? `${SUPABASE_URL}/storage/v1/object/public/dragon-arena-assets/${item.storage_path}` : item.external_url || null
  }
  return vaultSignedUrl(item.storage_path, expires, 'user-media-vault')
}

export const vaultFolder = (item: Pick<VaultMedia, 'metadata'>): string => {
  const value = item.metadata?.folder
  return typeof value === 'string' && value.trim() ? value.trim() : 'general'
}

const inferDragonKind = (assetType: string, metadata: Record<string, unknown>): VaultMedia['kind'] => {
  if (assetType === 'scene' || assetType === 'image') return 'image'
  const type = typeof metadata?.type === 'string' ? metadata.type : ''
  if (type === 'video') return 'video'
  if (type === 'image') return 'image'
  if (type === 'article' || type === 'post') return 'document'
  return 'other'
}

const mapDragonAsset = (asset: Record<string, any>): VaultMedia => {
  const metadata = (asset.metadata || {}) as Record<string, unknown>
  const isScrapper = asset.asset_type === 'scrapper-result'
  const storagePath = typeof asset.storage_path === 'string' ? asset.storage_path : ''
  const fileName = storagePath ? storagePath.split('/').pop() || null : null
  const externalUrl = typeof asset.external_url === 'string' ? asset.external_url : null
  return {
    id: String(asset.id),
    user_id: String(asset.user_id),
    kind: inferDragonKind(String(asset.asset_type || ''), metadata),
    storage_path: storagePath,
    file_name: fileName,
    mime_type: typeof asset.mime_type === 'string' ? asset.mime_type : typeof metadata.mime_type === 'string' ? String(metadata.mime_type) : null,
    size_bytes: Number(metadata.size_bytes || 0),
    width: null,
    height: null,
    duration_seconds: null,
    title: typeof asset.title === 'string' ? asset.title : null,
    description: typeof asset.prompt === 'string' ? asset.prompt : null,
    is_public: Boolean(asset.is_public),
    metadata: {
      ...metadata,
      folder: isScrapper ? 'scrapper-pro' : 'dragon-arena',
      source_table: 'dragon_arena_assets',
      source_asset_type: asset.asset_type,
    },
    created_at: String(asset.created_at),
    source_bucket: storagePath ? 'dragon-arena-assets' : 'external',
    external_url: externalUrl,
  }
}

export async function listVaultMedia(kind?: VaultMedia['kind'], folder?: VaultFolder): Promise<VaultMedia[]> {
  const includeVault = !folder || folder === 'all' || folder === 'general' || (folder !== 'dragon-arena' && folder !== 'scrapper-pro')
  const includeDragon = !folder || folder === 'all' || folder === 'dragon-arena'
  const includeScrapper = !folder || folder === 'all' || folder === 'scrapper-pro'
  const items: VaultMedia[] = []

  if (includeVault || folder === 'dragon-arena' || folder === 'scrapper-pro') {
    let query = supabase.from('user_media_vault').select('*').order('created_at', { ascending: false }).limit(200)
    if (kind) query = query.eq('kind', kind)
    if (folder && folder !== 'all') query = query.contains('metadata', { folder })
    const { data, error } = await query
    if (error) throw error
    items.push(...((data || []) as VaultMedia[]).map((item) => ({ ...item, source_bucket: 'user-media-vault' as const })))
  }

  if (includeDragon || includeScrapper) {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (uid) {
      let query = supabase.from('dragon_arena_assets').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(200)
      if (folder === 'dragon-arena') query = query.eq('asset_type', 'scene')
      else if (folder === 'scrapper-pro') query = query.eq('asset_type', 'scrapper-result')
      else query = query.in('asset_type', ['scene', 'scrapper-result'])
      const { data, error } = await query
      if (error) throw error
      const linked = (data || []).map((asset) => mapDragonAsset(asset as Record<string, any>))
      items.push(...(kind ? linked.filter((item) => item.kind === kind) : linked))
    }
  }

  return items.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 300)
}

export async function getVaultQuota(): Promise<VaultQuota> {
  const [quota, usage] = await Promise.all([
    supabase.rpc('get_or_create_user_quota'),
    supabase.rpc('user_media_usage_bytes'),
  ])
  if (quota.error) throw quota.error
  if (usage.error) throw usage.error
  const used = Number(usage.data?.[0]?.used_bytes || 0)
  const total = Number(quota.data || 0)
  return { quota_bytes: total, used_bytes: used, remaining_bytes: Math.max(0, total - used) }
}

export async function requestUploadUrl(params: {
  kind: VaultMedia['kind']
  fileName: string
  mimeType: string
  sizeBytes: number
}): Promise<{ path: string; uploadUrl: string; remaining: number; token: string }> {
  const { data: session } = await supabase.auth.getSession()
  const token = session.session?.access_token
  if (!token) throw new Error('Sign in to upload media.')

  const response = await fetch('/api/user-media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ kind: params.kind, fileName: params.fileName, mimeType: params.mimeType, sizeBytes: params.sizeBytes }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'Could not prepare upload.')
  return payload as { path: string; uploadUrl: string; remaining: number; token: string }
}

export async function confirmVaultUpload(params: {
  path: string
  kind: VaultMedia['kind']
  fileName: string
  mimeType: string
  sizeBytes: number
  title?: string
  description?: string
  isPublic?: boolean
  metadata?: Record<string, unknown>
}): Promise<VaultMedia> {
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) throw new Error('Sign in to save media metadata.')

  const { data, error } = await supabase
    .from('user_media_vault')
    .insert({
      user_id: userId,
      storage_path: params.path,
      kind: params.kind,
      file_name: params.fileName,
      mime_type: params.mimeType,
      size_bytes: params.sizeBytes,
      title: params.title || null,
      description: params.description || null,
      is_public: params.isPublic ?? false,
      metadata: params.metadata || { folder: 'general' },
    })
    .select('*')
    .single()
  if (error) throw error
  return { ...(data as VaultMedia), source_bucket: 'user-media-vault' }
}

export async function updateVaultMedia(id: string, patch: Partial<VaultMedia>): Promise<VaultMedia> {
  const { data, error } = await supabase.from('user_media_vault').update(patch).eq('id', id).select('*').single()
  if (error) throw error
  return { ...(data as VaultMedia), source_bucket: 'user-media-vault' }
}

export async function deleteVaultMedia(itemOrId: VaultMedia | string): Promise<void> {
  if (typeof itemOrId !== 'string' && itemOrId.metadata?.source_table === 'dragon_arena_assets') {
    const item = itemOrId
    const { error } = await supabase.from('dragon_arena_assets').delete().eq('id', item.id)
    if (error) throw error
    if (item.storage_path) await supabase.storage.from('dragon-arena-assets').remove([item.storage_path]).catch(() => undefined)
    return
  }

  const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id
  const { data: row, error: fetchError } = await supabase.from('user_media_vault').select('storage_path').eq('id', id).maybeSingle()
  if (fetchError) throw fetchError
  const { error } = await supabase.from('user_media_vault').delete().eq('id', id)
  if (error) throw error
  if (row?.storage_path) await supabase.storage.from('user-media-vault').remove([row.storage_path]).catch(() => undefined)
}

const inferKind = (file: File): VaultMedia['kind'] => {
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('audio/')) return 'audio'
  if (file.type === 'application/pdf' || file.type.startsWith('text/') || /\.(txt|md|json|pdf)$/i.test(file.name)) return 'document'
  return 'other'
}

type UploadOptions = {
  kind?: VaultMedia['kind']
  title?: string
  description?: string
  isPublic?: boolean
  folder?: VaultFolder
  metadata?: Record<string, unknown>
}

const uploadMetadata = (opts: UploadOptions) => ({
  ...(opts.metadata || {}),
  folder: opts.folder || (typeof opts.metadata?.folder === 'string' ? opts.metadata.folder : 'general'),
})

export async function uploadVaultMedia(file: File, opts: UploadOptions = {}): Promise<VaultMedia> {
  const kind = opts.kind || inferKind(file)
  if (file.size > 104857600) throw new Error('Files over 100 MB are not allowed.')
  const prepared = await requestUploadUrl({ kind, fileName: file.name, mimeType: file.type || 'application/octet-stream', sizeBytes: file.size })

  const upload = await fetch(prepared.uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'false', apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${prepared.token}` },
    body: file,
  })
  if (!upload.ok) {
    const text = await upload.text().catch(() => '')
    throw new Error(`Upload failed: ${upload.status} ${text.slice(0, 160)}`)
  }

  try {
    return await confirmVaultUpload({
      path: prepared.path,
      kind,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      title: opts.title,
      description: opts.description,
      isPublic: opts.isPublic,
      metadata: uploadMetadata(opts),
    })
  } catch (error) {
    await supabase.storage.from('user-media-vault').remove([prepared.path]).catch(() => undefined)
    throw error
  }
}

export async function uploadVaultMediaWithProgress(file: File, opts: UploadOptions & { onProgress?: (progress: number) => void } = {}): Promise<VaultMedia> {
  const kind = opts.kind || inferKind(file)
  if (file.size > 104857600) throw new Error('Files over 100 MB are not allowed.')
  const prepared = await requestUploadUrl({ kind, fileName: file.name, mimeType: file.type || 'application/octet-stream', sizeBytes: file.size })

  const xhr = new XMLHttpRequest()
  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && opts.onProgress) opts.onProgress(Math.round((event.loaded / event.total) * 100))
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        confirmVaultUpload({
          path: prepared.path,
          kind,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          title: opts.title,
          description: opts.description,
          isPublic: opts.isPublic,
          metadata: uploadMetadata(opts),
        }).then(resolve).catch(async (error) => {
          await supabase.storage.from('user-media-vault').remove([prepared.path]).catch(() => undefined)
          reject(error)
        })
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${String(xhr.responseText || '').slice(0, 160)}`))
      }
    })
    xhr.addEventListener('error', () => reject(new Error('Upload failed due to network error')))
    xhr.open('POST', prepared.uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.setRequestHeader('apikey', SUPABASE_PUBLISHABLE_KEY)
    xhr.setRequestHeader('Authorization', `Bearer ${prepared.token}`)
    xhr.send(file)
  })
}
