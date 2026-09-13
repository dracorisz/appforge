import React from 'react'

export function Select({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="w-full">
      {label && <label className="mb-1 block text-xs font-medium text-foreground">{label}</label>}
      <select
        {...props}
        className={`h-6 max-h-6 w-full rounded-xl border border-input/80 bg-background px-2 py-0 text-xs text-foreground transition-[border-color,background-color] hover:border-foreground/20 focus:border-ring/40 focus:outline-none focus:ring-2 focus:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 ${props.className || ''}`}
      >
        {children}
      </select>
    </div>
  )
}
