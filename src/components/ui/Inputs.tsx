import React from 'react'

const controlClass = 'w-full rounded-lg border border-input/80 bg-background/70 px-3 py-2 text-sm text-foreground shadow-[inset_0_1px_0_hsl(var(--foreground)/0.025)] backdrop-blur-md placeholder:text-muted-foreground transition-[border-color,box-shadow,background-color] focus:border-ring/35 focus:bg-background/88 focus:outline-none focus:ring-2 focus:ring-ring/15'

export function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div>
      {label && <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>}
      <input {...props} className={`${controlClass} ${props.className || ''}`} />
    </div>
  )
}

export function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div>
      {label && <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>}
      <textarea {...props} className={`${controlClass} ${props.className || ''}`} />
    </div>
  )
}
