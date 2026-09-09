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

export const vaultSignedUrl = async (path: string, expires = 3600) => {
  const { data, error } = await supabase.storage.from('user-media-vault').createSignedUrl(path, expires)
  if (error) throw error
  return data?.signedUrl || null
}

export const vaultFolder = (item: Pick<VaultMedia, 'metadata'>): string => {
  const value = item.metadata?.folder
  return typeof value === 'string' && value.trim() ? value.trim() : 'general'
}

export async function listVaultMedia(kind?: VaultMedia['kind'], folder?: VaultFolder): Promise<VaultMedia[]> {
  let query = supabase.from('user_media_vault').select('*').order('created_at', { ascending: false }).limit(200)
  if (kind) query = query.eq('kind', kind)
  if (folder && folder !== 'all') query = query.contains('metadata', { folder })
  const { data, error } = await query
  if (error) throw error
  return (data || []) as VaultMedia[]
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
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      kind: params.kind,
      fileName: params.fileName,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
    }),
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
  return data as VaultMedia
}

export async function updateVaultMedia(id: string, patch: Partial<VaultMedia>): Promise<VaultMedia> {
  const { data, error } = await supabase.from('user_media_vault').update(patch).eq('id', id).select('*').single()
  if (error) throw error
  return data as VaultMedia
}

export async function deleteVaultMedia(id: string): Promise<void> {
  const { data: row, error: fetchError } = await supabase.from('user_media_vault').select('storage_path').eq('id', id).maybeSingle()
  if (fetchError) throw fetchError
  const { error } = await supabase.from('user_media_vault').delete().eq('id', id)
  if (error) throw error
  if (row?.storage_path) {
    await supabase.storage.from('user-media-vault').remove([row.storage_path]).catch(() => undefined)
  }
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
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'false',
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${prepared.token}`,
    },
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

export async function uploadVaultMediaWithProgress(file: File, opts: UploadOptions & {
  onProgress?: (progress: number) => void
} = {}): Promise<VaultMedia> {
  const kind = opts.kind || inferKind(file)
  if (file.size > 104857600) throw new Error('Files over 100 MB are not allowed.')
  const prepared = await requestUploadUrl({ kind, fileName: file.name, mimeType: file.type || 'application/octet-stream', sizeBytes: file.size })

  const xhr = new XMLHttpRequest()
  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && opts.onProgress) {
        opts.onProgress(Math.round((event.loaded / event.total) * 100))
      }
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
