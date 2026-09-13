import React, { useState } from 'react'
import { Copy, Check, X } from 'lucide-react'

export type TabItem = {
  id: string
  label: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

export function Tabs({ tabs, active, onChange, ariaLabel = 'Sections', className = '' }: {
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
  ariaLabel?: string
  className?: string
}) {
  return (
    <div className={`flex min-h-11 gap-2 overflow-x-auto rounded-xl border border-border/70 bg-card/70 p-2 ${className}`} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const selected = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={`inline-flex h-9 shrink-0 cursor-pointer select-none items-center justify-center gap-2 rounded-xl px-4 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${selected ? 'bg-background text-foreground' : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground'}`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 px-4 py-8 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-2 max-w-md text-sm leading-5 text-muted-foreground">{description}</p>}
    </div>
  )
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div role="status" aria-live="polite" className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">
      <span className="min-w-0 flex-1">{message}</span>
      <button type="button" onClick={onClose} className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-foreground" aria-label="Dismiss notification">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export function Progress({ value, max, className = '' }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0
  return (
    <div className={`h-2 w-full overflow-hidden rounded-xl bg-secondary ${className}`} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(max, Math.max(0, value))}>
      <div className="h-full rounded-xl bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  return <Progress value={value} max={max} />
}

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }
  return (
    <button type="button" onClick={copy} className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-xs text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" aria-label={label ? `Copy ${label}` : 'Copy text'}>
      {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
      {copied ? 'Copied' : label || 'Copy'}
    </button>
  )
}
