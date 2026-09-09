import type { AppState } from '@/types'
import type { CategoryOverride } from './categories'

export const WORKSPACE_BACKUP_FORMAT = 'appforge-workspace'
export const WORKSPACE_BACKUP_VERSION = 2

type UnknownRecord = Record<string, unknown>
type CategoryOverrides = Record<string, CategoryOverride>

export type WorkspaceBackupEnvelope = {
  format: typeof WORKSPACE_BACKUP_FORMAT
  version: number
  exportedAt: string
  build?: unknown
  profile?: unknown
  workspace: AppState
  categoryOverrides?: CategoryOverrides
}

export type WorkspaceImportPreview = {
  version: number
  exportedAt: string | null
  workspace: AppState
  categoryOverrides: CategoryOverrides
  summary: {
    favorites: number
    recentApps: number
    categoryOverrides: number
    miniApps: number
    sources: number
    outreach: number
    legacy: boolean
  }
}

const isRecord = (value: unknown): value is UnknownRecord => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const stringArray = (value: unknown, fallback: string[]) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : fallback
const objectArray = <T>(value: unknown, fallback: T[]) => Array.isArray(value) ? value as T[] : fallback

const theme = (value: unknown, fallback: AppState['settings']['theme']) => value === 'light' || value === 'dark' || value === 'system' ? value : fallback

export const mergeWorkspaceState = (incoming: unknown, current: AppState): AppState => {
  if (!isRecord(incoming)) throw new Error('Backup workspace is missing or invalid.')
  const settings = isRecord(incoming.settings) ? incoming.settings : {}
  const article = isRecord(incoming.article) ? incoming.article as Partial<AppState['article']> : {}

  return {
    plan: objectArray(incoming.plan, current.plan),
    article: { ...current.article, ...article },
    pitches: objectArray(incoming.pitches, current.pitches),
    sources: objectArray(incoming.sources, current.sources),
    outreach: objectArray(incoming.outreach, current.outreach),
    checklist: objectArray(incoming.checklist, current.checklist),
    documentReadiness: objectArray(incoming.documentReadiness, current.documentReadiness),
    messages: objectArray(incoming.messages, current.messages),
    settings: { ...current.settings, ...settings, theme: theme(settings.theme, current.settings.theme) },
    miniApps: objectArray(incoming.miniApps, current.miniApps),
    versions: objectArray(incoming.versions, current.versions),
    favorites: stringArray(incoming.favorites, current.favorites),
    recentApps: stringArray(incoming.recentApps, current.recentApps).slice(0, 20),
  }
}

const normalizeCategoryOverride = (value: unknown): CategoryOverride | null => {
  if (!isRecord(value)) return null
  const override: CategoryOverride = {}
  if (typeof value.name === 'string') override.name = value.name
  if (typeof value.description === 'string') override.description = value.description
  if (typeof value.icon === 'string') override.icon = value.icon
  if (typeof value.visibleInSidebar === 'boolean') override.visibleInSidebar = value.visibleInSidebar
  return override
}

const normalizeCategoryOverrides = (value: unknown): CategoryOverrides => {
  if (!isRecord(value)) return {}
  return Object.fromEntries(
    Object.entries(value)
      .map(([id, raw]) => [id, normalizeCategoryOverride(raw)] as const)
      .filter((entry): entry is [string, CategoryOverride] => entry[1] !== null),
  )
}

export const createWorkspaceBackup = (params: {
  workspace: AppState
  exportedAt: string
  build?: unknown
  profile?: unknown
  categoryOverrides?: CategoryOverrides
}): WorkspaceBackupEnvelope => ({
  format: WORKSPACE_BACKUP_FORMAT,
  version: WORKSPACE_BACKUP_VERSION,
  exportedAt: params.exportedAt,
  build: params.build,
  profile: params.profile,
  workspace: params.workspace,
  categoryOverrides: params.categoryOverrides || {},
})

export const parseWorkspaceBackup = (text: string, current: AppState): WorkspaceImportPreview => {
  const parsed: unknown = JSON.parse(text)
  if (!isRecord(parsed)) throw new Error('Backup must contain a JSON object.')

  const isEnvelope = parsed.format === WORKSPACE_BACKUP_FORMAT || 'workspace' in parsed
  const version = typeof parsed.version === 'number' ? parsed.version : 1
  if (version > WORKSPACE_BACKUP_VERSION) throw new Error(`This backup uses version ${version}, but this AppForge build supports up to version ${WORKSPACE_BACKUP_VERSION}.`)

  const rawWorkspace = isEnvelope ? parsed.workspace : parsed
  const workspace = mergeWorkspaceState(rawWorkspace, current)
  const categoryOverrides = normalizeCategoryOverrides(isEnvelope ? parsed.categoryOverrides : undefined)
  const exportedAt = typeof parsed.exportedAt === 'string' ? parsed.exportedAt : null

  return {
    version,
    exportedAt,
    workspace,
    categoryOverrides,
    summary: {
      favorites: workspace.favorites.length,
      recentApps: workspace.recentApps.length,
      categoryOverrides: Object.keys(categoryOverrides).length,
      miniApps: workspace.miniApps.length,
      sources: workspace.sources.length,
      outreach: workspace.outreach.length,
      legacy: parsed.format !== WORKSPACE_BACKUP_FORMAT,
    },
  }
}
