import React from 'react'

export function Card({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-colors duration-200 hover:bg-accent/50 ${className}`}>
      {children}
    </div>
  )
}
