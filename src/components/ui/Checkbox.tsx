import React from 'react'

export function Checkbox({ label, checked, onChange }: { label?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
      />
      {label && <span className="text-sm text-foreground">{label}</span>}
    </label>
  )
}
