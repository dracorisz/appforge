import React from 'react'
import { Surface, type SpaceScale, type SurfaceVariant } from './Surface'

export function Card({
  children,
  className = '',
  onClick,
  padding,
  variant = 'card',
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  padding?: SpaceScale
  variant?: SurfaceVariant
}) {
  const hasExplicitPadding = /(?:^|\s)(?:p|px|py|pt|pb|pl|pr)-/.test(className)
  return (
    <Surface
      variant={variant}
      padding={padding ?? (hasExplicitPadding ? 0 : 4)}
      onClick={onClick}
      className={`text-card-foreground transition-[border-color,background-color,box-shadow] duration-200 ${className}`}
    >
      {children}
    </Surface>
  )
}
