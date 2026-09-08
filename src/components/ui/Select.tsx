import React from 'react'

export function Select({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div>
      {label && <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>}
      <select
        {...props}
        className={`w-full rounded-lg border border-input/80 bg-background/70 px-3 py-2 text-sm text-foreground shadow-[inset_0_1px_0_hsl(var(--foreground)/0.025)] backdrop-blur-md transition-[border-color,box-shadow,background-color] focus:border-ring/35 focus:bg-background/88 focus:outline-none focus:ring-2 focus:ring-ring/15 ${props.className || ''}`}
      >
        {children}
      </select>
    </div>
  )
}
