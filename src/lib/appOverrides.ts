import { supabase } from './supabase'
import { applyAppOverrides, type AppDefinition, type AppOverride } from './registry'

const COLUMNS = 'app_id,name,description,category,status,icon,cover_image,tags,visible'

export async function loadAppOverrides(): Promise<AppOverride[]> {
  const { data, error } = await supabase.from('app_overrides').select(COLUMNS).order('app_id')
  if (error) throw error
  const rows = (data || []) as AppOverride[]
  applyAppOverrides(rows)
  return rows
}

export async function saveAppOverride(app: AppDefinition): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in again to update app properties.')
  const { error } = await supabase.from('app_overrides').upsert({
    app_id: app.id,
    name: app.name,
    description: app.description,
    category: app.category,
    status: app.status,
    icon: app.icon,
    cover_image: app.coverImage || null,
    tags: app.tags,
    visible: app.visible !== false,
    updated_by: auth.user.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'app_id' })
  if (error) throw error
  await loadAppOverrides()
  window.dispatchEvent(new Event('appforge:app-overrides-updated'))
}
