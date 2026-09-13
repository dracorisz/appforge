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
  const base = 'inline-flex h-6 max-h-6 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl font-medium transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:h-3.5 [&_svg]:w-3.5'
  const variants = {
    default: 'border border-primary/90 bg-primary text-primary-foreground hover:bg-primary/92',
    primary: 'border border-primary/90 bg-primary text-primary-foreground hover:bg-primary/92',
    secondary: 'border border-border/70 bg-secondary/72 text-secondary-foreground backdrop-blur-md hover:border-foreground/15 hover:bg-secondary/88',
    ghost: 'border border-transparent text-foreground hover:border-border/60 hover:bg-accent/70 hover:text-accent-foreground',
    destructive: 'border border-destructive/90 bg-destructive text-destructive-foreground hover:bg-destructive/90'
  }
  const sizes = {
    sm: 'px-2 text-[11px]',
    md: 'px-2.5 text-xs',
    lg: 'px-3 text-xs'
  }
  return (
    <button {...props} type={type} title={title} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}
