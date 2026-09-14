import React from 'react'
import { CloudSun, Move } from 'lucide-react'
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
    description: 'Show current conditions in the AppForge sidebar using your selected Weather Now city.',
    label: 'Show Weather Now in the sidebar',
    icon: CloudSun,
  },
  'desktop-buddy': {
    preference: 'desktop-buddy',
    title: 'Floating Desktop Buddy',
    description: 'Show your movable character across AppForge with its response and screenshot controls.',
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
    <Card className="mb-4 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          <Icon className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">{item.description}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4 self-end sm:self-auto">
          <span className="text-xs font-medium text-muted-foreground">{enabled ? 'On' : 'Off'}</span>
          <Switch checked={enabled} onCheckedChange={(checked) => { setWidgetEnabled(item.preference, checked); setEnabled(checked) }} label={item.label} />
        </div>
      </div>
    </Card>
  )
}
