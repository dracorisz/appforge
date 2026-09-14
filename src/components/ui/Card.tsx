import React from 'react'

export function Card({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`surface-card rounded-xl border border-border/80 bg-card/90 text-card-foreground transition-[border-color,background-color,box-shadow] duration-200 ${/(?:^|\s)(?:p|px|py|pt|pb|pl|pr)-/.test(className) ? '' : 'p-4 sm:p-4'} ${className}`}
    >
      {children}
    </div>
  )
}
