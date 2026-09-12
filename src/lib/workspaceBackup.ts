import type { AppState } from '@/types'
import type { CategoryOverride } from './categories'

export const WORKSPACE_BACKUP_FORMAT = 'appforge-workspace'
export const WORKSPACE_BACKUP_VERSION = 3

const MAX_COLLECTION_ITEMS = 5_000
const MAX_CATEGORY_OVERRIDES = 500

type UnknownRecord = Record<string, unknown>
type CategoryOverrides = Record<string, CategoryOverride>

export type WorkspaceBackupEnvelope = {
  format: typeof WORKSPACE_BACKUP_FORMAT
  version: number
  exportedAt: string
  accountId?: string
  workspace: Pick<AppState, 'settings' | 'favorites' | 'recentApps'>
  categoryOverrides?: CategoryOverrides
  widgets?: Record<string, boolean>
}

export type WorkspaceImportPreview = {
  version: number
  exportedAt: string | null
  workspace: AppState
  categoryOverrides: CategoryOverrides
  widgets: Record<string, boolean>
  summary: {
    favorites: number
    recentApps: number
    categoryOverrides: number
    widgets: number
    legacy: boolean
  }
}

const isRecord = (value: unknown): value is UnknownRecord => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const stringArray = (value: unknown, fallback: string[], max = MAX_COLLECTION_ITEMS) => Array.isArray(value)
  ? [...new Set(value.filter((item): item is string => typeof item === 'string').map((item) => item.slice(0, 240)))].slice(0, max)
  : fallback
const recordArray = <T>(value: unknown, fallback: T[], max = MAX_COLLECTION_ITEMS) => Array.isArray(value)
  ? value.filter((item) => isRecord(item) && typeof item.id === 'string' && item.id.length > 0).slice(0, max) as T[]
  : fallback
const stringField = (value: unknown, fallback: string, max: number) => typeof value === 'string' ? value.slice(0, max) : fallback
const theme = (value: unknown, fallback: AppState['settings']['theme']) => value === 'light' || value === 'dark' || value === 'system' ? value : fallback

export const mergeWorkspaceState = (incoming: unknown, current: AppState): AppState => {
  if (!isRecord(incoming)) throw new Error('Backup workspace is missing or invalid.')
  const settings = isRecord(incoming.settings) ? incoming.settings : {}
  const article = isRecord(incoming.article) ? incoming.article : {}

  return {
    plan: recordArray(incoming.plan, current.plan),
    article: {
      title: stringField(article.title, current.article.title, 500),
      body: stringField(article.body, current.article.body, 1_000_000),
      lastModified: stringField(article.lastModified, current.article.lastModified, 100),
      warning: stringField(article.warning, current.article.warning, 2_000),
    },
    pitches: recordArray(incoming.pitches, current.pitches),
    sources: recordArray(incoming.sources, current.sources),
    outreach: recordArray(incoming.outreach, current.outreach),
    checklist: recordArray(incoming.checklist, current.checklist),
    documentReadiness: recordArray(incoming.documentReadiness, current.documentReadiness),
    messages: recordArray(incoming.messages, current.messages),
    settings: { theme: theme(settings.theme, current.settings.theme) },
    miniApps: recordArray(incoming.miniApps, current.miniApps),
    versions: recordArray(incoming.versions, current.versions),
    favorites: stringArray(incoming.favorites, current.favorites, 1_000),
    recentApps: stringArray(incoming.recentApps, current.recentApps, 20),
  }
}

const normalizeCategoryOverride = (value: unknown): CategoryOverride | null => {
  if (!isRecord(value)) return null
  const override: CategoryOverride = {}
  if (typeof value.name === 'string') override.name = value.name.slice(0, 120)
  if (typeof value.description === 'string') override.description = value.description.slice(0, 500)
  if (typeof value.icon === 'string') override.icon = value.icon.slice(0, 80)
  if (typeof value.visibleInSidebar === 'boolean') override.visibleInSidebar = value.visibleInSidebar
  return override
}

const normalizeCategoryOverrides = (value: unknown): CategoryOverrides => {
  if (!isRecord(value)) return {}
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, MAX_CATEGORY_OVERRIDES)
      .filter(([id]) => id.length > 0 && id.length <= 120)
      .map(([id, raw]) => [id, normalizeCategoryOverride(raw)] as const)
      .filter((entry): entry is [string, CategoryOverride] => entry[1] !== null),
  )
}

export const createWorkspaceBackup = (params: {
  workspace: AppState
  exportedAt: string
  categoryOverrides?: CategoryOverrides
  accountId?: string
  widgets?: Record<string, boolean>
}): WorkspaceBackupEnvelope => ({
  format: WORKSPACE_BACKUP_FORMAT,
  version: WORKSPACE_BACKUP_VERSION,
  exportedAt: params.exportedAt,
  accountId: params.accountId,
  workspace: { settings: params.workspace.settings, favorites: params.workspace.favorites, recentApps: params.workspace.recentApps },
  categoryOverrides: params.categoryOverrides || {},
  widgets: params.widgets || {},
})

export const parseWorkspaceBackup = (text: string, current: AppState, currentAccountId?: string): WorkspaceImportPreview => {
  const parsed: unknown = JSON.parse(text)
  if (!isRecord(parsed)) throw new Error('Backup must contain a JSON object.')

  const isEnvelope = parsed.format === WORKSPACE_BACKUP_FORMAT || 'workspace' in parsed
  const version = typeof parsed.version === 'number' ? parsed.version : 1
  if (!Number.isInteger(version) || version < 1) throw new Error('Backup version is invalid.')
  if (version > WORKSPACE_BACKUP_VERSION) throw new Error(`This backup uses version ${version}, but this AppForge build supports up to version ${WORKSPACE_BACKUP_VERSION}.`)
  if (version >= 3 && currentAccountId && typeof parsed.accountId === 'string' && parsed.accountId !== currentAccountId) throw new Error('This workspace backup belongs to a different AppForge account.')

  const rawWorkspace = isEnvelope ? parsed.workspace : parsed
  const workspace = mergeWorkspaceState(rawWorkspace, current)
  const categoryOverrides = normalizeCategoryOverrides(isEnvelope ? parsed.categoryOverrides : undefined)
  const widgets = isEnvelope && isRecord(parsed.widgets) ? Object.fromEntries(Object.entries(parsed.widgets).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean').slice(0, 20)) : {}
  const exportedAt = typeof parsed.exportedAt === 'string' ? parsed.exportedAt.slice(0, 100) : null

  return {
    version,
    exportedAt,
    workspace,
    categoryOverrides,
    widgets,
    summary: {
      favorites: workspace.favorites.length,
      recentApps: workspace.recentApps.length,
      categoryOverrides: Object.keys(categoryOverrides).length,
      widgets: isEnvelope && isRecord(parsed.widgets) ? Object.values(parsed.widgets).filter((value) => typeof value === 'boolean').length : 0,
      legacy: parsed.format !== WORKSPACE_BACKUP_FORMAT,
    },
  }
}
