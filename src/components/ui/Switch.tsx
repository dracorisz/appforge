import React from 'react'

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
}

export function Switch({ checked, onCheckedChange, label, className = '', disabled, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-xl border transition-[background-color,border-color] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'border-primary/60 bg-primary' : 'border-input bg-muted hover:border-foreground/20'} ${className}`}
      {...props}
    >
      <span className={`pointer-events-none block h-4 w-4 rounded-xl bg-inverse transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}
