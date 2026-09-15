import React from "react";
import { Download, RefreshCw, WifiOff, X } from "lucide-react";
import { registerSW } from "virtual:pwa-register";
import { Button } from "@/components/ui";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaLifecycle() {
  const [needRefresh, setNeedRefresh] = React.useState(false);
  const [offlineReady, setOfflineReady] = React.useState(false);
  const [online, setOnline] = React.useState(() => navigator.onLine);
  const [installEvent, setInstallEvent] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = React.useState(() => sessionStorage.getItem("appforge-install-dismissed") === "1");
  const updateRef = React.useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  React.useEffect(() => {
    updateRef.current = registerSW({
      immediate: true,
      onNeedRefresh: () => setNeedRefresh(true),
      onOfflineReady: () => setOfflineReady(true),
    });

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const handleInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallEvent(null);
      setInstallDismissed(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  const dismissInstall = () => {
    sessionStorage.setItem("appforge-install-dismissed", "1");
    setInstallDismissed(true);
  };

  const showInstall = Boolean(installEvent) && !installDismissed && !needRefresh;
  const showStatus = needRefresh || offlineReady || !online || showInstall;
  if (!showStatus) return null;

  const primaryActionClass =
    "rounded-xl border border-inverse bg-inverse px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-inverse/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";
  const secondaryActionClass = "rounded-xl border border-inverse/20 bg-inverse/5 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-inverse/10 hover:text-inverse focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-inverse/70";

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-inverse/15 bg-muted/95 p-4 text-inverse backdrop-blur-xl" style={{ colorScheme: "dark" }}>
      <div className="flex items-start gap-4">
        <div className="mt-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-inverse/15 bg-inverse/5 text-inverse">{needRefresh ? <RefreshCw className="h-4 w-4" /> : !online ? <WifiOff className="h-4 w-4" /> : <Download className="h-4 w-4" />}</div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-inverse">{needRefresh ? "New AppForge build ready" : !online ? "You are offline" : showInstall ? "Install AppForge" : "Offline shell ready"}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {needRefresh
              ? "Reload once to use the newest deployment and matching build fingerprint."
              : !online
                ? "Local tools may keep working; live APIs and sign-in need a connection."
                : showInstall
                  ? "Add AppForge as a standalone app for faster access."
                  : "The app shell is cached. Network-backed tools still require connectivity."}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {needRefresh && (
              <Button className={primaryActionClass} onClick={() => void updateRef.current?.(true)}>
                Update now
              </Button>
            )}
            {showInstall && (
              <Button className={primaryActionClass} onClick={() => void install()}>
                Install
              </Button>
            )}
            {(needRefresh || offlineReady) && (
              <Button
                className={secondaryActionClass}
                onClick={() => {
                  setNeedRefresh(false);
                  setOfflineReady(false);
                }}
              >
                Later
              </Button>
            )}
            {showInstall && (
              <Button className={secondaryActionClass} onClick={dismissInstall}>
                Not now
              </Button>
            )}
          </div>
        </div>
        <Button
          aria-label="Dismiss PWA message"
          className="p-2 text-muted-foreground hover:bg-inverse/10 hover:text-inverse focus-visible:ring-inverse/70"
          onClick={() => {
            setNeedRefresh(false);
            setOfflineReady(false);
            if (showInstall) dismissInstall();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
