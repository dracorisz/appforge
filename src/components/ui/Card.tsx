import React from 'react'

export function Card({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const hasExplicitPadding = /(?:^|\s)(?:p|px|py|pt|pb|pl|pr)-/.test(className)
  return (
    <div
      onClick={onClick}
      className={`surface-card rounded-xl border border-border/70 text-card-foreground transition-[border-color,background-color,box-shadow] duration-200 ${hasExplicitPadding ? '' : 'p-4'} ${className}`}
    >
      {children}
    </div>
  )
}
