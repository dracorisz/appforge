import type { CategoryDefinition } from './registry'
import { getAllApps, getAllCategories } from './registry'

export interface CategoryOverride {
  name?: string
  description?: string
  icon?: string
  visibleInSidebar?: boolean
}

export const DEFAULT_SIDEBAR_CATEGORY_IDS = ['ai', 'utilities', 'image', 'converters'] as const
export const DEFAULT_SIDEBAR_APP_IDS = ['weather-now', 'scrapper-pro', 'any-converter', 'desktop-buddy'] as const

export function isCategoryVisibleInSidebar(id: string, override?: CategoryOverride) {
  if (typeof override?.visibleInSidebar === 'boolean') return override.visibleInSidebar
  return DEFAULT_SIDEBAR_CATEGORY_IDS.includes(id as typeof DEFAULT_SIDEBAR_CATEGORY_IDS[number])
}

export function appSidebarPreferenceKey(id: string) {
  return `app:${id}`
}

export function isAppVisibleInSidebar(id: string, override?: CategoryOverride) {
  if (typeof override?.visibleInSidebar === 'boolean') return override.visibleInSidebar
  return DEFAULT_SIDEBAR_APP_IDS.includes(id as typeof DEFAULT_SIDEBAR_APP_IDS[number])
}

const STORAGE_KEY = 'appforge-category-overrides-v2'
const EVENT_NAME = 'appforge:category-overrides'

export function loadCategoryOverrides(): Record<string, CategoryOverride> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function saveCategoryOverrides(overrides: Record<string, CategoryOverride>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
  window.dispatchEvent(new CustomEvent(EVENT_NAME))
}

export function updateCategoryOverride(id: string, patch: CategoryOverride) {
  const current = loadCategoryOverrides()
  const next = {
    ...current,
    [id]: {
      ...(current[id] || {}),
      ...patch,
    },
  }
  saveCategoryOverrides(next)
  return next
}

export function resetCategoryOverride(id: string) {
  const current = loadCategoryOverrides()
  const { [id]: _removed, ...next } = current
  saveCategoryOverrides(next)
  return next
}

export function restoreDefaultSidebarCategories() {
  const current = loadCategoryOverrides()
  const next = { ...current }
  getAllCategories().forEach((category) => {
    next[category.id] = {
      ...(next[category.id] || {}),
      visibleInSidebar: DEFAULT_SIDEBAR_CATEGORY_IDS.includes(category.id as typeof DEFAULT_SIDEBAR_CATEGORY_IDS[number]),
    }
  })
  saveCategoryOverrides(next)
  return next
}

export function restoreDefaultSidebarApps() {
  const current = loadCategoryOverrides()
  const next = { ...current }
  getAllApps().forEach((app) => {
    const key = appSidebarPreferenceKey(app.id)
    next[key] = {
      ...(next[key] || {}),
      visibleInSidebar: DEFAULT_SIDEBAR_APP_IDS.includes(app.id as typeof DEFAULT_SIDEBAR_APP_IDS[number]),
    }
  })
  saveCategoryOverrides(next)
  return next
}

export function resolveCategories(overrides = loadCategoryOverrides()): CategoryDefinition[] {
  return getAllCategories().map((category) => ({
    ...category,
    ...(overrides[category.id] || {}),
  }))
}

export function subscribeCategoryOverrides(callback: () => void) {
  if (typeof window === 'undefined') return () => undefined
  const handler = () => callback()
  window.addEventListener(EVENT_NAME, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(EVENT_NAME, handler)
    window.removeEventListener('storage', handler)
  }
}

export { STORAGE_KEY as CATEGORY_OVERRIDES_STORAGE_KEY }
