import React from 'react'

export function Button({ children, variant = 'primary', size = 'md', className = '', disabled, onClick, type = 'button', title }: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  title?: string
}) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-1 focus:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:opacity-50'
  const variants = {
    primary: 'border border-primary/90 bg-primary text-primary-foreground shadow-sm hover:bg-primary/92 hover:shadow-md',
    secondary: 'border border-border/70 bg-secondary/72 text-secondary-foreground shadow-sm backdrop-blur-md hover:border-foreground/15 hover:bg-secondary/88',
    ghost: 'border border-transparent text-foreground hover:border-border/60 hover:bg-accent/70 hover:text-accent-foreground',
    destructive: 'border border-destructive/90 bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90'
  }
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }
  return (
    <button type={type} title={title} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}
