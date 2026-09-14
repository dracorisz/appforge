import React from 'react'

export type SurfaceVariant = 'card' | 'panel' | 'muted' | 'popover'
export type SpaceScale = 0 | 2 | 4 | 8

const surfaceClasses: Record<SurfaceVariant, string> = {
  card: 'surface-card',
  panel: 'surface-panel',
  muted: 'surface-muted',
  popover: 'surface-popover shadow-xl',
}

const paddingClasses: Record<SpaceScale, string> = {
  0: '',
  2: 'p-2',
  4: 'p-4',
  8: 'p-8',
}

const gapClasses: Record<SpaceScale, string> = {
  0: '',
  2: 'gap-2',
  4: 'gap-4',
  8: 'gap-8',
}

export function Surface({
  as: Tag = 'div',
  variant = 'card',
  padding = 4,
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'article' | 'aside'
  variant?: SurfaceVariant
  padding?: SpaceScale
}) {
  return (
    <Tag className={`${surfaceClasses[variant]} ${paddingClasses[padding]} ${className}`} {...props}>
      {children}
    </Tag>
  )
}

export function Stack({
  as: Tag = 'div',
  gap = 4,
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer'
  gap?: SpaceScale
}) {
  return (
    <Tag className={`flex flex-col ${gapClasses[gap]} ${className}`} {...props}>
      {children}
    </Tag>
  )
}
