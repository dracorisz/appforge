import React from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { Button } from "@/components/ui";

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
    <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-xl border border-border/80 bg-background/95 px-4 py-4 backdrop-blur-xl sm:bottom-4 sm:flex sm:items-center sm:gap-4">
      <p className="pr-8 text-sm text-muted-foreground sm:flex-1 sm:pr-2">
        AppForge uses essential browser storage for authentication state, preferences, and PWA features. Service providers may use strictly necessary session or security cookies. AppForge does not currently use advertising or behavioral-tracking cookies. See our <Link to="/privacy" className="font-medium text-foreground underline underline-offset-2">Privacy Policy</Link> and <Link to="/terms" className="font-medium text-foreground underline underline-offset-2">Terms</Link>.
      </p>
      <Button type="button" onClick={dismiss} className="absolute right-2 top-2 h-7 w-7 text-muted-foreground hover:text-foreground sm:static sm:shrink-0" aria-label="Dismiss storage notice"><X className="h-4 w-4" /></Button>
    </div>
  )
}
