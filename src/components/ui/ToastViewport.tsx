import React from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { APP_TOAST_EVENT, type AppToast } from "@/lib/toast";
import { isWidgetEnabled } from "@/lib/widgetPreferences";

export function ToastViewport() {
  const [toasts, setToasts] = React.useState<AppToast[]>([]);

  React.useEffect(() => {
    const onToast = (event: Event) => {
      if (isWidgetEnabled("desktop-buddy")) return;
      const toast = (event as CustomEvent<AppToast>).detail;
      if (!toast) return;
      setToasts((current) => [...current.filter((item) => item.id !== toast.id), toast].slice(-5));
      window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== toast.id)), toast.duration);
    };
    window.addEventListener(APP_TOAST_EVENT, onToast);
    return () => window.removeEventListener(APP_TOAST_EVENT, onToast);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite" aria-atomic="false">
      {toasts.map((item) => {
        const Icon = item.tone === "success" ? CheckCircle2 : item.tone === "error" ? AlertCircle : Info;
        const tone = item.tone === "success" ? "border-success/30 bg-success/40 text-white" : item.tone === "error" ? "border-destructive/40 bg-destructive/60 text-white" : "border-border/80 bg-popover/80 text-popover-foreground"; // design-palette-ok: white text is intentional for strong toast contrast
        return (
          <div key={item.id} className={`pointer-events-auto flex items-center justify-between gap-4 rounded-xl border px-4 py-4 backdrop-blur ${tone}`}>
            <Icon className="h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1 text-sm">{item.message}</div>
            <button type="button" onClick={() => setToasts((current) => current.filter((toast) => toast.id !== item.id))} className="rounded-xl p-2 opacity-70 hover:bg-inverse/10 hover:opacity-100" aria-label="Dismiss notification">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
