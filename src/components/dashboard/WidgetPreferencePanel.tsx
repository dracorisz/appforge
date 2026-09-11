import React from 'react'
import { CloudSun, Move, Volume2 } from 'lucide-react'
import { Card, Switch } from '@/components/ui'
import { isWidgetEnabled, setWidgetEnabled, subscribeWidgetPreferences, type WidgetPreferenceKey } from '@/lib/widgetPreferences'

type Kind = 'weather' | 'desktop-buddy'

const config: Record<Kind, {
  preference: WidgetPreferenceKey
  title: string
  description: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = {
  weather: {
    preference: 'weather-sidebar',
    title: 'Sidebar weather widget',
    description: 'Show the compact current-condition card in the AppForge sidebar. The widget uses the first saved Weather Now location.',
    label: 'Show Weather Now in the sidebar',
    icon: CloudSun,
  },
  'desktop-buddy': {
    preference: 'desktop-buddy',
    title: 'Floating Desktop Buddy widget',
    description: 'Show your movable PNG character across AppForge pages with Speak, Jump and Screenshot actions.',
    label: 'Show floating Desktop Buddy',
    icon: Move,
  },
}

export function WidgetPreferencePanel({ kind }: { kind: Kind }) {
  const item = config[kind]
  const [enabled, setEnabled] = React.useState(() => isWidgetEnabled(item.preference))

  React.useEffect(() => subscribeWidgetPreferences((changed) => {
    if (!changed || changed === item.preference) setEnabled(isWidgetEnabled(item.preference))
  }), [item.preference])

  const Icon = item.icon
  return (
    <Card className="mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border/60 bg-background/55 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold text-foreground">{item.title}</h2>{kind === 'desktop-buddy' && <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><Volume2 className="h-3 w-3" /> actions enabled</span>}</div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{item.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 self-end sm:self-auto">
        <span className="text-xs font-medium text-muted-foreground">{enabled ? 'On' : 'Off'}</span>
        <Switch checked={enabled} onCheckedChange={(checked) => { setWidgetEnabled(item.preference, checked); setEnabled(checked) }} label={item.label} />
      </div>
    </Card>
  )
}
