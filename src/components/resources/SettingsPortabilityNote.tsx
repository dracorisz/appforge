import React from 'react'
import { Download, Upload } from 'lucide-react'

export function SettingsPortabilityNote() {
  return (
    <div className="mb-4 grid gap-2 rounded-xl border border-border/70 bg-card/55 p-3 text-xs text-muted-foreground sm:grid-cols-2">
      <div className="flex items-start gap-2"><Download className="mt-0.5 h-4 w-4 shrink-0" /><div><span className="font-medium text-foreground">Workspace export</span><p className="mt-1 leading-5">Settings → Data exports compatible AppForge workspace state for backup or moving to another browser. Server-owned files are not silently duplicated.</p></div></div>
      <div className="flex items-start gap-2"><Upload className="mt-0.5 h-4 w-4 shrink-0" /><div><span className="font-medium text-foreground">Mini-app product exports</span><p className="mt-1 leading-5">Apps export their own usable products separately: Novel Markdown, Comic HTML, converted files, future landing-site packages, and other app-specific formats.</p></div></div>
    </div>
  )
}
