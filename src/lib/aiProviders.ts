/** Read at request time so Settings changes apply without remounting an app. */
export const GEMINI_KEY_STORAGE = 'appforge-gemini-key'
export function getGeminiHeaders(): Record<string, string> {
  try {
    const key = localStorage.getItem(GEMINI_KEY_STORAGE)?.trim()
    return key ? { 'x-gemini-key': key } : {}
  } catch { return {} }
}
