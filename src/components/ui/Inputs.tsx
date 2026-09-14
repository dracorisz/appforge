import React from 'react'
import { Search, X } from 'lucide-react'
import { controlClass, controlLabelClass } from './controlStyles'
import { IconButton } from './IconButton'

export function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="w-full">
      {label && <label className={controlLabelClass}>{label}</label>}
      <input {...props} className={`${controlClass} ${props.className || ''}`} />
    </div>
  )
}

export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search…',
  className = '',
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onClear?: () => void
}) {
  return (
    <div className={`relative w-full ${className}`}>
      <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input {...props} type="search" value={value} onChange={onChange} placeholder={placeholder} className={`${controlClass} pl-8 pr-8 [&::-webkit-search-cancel-button]:hidden`} />
      {value && onClear && (
        <IconButton
          label="Clear search"
          icon={<X />}
          onClick={onClear}
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2"
        />
      )}
    </div>
  )
}

export function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className="w-full">
      {label && <label className={controlLabelClass}>{label}</label>}
      <textarea {...props} className={`${controlClass} min-h-24 resize-y ${props.className || ''}`} />
    </div>
  )
}
