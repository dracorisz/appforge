import React from 'react'

const colors: Record<string, string> = {
  green: 'bg-primary text-primary-foreground',
  red: 'bg-destructive text-destructive-foreground',
  yellow: 'bg-muted text-muted-foreground',
  blue: 'bg-secondary text-secondary-foreground',
  slate: 'bg-muted text-muted-foreground',
  orange: 'bg-accent text-accent-foreground',
  pink: 'bg-accent text-accent-foreground',
  cyan: 'bg-accent text-accent-foreground',
  purple: 'bg-accent text-accent-foreground'
}

export function Badge({ children, color = 'slate', className = '' }: { children: React.ReactNode; color?: keyof typeof colors; className?: string }) {
  return <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${colors[color]} ${className}`}>{children}</span>
}
