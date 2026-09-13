export type ToastTone = 'success' | 'error' | 'info'

export type AppToast = {
  id: string
  message: string
  tone: ToastTone
  duration: number
}

export const APP_TOAST_EVENT = 'appforge:toast'

const emit = (message: string, tone: ToastTone, duration = 3200) => {
  if (typeof window === 'undefined' || !message.trim()) return
  const detail: AppToast = { id: crypto.randomUUID(), message: message.trim(), tone, duration }
  window.dispatchEvent(new CustomEvent<AppToast>(APP_TOAST_EVENT, { detail }))
}

export const toast = {
  success: (message: string, duration?: number) => emit(message, 'success', duration),
  error: (message: string, duration?: number) => emit(message, 'error', duration ?? 4600),
  info: (message: string, duration?: number) => emit(message, 'info', duration),
}
