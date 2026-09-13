import React from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { APP_TOAST_EVENT, type AppToast } from '@/lib/toast'

export function ToastViewport() {
  const [toasts, setToasts] = React.useState<AppToast[]>([])

  React.useEffect(() => {
    const onToast = (event: Event) => {
      const toast = (event as CustomEvent<AppToast>).detail
      if (!toast) return
      setToasts((current) => [...current.filter((item) => item.id !== toast.id), toast].slice(-5))
      window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== toast.id)), toast.duration)
    }
    window.addEventListener(APP_TOAST_EVENT, onToast)
    return () => window.removeEventListener(APP_TOAST_EVENT, onToast)
  }, [])

  if (!toasts.length) return null

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite" aria-atomic="false">
      {toasts.map((item) => {
        const Icon = item.tone === 'success' ? CheckCircle2 : item.tone === 'error' ? AlertCircle : Info
        const tone = item.tone === 'success'
          ? 'border-emerald-500/30 bg-emerald-950/90 text-emerald-50'
          : item.tone === 'error'
            ? 'border-destructive/40 bg-red-950/90 text-red-50'
            : 'border-border/80 bg-popover/95 text-popover-foreground'
        return (
          <div key={item.id} className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-3.5 py-3 backdrop-blur ${tone}`}>
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1 text-sm leading-5">{item.message}</div>
            <button type="button" onClick={() => setToasts((current) => current.filter((toast) => toast.id !== item.id))} className="rounded-xl p-1 opacity-70 hover:bg-white/10 hover:opacity-100" aria-label="Dismiss notification"><X className="h-3.5 w-3.5" /></button>
          </div>
        )
      })}
    </div>
  )
}
