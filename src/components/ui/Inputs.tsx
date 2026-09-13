import React from 'react'
import { Search, X } from 'lucide-react'

const controlClass = 'h-6 max-h-6 w-full rounded-xl border border-input/80 bg-background px-2.5 py-0 text-xs text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow,background-color] hover:border-foreground/20 focus:border-ring/40 focus:outline-none focus:ring-2 focus:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50'

export function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="w-full">
      {label && <label className="mb-1 block text-xs font-medium text-foreground">{label}</label>}
      <input {...props} className={`${controlClass} ${props.className || ''}`} />
    </div>
  )
}

export function SearchInput({ value, onChange, onClear, placeholder = 'Search…', className = '', ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onClear?: () => void
}) {
  return (
    <div className={`relative w-full ${className}`}>
      <Search className="pointer-events-none absolute left-2 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        {...props}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${controlClass} pl-7 pr-7 [&::-webkit-search-cancel-button]:hidden`}
      />
      {value && onClear && <button type="button" onClick={onClear} aria-label="Clear search" className="absolute right-1 top-1/2 z-10 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground"><X className="h-3 w-3" /></button>}
    </div>
  )
}

export function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className="w-full">
      {label && <label className="mb-1 block text-xs font-medium text-foreground">{label}</label>}
      <textarea {...props} className={`w-full min-h-10 max-h-28 resize-y rounded-xl border border-input/80 bg-background px-2.5 py-1.5 text-xs leading-4 text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow,background-color] hover:border-foreground/20 focus:border-ring/40 focus:outline-none focus:ring-2 focus:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 ${props.className || ''}`} />
    </div>
  )
}
