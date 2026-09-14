import React from 'react'

export function Select({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="w-full">
      {label && <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>}
      <select
        {...props}
        className={`min-h-10 w-full rounded-xl border border-input/80 bg-background px-4 py-2 text-sm text-foreground transition-[border-color,background-color] hover:border-foreground/20 focus:border-ring/40 focus:outline-none focus:ring-1 focus:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 ${props.className || ''}`}
      >
        {children}
      </select>
    </div>
  )
}
