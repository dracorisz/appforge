import React from 'react'

export function Card({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`surface-card rounded-xl border border-border/80 bg-card/90 text-card-foreground shadow-sm transition-[border-color,background-color,box-shadow,transform] duration-200 ${className}`}
    >
      {children}
    </div>
  )
}
