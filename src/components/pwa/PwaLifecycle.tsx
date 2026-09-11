import React from 'react'
import { Download, RefreshCw, WifiOff, X } from 'lucide-react'
import { registerSW } from 'virtual:pwa-register'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function PwaLifecycle() {
  const [needRefresh, setNeedRefresh] = React.useState(false)
  const [offlineReady, setOfflineReady] = React.useState(false)
  const [online, setOnline] = React.useState(() => navigator.onLine)
  const [installEvent, setInstallEvent] = React.useState<BeforeInstallPromptEvent | null>(null)
  const [installDismissed, setInstallDismissed] = React.useState(() => sessionStorage.getItem('appforge-install-dismissed') === '1')
  const updateRef = React.useRef<((reloadPage?: boolean) => Promise<void>) | null>(null)

  React.useEffect(() => {
    updateRef.current = registerSW({
      immediate: true,
      onNeedRefresh: () => setNeedRefresh(true),
      onOfflineReady: () => setOfflineReady(true),
    })

    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    const handleInstall = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }
    const handleInstalled = () => {
      setInstallEvent(null)
      setInstallDismissed(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('beforeinstallprompt', handleInstall)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const install = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    await installEvent.userChoice
    setInstallEvent(null)
  }

  const dismissInstall = () => {
    sessionStorage.setItem('appforge-install-dismissed', '1')
    setInstallDismissed(true)
  }

  const showInstall = Boolean(installEvent) && !installDismissed && !needRefresh
  const showStatus = needRefresh || offlineReady || !online || showInstall
  if (!showStatus) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-border/75 bg-background/92 p-3.5 shadow-xl backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/70">
          {needRefresh ? <RefreshCw className="h-4 w-4" /> : !online ? <WifiOff className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">
            {needRefresh ? 'New AppForge build ready' : !online ? 'You are offline' : showInstall ? 'Install AppForge' : 'Offline shell ready'}
          </div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">
            {needRefresh
              ? 'Reload once to use the newest deployment and matching build fingerprint.'
              : !online
                ? 'Local tools may keep working; live APIs and sign-in need a connection.'
                : showInstall
                  ? 'Add AppForge as a standalone app for faster access.'
                  : 'The app shell is cached. Network-backed tools still require connectivity.'}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {needRefresh && <button className="rounded-lg border border-primary/80 bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground" onClick={() => void updateRef.current?.(true)}>Update now</button>}
            {showInstall && <button className="rounded-lg border border-primary/80 bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground" onClick={() => void install()}>Install</button>}
            {(needRefresh || offlineReady) && <button className="rounded-lg border border-border/70 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground" onClick={() => { setNeedRefresh(false); setOfflineReady(false) }}>Later</button>}
            {showInstall && <button className="rounded-lg border border-border/70 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground" onClick={dismissInstall}>Not now</button>}
          </div>
        </div>
        <button aria-label="Dismiss PWA message" className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground" onClick={() => { setNeedRefresh(false); setOfflineReady(false); if (showInstall) dismissInstall() }}><X className="h-4 w-4" /></button>
      </div>
    </div>
  )
}
