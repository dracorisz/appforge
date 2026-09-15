import React from 'react'
import { APP_ICON_NAMES, AppIcon } from '@/lib/appIcons'
import { Button } from './Button'
import { SearchInput } from './Inputs'

export function AppIconPicker({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const [query, setQuery] = React.useState('')
  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    return APP_ICON_NAMES.filter((name) => !needle || name.toLowerCase().includes(needle))
  }, [query])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium">App icon</span>
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><AppIcon name={value} />{value || 'Wrench'}</span>
      </div>
      <SearchInput value={query} onChange={(event) => setQuery(event.target.value)} onClear={() => setQuery('')} placeholder="Find an icon…" aria-label="Find an app icon" />
      <div className="grid max-h-40 grid-cols-6 gap-2 overflow-y-auto rounded-xl border bg-background p-2 sm:grid-cols-8" aria-label="App icon choices">
        {filtered.map((name) => (
          <Button key={name} type="button" size="sm" variant={value === name ? 'secondary' : 'ghost'} onClick={() => onChange(name)} aria-label={`Use ${name} icon`} title={name}>
            <AppIcon name={name} />
          </Button>
        ))}
      </div>
    </div>
  )
}
