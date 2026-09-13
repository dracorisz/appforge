import React from 'react'

export function Card({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const interactive = Boolean(onClick) || /(?:cursor-pointer|hover:|focus-within:)/.test(className)
  return (
    <div
      onClick={onClick}
      className={`surface-card rounded-xl border border-border/80 bg-card/90 text-card-foreground shadow-sm transition-[border-color,background-color,box-shadow,transform] duration-200 hover:shadow-md ${interactive ? 'hover:-translate-y-px' : ''} ${/(?:^|\s)(?:p|px|py|pt|pb|pl|pr)-/.test(className) ? '' : 'p-4 sm:p-5'} ${className}`}
    >
      {children}
    </div>
  )
}
