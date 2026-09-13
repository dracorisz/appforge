import React from 'react'
import { Search, X } from 'lucide-react'

const controlClass = 'min-h-10 w-full rounded-lg border border-input/80 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow,background-color] hover:border-foreground/20 focus:border-ring/40 focus:outline-none focus:ring-2 focus:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50'

export function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>}
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
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        {...props}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${controlClass} pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden`}
      />
      {value && onClear && <button type="button" onClick={onClear} aria-label="Clear search" className="absolute right-2 top-1/2 z-10 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}
    </div>
  )
}

export function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>}
      <textarea {...props} className={`${controlClass} resize-y ${props.className || ''}`} />
    </div>
  )
}
