import { supabase } from './supabase'

export type FrontendContentType = 'blog_article' | 'video_teaser' | 'gallery_image'

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

export async function loadPublishedFrontendContent(contentType?: FrontendContentType) {
  let query = supabase
    .from('frontend_content')
    .select(CONTENT_COLUMNS)
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false })

  if (contentType) query = query.eq('content_type', contentType)

  const { data, error } = await query
  if (error) throw error
  return (data || []) as FrontendContentRecord[]
}

export async function loadAllFrontendContent() {
  const { data, error } = await supabase
    .from('frontend_content')
    .select(CONTENT_COLUMNS)
    .order('content_type', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data || []) as FrontendContentRecord[]
}

export async function createFrontendContent(draft: FrontendContentDraft, userId: string) {
  const { data, error } = await supabase
    .from('frontend_content')
    .insert({ ...draft, created_by: userId })
    .select(CONTENT_COLUMNS)
    .single()

  if (error) throw error
  return data as FrontendContentRecord
}

export async function updateFrontendContent(id: string, patch: Partial<FrontendContentDraft>) {
  const { data, error } = await supabase
    .from('frontend_content')
    .update(patch)
    .eq('id', id)
    .select(CONTENT_COLUMNS)
    .single()

  if (error) throw error
  return data as FrontendContentRecord
}

export async function deleteFrontendContent(id: string) {
  const { error } = await supabase.from('frontend_content').delete().eq('id', id)
  if (error) throw error
}
