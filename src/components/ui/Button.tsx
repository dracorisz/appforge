import React from 'react'
import { buttonBaseClass, buttonSizeClasses, buttonVariantClasses, type ButtonSize, type ButtonVariant } from './buttonStyles'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({
  children,
  variant = 'primary',
  size = 'sm',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`${buttonBaseClass} ${buttonVariantClasses[variant]} ${buttonSizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  )
}
