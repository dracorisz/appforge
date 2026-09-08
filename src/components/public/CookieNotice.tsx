import React from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'

const STORAGE_KEY = 'appforge-cookie-notice-dismissed-v1'

export function CookieNotice() {
  const [visible, setVisible] = React.useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) !== '1' } catch { return true }
  })

  if (!visible) return null

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
    setVisible(false)
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-xl border border-border/80 bg-background/95 px-4 py-3 shadow-2xl backdrop-blur-xl sm:bottom-4 sm:flex sm:items-center sm:gap-4">
      <p className="pr-8 text-xs leading-5 text-muted-foreground sm:flex-1 sm:pr-0">
        AppForge uses essential browser storage and authentication/session cookies to keep you signed in, remember preferences, and run the PWA. We do not use advertising cookies. See our <Link to="/privacy" className="font-medium text-foreground underline underline-offset-2">Privacy Policy</Link> and <Link to="/terms" className="font-medium text-foreground underline underline-offset-2">Terms</Link>.
      </p>
      <button type="button" onClick={dismiss} className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground sm:static sm:shrink-0" aria-label="Dismiss cookie notice"><X className="h-4 w-4" /></button>
    </div>
  )
}
