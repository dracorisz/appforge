import React from 'react'

export type TextTone = 'default' | 'muted' | 'success' | 'warning' | 'info' | 'destructive'
export type TextRole = 'body' | 'label' | 'helper' | 'title' | 'hero'

const roleClasses: Record<TextRole, string> = {
  body: 'text-sm',
  label: 'text-sm font-medium',
  helper: 'text-sm text-muted-foreground',
  title: 'text-lg font-semibold tracking-tight',
  hero: 'text-5xl font-semibold tracking-tight',
}

const toneClasses: Record<TextTone, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
  destructive: 'text-destructive',
}

export function Text({
  as: Tag = 'p',
  role = 'body',
  tone = 'default',
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  as?: 'p' | 'span' | 'div' | 'label' | 'strong'
  role?: TextRole
  tone?: TextTone
}) {
  return (
    <Tag className={`${roleClasses[role]} ${toneClasses[tone]} ${className}`} {...props}>
      {children}
    </Tag>
  )
}

export const BodyText = (props: Omit<React.ComponentProps<typeof Text>, 'role'>) => <Text role="body" {...props} />
export const LabelText = (props: Omit<React.ComponentProps<typeof Text>, 'role'>) => <Text role="label" {...props} />
export const HelperText = (props: Omit<React.ComponentProps<typeof Text>, 'role' | 'tone'>) => <Text role="helper" tone="muted" {...props} />
