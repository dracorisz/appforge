const ACTIVE_ACCOUNT_KEY = 'appforge-active-local-account-v1'
const ACCOUNT_PREFIX = 'appforge-account-local-v1'

// These values belong to authenticated/private experiences or contain provider credentials.
// Public, device-level preferences such as theme/weather remain intentionally shared.
const ACCOUNT_LOCAL_KEYS = [
  'appforge-desktop-buddy-v1',
  'appforge-scrapper-saved',
  'dragon-arena-hf-keys',
  'dragon-arena-hf-key',
  'dragon-arena-openrouter-key',
  'appforge-gemini-key',
] as const

const scopedKey = (userId: string, key: string) => `${ACCOUNT_PREFIX}:${userId}:${key}`

const safeGet = (storage: Storage, key: string) => {
  try { return storage.getItem(key) } catch { return null }
}

const safeSet = (storage: Storage, key: string, value: string) => {
  try { storage.setItem(key, value) } catch { /* local cache is best-effort */ }
}

const safeRemove = (storage: Storage, key: string) => {
  try { storage.removeItem(key) } catch { /* local cache is best-effort */ }
}

function parkAccount(userId: string) {
  for (const key of ACCOUNT_LOCAL_KEYS) {
    const value = safeGet(localStorage, key)
    if (value === null) safeRemove(localStorage, scopedKey(userId, key))
    else safeSet(localStorage, scopedKey(userId, key), value)
  }
}

function clearLiveKeys() {
  for (const key of ACCOUNT_LOCAL_KEYS) safeRemove(localStorage, key)
}

function restoreAccount(userId: string) {
  for (const key of ACCOUNT_LOCAL_KEYS) {
    const value = safeGet(localStorage, scopedKey(userId, key))
    if (value !== null) safeSet(localStorage, key, value)
  }
}

export function activateAccountLocalStorage(userId: string | null) {
  if (typeof window === 'undefined') return
  // localStorage is intentional here: all tabs share the same Supabase auth account and
  // must agree which account owns the live compatibility keys used by existing apps.
  const activeUserId = safeGet(localStorage, ACTIVE_ACCOUNT_KEY)
  if (activeUserId === userId) return

  if (activeUserId) parkAccount(activeUserId)
  clearLiveKeys()

  if (userId) {
    restoreAccount(userId)
    safeSet(localStorage, ACTIVE_ACCOUNT_KEY, userId)
  } else {
    safeRemove(localStorage, ACTIVE_ACCOUNT_KEY)
  }

  window.dispatchEvent(new CustomEvent('appforge:account-local-storage', { detail: { userId } }))
}
