import React from 'react'
import { controlClass, controlLabelClass } from './controlStyles'

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }>(function Select({ label, children, className = '', ...props }, ref) {
  const select = <select ref={ref} {...props} className={`${controlClass} ${className}`}>{children}</select>
  if (!label) return select
  return <div className="w-full"><label className={controlLabelClass}>{label}</label>{select}</div>
})
