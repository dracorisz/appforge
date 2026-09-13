import React from 'react'

export function Checkbox({ label, checked, onChange, disabled = false }: { label?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm transition-colors ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent/60'}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-input bg-background text-primary shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
      />
      {label && <span className="text-foreground">{label}</span>}
    </label>
  )
}
