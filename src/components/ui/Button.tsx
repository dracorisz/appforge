import React from 'react'

export function Button({ children, variant = 'primary', size = 'md', className = '', disabled, onClick, type = 'button', title, ...props }: {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  title?: string
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className' | 'disabled' | 'onClick' | 'type' | 'title'>) {
  const base = 'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-1 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:opacity-50'
  const variants = {
    default: 'border border-primary/90 bg-primary text-primary-foreground hover:bg-primary/92',
    primary: 'border border-primary/90 bg-primary text-primary-foreground hover:bg-primary/92',
    secondary: 'border border-border/70 bg-secondary/72 text-secondary-foreground backdrop-blur-md hover:border-foreground/15 hover:bg-secondary/88',
    ghost: 'border border-transparent text-foreground hover:border-border/60 hover:bg-accent/70 hover:text-accent-foreground',
    destructive: 'border border-destructive/90 bg-destructive text-destructive-foreground hover:bg-destructive/90'
  }
  const sizes = {
    sm: 'min-h-9 px-2.5 py-1.5 text-xs',
    md: 'min-h-10 px-4 py-2 text-sm',
    lg: 'min-h-11 px-6 py-2.5 text-base'
  }
  return (
    <button {...props} type={type} title={title} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}
