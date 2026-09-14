import { isWidgetEnabled } from '@/lib/widgetPreferences'

export type ToastTone = 'success' | 'error' | 'info'

export type AppToast = {
  id: string
  message: string
  tone: ToastTone
  duration: number
}

export const APP_TOAST_EVENT = 'appforge:toast'
export const APP_BUDDY_NOTIFICATION_EVENT = 'appforge:desktop-buddy-notification'

const emit = (message: string, tone: ToastTone, duration = 3200) => {
  if (typeof window === 'undefined' || !message.trim()) return
  const buddyEnabled = isWidgetEnabled('desktop-buddy')
  const detail: AppToast = {
    id: crypto.randomUUID(),
    message: message.trim(),
    tone,
    duration: buddyEnabled ? 5000 : duration,
  }
  window.dispatchEvent(new CustomEvent<AppToast>(buddyEnabled ? APP_BUDDY_NOTIFICATION_EVENT : APP_TOAST_EVENT, { detail }))
}

export const toast = {
  success: (message: string, duration?: number) => emit(message, 'success', duration),
  error: (message: string, duration?: number) => emit(message, 'error', duration ?? 4600),
  info: (message: string, duration?: number) => emit(message, 'info', duration),
}
