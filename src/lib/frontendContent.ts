import { supabase } from './supabase'

export type FrontendContentType = 'blog_article' | 'video_teaser' | 'gallery_image' | 'docs_page'

export type FrontendContentRecord = {
  id: string
  content_type: FrontendContentType
  slug: string
  title: string
  summary: string | null
  body: string | null
  image_url: string | null
  video_url: string | null
  app_route: string | null
  published: boolean
  sort_order: number
  metadata: Record<string, unknown>
  created_by: string | null
  created_at: string
  updated_at: string
}

export type FrontendContentDraft = Omit<FrontendContentRecord, 'id' | 'created_at' | 'updated_at' | 'created_by'>

const CONTENT_COLUMNS = 'id,content_type,slug,title,summary,body,image_url,video_url,app_route,published,sort_order,metadata,created_by,created_at,updated_at'
const CONTENT_MEDIA_BUCKET = 'frontend-content'

export async function loadPublishedFrontendContent(contentType?: FrontendContentType) {
  let query = supabase.from('frontend_content').select(CONTENT_COLUMNS).eq('published', true).order('sort_order', { ascending: true }).order('updated_at', { ascending: false })
  if (contentType) query = query.eq('content_type', contentType)
  const { data, error } = await query
  if (error) throw error
  return (data || []) as FrontendContentRecord[]
}

export async function loadAllFrontendContent() {
  const { data, error } = await supabase.from('frontend_content').select(CONTENT_COLUMNS).order('content_type', { ascending: true }).order('sort_order', { ascending: true }).order('updated_at', { ascending: false })
  if (error) throw error
  return (data || []) as FrontendContentRecord[]
}

export async function createFrontendContent(draft: FrontendContentDraft, userId: string) {
  const { data, error } = await supabase.from('frontend_content').insert({ ...draft, created_by: userId }).select(CONTENT_COLUMNS).single()
  if (error) throw error
  return data as FrontendContentRecord
}

export async function updateFrontendContent(id: string, patch: Partial<FrontendContentDraft>) {
  const { data, error } = await supabase.from('frontend_content').update(patch).eq('id', id).select(CONTENT_COLUMNS).single()
  if (error) throw error
  return data as FrontendContentRecord
}

export async function deleteFrontendContent(id: string) {
  const { error } = await supabase.from('frontend_content').delete().eq('id', id)
  if (error) throw error
}

const safeFileName = (name: string) => name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'media'

export async function uploadFrontendContentMedia(file: File, userId: string) {
  const kind = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : ''
  if (!kind) throw new Error('Choose an image or video file.')
  if (file.size > 50 * 1024 * 1024) throw new Error('Frontend media uploads are limited to 50 MiB.')
  const objectPath = `${userId}/${kind}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeFileName(file.name)}`
  const { error } = await supabase.storage.from(CONTENT_MEDIA_BUCKET).upload(objectPath, file, { cacheControl: '3600', upsert: false, contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from(CONTENT_MEDIA_BUCKET).getPublicUrl(objectPath)
  if (!data.publicUrl) throw new Error('Upload completed but no public media URL was returned.')
  return { url: data.publicUrl, path: objectPath, kind: kind as 'image' | 'video' }
}
