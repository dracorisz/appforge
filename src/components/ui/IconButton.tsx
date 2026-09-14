import React from 'react'
import { buttonBaseClass, buttonVariantClasses, iconButtonSizeClasses, type ButtonVariant, type IconButtonSize } from './buttonStyles'

export type IconButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & {
  label: string
  icon: React.ReactNode
  variant?: ButtonVariant
  size?: IconButtonSize
  className?: string
}

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  size = 'sm',
  className = '',
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      type={type}
      aria-label={label}
      title={props.title || label}
      className={`${buttonBaseClass} ${buttonVariantClasses[variant]} ${iconButtonSizeClasses[size]} px-2 ${className}`}
    >
      {icon}
    </button>
  )
}
