import type { AppState } from '@/types'
import type { CategoryOverride } from './categories'
import { supabase } from './supabase'

export interface RemotePreferences {
  appState: Partial<AppState> | null
  categoryOverrides: Record<string, CategoryOverride>
  preferences: Record<string, unknown>
}

export async function loadUserPreferences(userId: string): Promise<RemotePreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('app_state, category_overrides, preferences')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    appState: data.app_state && typeof data.app_state === 'object' ? data.app_state as Partial<AppState> : null,
    categoryOverrides: data.category_overrides && typeof data.category_overrides === 'object'
      ? data.category_overrides as Record<string, CategoryOverride>
      : {},
    preferences: data.preferences && typeof data.preferences === 'object'
      ? data.preferences as Record<string, unknown>
      : {},
  }
}

export async function saveUserPreferences(
  userId: string,
  payload: {
    appState?: Partial<AppState>
    categoryOverrides?: Record<string, CategoryOverride>
    preferences?: Record<string, unknown>
  },
) {
  const row: Record<string, unknown> = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  }

  if (payload.appState !== undefined) row.app_state = payload.appState
  if (payload.categoryOverrides !== undefined) row.category_overrides = payload.categoryOverrides
  if (payload.preferences !== undefined) row.preferences = payload.preferences

  const { error } = await supabase
    .from('user_preferences')
    .upsert(row, { onConflict: 'user_id' })

  if (error) throw error
}
