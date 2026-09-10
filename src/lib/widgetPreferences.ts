export type WidgetPreferenceKey = 'weather-sidebar' | 'desktop-buddy'

const KEYS: Record<WidgetPreferenceKey, string> = {
  'weather-sidebar': 'appforge-widget-weather-sidebar',
  'desktop-buddy': 'appforge-widget-desktop-buddy',
}

const EVENT_NAME = 'appforge:widget-preferences'

export function isWidgetEnabled(key: WidgetPreferenceKey) {
  if (typeof window === 'undefined') return true
  try {
    const value = window.localStorage.getItem(KEYS[key])
    return value !== 'off'
  } catch {
    return true
  }
}

export function setWidgetEnabled(key: WidgetPreferenceKey, enabled: boolean) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEYS[key], enabled ? 'on' : 'off')
  } catch {
    // Keep the current session usable if storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { key, enabled } }))
}

export function subscribeWidgetPreferences(callback: (key?: WidgetPreferenceKey) => void) {
  if (typeof window === 'undefined') return () => undefined
  const onPreference = (event: Event) => callback((event as CustomEvent<{ key?: WidgetPreferenceKey }>).detail?.key)
  const onStorage = (event: StorageEvent) => {
    const matched = (Object.entries(KEYS) as [WidgetPreferenceKey, string][]).find(([, storageKey]) => storageKey === event.key)?.[0]
    if (matched) callback(matched)
  }
  window.addEventListener(EVENT_NAME, onPreference)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT_NAME, onPreference)
    window.removeEventListener('storage', onStorage)
  }
}
