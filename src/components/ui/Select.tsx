import React from 'react'

export function Select({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>}
      <select
        {...props}
        className={`min-h-10 w-full rounded-lg border border-input/80 bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-[border-color,box-shadow,background-color] hover:border-foreground/20 focus:border-ring/40 focus:outline-none focus:ring-2 focus:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 ${props.className || ''}`}
      >
        {children}
      </select>
    </div>
  )
}
