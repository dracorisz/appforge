import React from 'react'
import { controlClass, controlLabelClass } from './controlStyles'

export function Select({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="w-full">
      {label && <label className={controlLabelClass}>{label}</label>}
      <select {...props} className={`${controlClass} ${props.className || ''}`}>
        {children}
      </select>
    </div>
  )
}
