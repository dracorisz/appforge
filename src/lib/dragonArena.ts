import { supabase } from '@/lib/supabase'

export type DragonSession = {
  id: string
  title: string | null
  summary: string | null
  turn_count: number
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type DragonTurn = {
  id: number
  session_id: string
  turn_number: number
  player_action: string
  narrative: string
  choices: string[]
  model: string
  created_at: string
}

export type DragonAsset = {
  id: string
  session_id: string | null
  asset_type: string
  title: string | null
  storage_path: string | null
  external_url: string | null
  prompt: string | null
  metadata: Record<string, unknown>
  is_public: boolean
  mint_status: string
  wallet_address: string | null
  token_id: string | null
  metadata_uri: string | null
  created_at: string
}

export type DragonPoints = {
  user_id: string
  points: number
  turns_played: number
  scenes_created: number
  updated_at: string
}

export type LeaderboardRow = {
  user_id: string
  display_name: string | null
  avatar_url: string | null
  points: number
  turns_played: number
  scenes_created: number
}

export type OpeningScenario = {
  id: string
  label: string
  narrative: string
  choices: [string, string, string]
}

export const DRAGON_ARENA_OPENINGS: OpeningScenario[] = [
  {
    id: 'ember-vault',
    label: 'Ember Vault',
    narrative: 'You enter the Ember Vault beneath WildDragons Keep. Three rune-lit passages split ahead while something enormous breathes in the dark.',
    choices: ['Follow the blue runes', 'Call out to the creature', 'Search the vault entrance'],
  },
  {
    id: 'sunken-library',
    label: 'Sunken Library',
    narrative: 'The obsidian library floats on black water; a single lantern drifts toward you, its flame spelling a warning in a language your blood remembers.',
    choices: ['Row toward the lantern', 'Study the floating shelves', 'Sink beneath the surface'],
  },
  {
    id: 'scale-bridge',
    label: 'Scale Bridge',
    narrative: 'Rope bridges sway between the ribs of a petrified dragon; each step groans like the beast remembering waking.',
    choices: ['Cross the central span', 'Test the nearest cable', 'Climb up to the skull'],
  },
  {
    id: 'forgotten-bazaar',
    label: 'Forgotten Bazaar',
    narrative: 'The market is frozen in ash; vendors of bone and bronze wait for a buyer, their wares whispering in the cinders.',
    choices: ['Haggle with the coin-purse crow', 'Examine the glass vials', 'Walk past without looking'],
  },
]

export const DEFAULT_OPENING: OpeningScenario = DRAGON_ARENA_OPENINGS[0]
export const DEFAULT_OPENING_CHOICES: [string, string, string] = DEFAULT_OPENING.choices

export function randomOpening(): OpeningScenario {
  return DRAGON_ARENA_OPENINGS[Math.floor(Math.random() * DRAGON_ARENA_OPENINGS.length)]
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ixqoosixhahrsgwoxyme.supabase.co'

const assetUrl = (path: string | null) =>
  path ? `${SUPABASE_URL}/storage/v1/object/public/dragon-arena-assets/${path}` : null

export async function listSessions(userId: string): Promise<DragonSession[]> {
  const { data, error } = await supabase
    .from('dragon_arena_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data || []) as DragonSession[]
}

export async function createSession(
  userId: string,
  title: string,
  summary: string | null,
  metadata: Record<string, unknown> = {}
): Promise<DragonSession> {
  const { data, error } = await supabase
    .from('dragon_arena_sessions')
    .insert({ user_id: userId, title, summary, turn_count: 0, metadata })
    .select('*')
    .single()
  if (error) throw error
  return data as DragonSession
}

export async function appendTurn(
  sessionId: string,
  turn: Omit<DragonTurn, 'id' | 'session_id' | 'created_at'>
): Promise<void> {
  const { error } = await supabase.from('dragon_arena_turns').insert({
    session_id: sessionId,
    turn_number: turn.turn_number,
    player_action: turn.player_action,
    narrative: turn.narrative,
    choices: turn.choices,
    model: turn.model,
  })
  if (error) throw error
}

export async function updateSessionCount(sessionId: string, count: number): Promise<void> {
  const { error } = await supabase
    .from('dragon_arena_sessions')
    .update({ turn_count: count, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
  if (error) throw error
}

export async function listTurns(sessionId: string): Promise<DragonTurn[]> {
  const { data, error } = await supabase
    .from('dragon_arena_turns')
    .select('*')
    .eq('session_id', sessionId)
    .order('turn_number', { ascending: true })
  if (error) throw error
  return (data || []) as DragonTurn[]
}

export async function listAssets(
  userId: string,
  opts: { sessionId?: string | null; publicOnly?: boolean; assetType?: string } = {}
): Promise<DragonAsset[]> {
  let query = supabase.from('dragon_arena_assets').select('*')
  if (opts.publicOnly) {
    query = query.eq('is_public', true)
  } else {
    query = query.eq('user_id', userId)
  }
  if (opts.sessionId && !opts.publicOnly) {
    query = query.eq('session_id', opts.sessionId)
  }
  if (opts.assetType) {
    query = query.eq('asset_type', opts.assetType)
  }
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data || []) as DragonAsset[]
}

export async function saveAsset(params: {
  userId: string
  sessionId: string | null
  assetType: string
  storagePath: string | null
  externalUrl: string | null
  prompt: string
  title: string | null
  isPublic?: boolean
  metadata?: Record<string, unknown>
}): Promise<DragonAsset> {
  const { data, error } = await supabase
    .from('dragon_arena_assets')
    .insert({
      user_id: params.userId,
      session_id: params.sessionId,
      asset_type: params.assetType,
      storage_path: params.storagePath,
      external_url: params.externalUrl,
      prompt: params.prompt,
      title: params.title,
      is_public: params.isPublic ?? false,
      mint_status: 'not_requested',
      metadata: params.metadata || {},
    })
    .select('*')
    .single()
  if (error) throw error
  return data as DragonAsset
}

export async function updateAsset(
  assetId: string,
  patch: Partial<DragonAsset>
): Promise<DragonAsset> {
  const { data, error } = await supabase
    .from('dragon_arena_assets')
    .update(patch)
    .eq('id', assetId)
    .select('*')
    .single()
  if (error) throw error
  return data as DragonAsset
}

export async function deleteAsset(assetId: string): Promise<void> {
  const { error } = await supabase
    .from('dragon_arena_assets')
    .delete()
    .eq('id', assetId)
  if (error) throw error
}

export async function getPoints(userId: string): Promise<DragonPoints | null> {
  const { data, error } = await supabase
    .from('dragon_arena_points')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return (data || null) as DragonPoints | null
}

export async function awardPoints(
  pointDelta: number,
  turnDelta = 0,
  sceneDelta = 0
): Promise<void> {
  const { error } = await supabase.rpc('award_dragon_arena_points', {
    point_delta: pointDelta,
    turn_delta: turnDelta,
    scene_delta: sceneDelta,
  })
  if (error) throw error
}

export async function leaderboard(limit = 25): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc('dragon_arena_leaderboard', {
    limit_count: limit,
  })
  if (error) throw error
  return (data || []) as LeaderboardRow[]
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('dragon_arena_sessions')
    .delete()
    .eq('id', sessionId)
  if (error) throw error
}

export { assetUrl }

// Scrapper Pro integration helpers
export type ScrapperAssetMeta = {
  source: string
  type: 'image' | 'video' | 'article' | 'post'
  title?: string
  originalUrl: string
  thumbnail?: string
  snippet?: string
}

export async function saveScrapperResult(
  userId: string,
  sessionId: string | null,
  result: ScrapperAssetMeta
): Promise<DragonAsset> {
  return saveAsset({
    userId,
    sessionId,
    assetType: 'scrapper-result',
    storagePath: null,
    externalUrl: result.thumbnail || result.originalUrl,
    prompt: `Saved from ${result.source}: ${result.title || ''}`,
      title: result.title || null,
    isPublic: false,
    metadata: {
      source: result.source,
      type: result.type,
      originalUrl: result.originalUrl,
      thumbnail: result.thumbnail,
      snippet: result.snippet,
      savedAt: new Date().toISOString(),
    },
  })
}

export function getScrapperResultImageUrl(asset: DragonAsset): string | null {
  const meta = asset.metadata as ScrapperAssetMeta | undefined
  if (meta?.thumbnail) return meta.thumbnail
  return asset.external_url
}

export function getScrapperResultLink(asset: DragonAsset): string | null {
  const meta = asset.metadata as ScrapperAssetMeta | undefined
  return meta?.originalUrl || asset.external_url
}