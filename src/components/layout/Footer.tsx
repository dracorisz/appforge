import React from 'react'
import { useNavigate } from 'react-router-dom'
import { GitBranch } from 'lucide-react'

const formatBuildTime = (value?: string) => {
  if (!value) return 'local'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }) + ' UTC'
}

export function Footer({ version }: { version?: string }) {
  const navigate = useNavigate()
  const appVersion = import.meta.env.VITE_APP_VERSION || version || 'dev'
  const fullSha = import.meta.env.VITE_GIT_SHA || 'local'
  const shortSha = fullSha === 'local' ? 'local' : fullSha.slice(0, 7)
  const buildTime = import.meta.env.VITE_BUILD_TIME || ''
  const buildLabel = `v${appVersion} · ${shortSha} · ${formatBuildTime(buildTime)}`

  return (
    <footer className="no-print border-t border-border bg-background py-3">
      <div className="flex flex-col gap-1 px-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>SSToken — Simple, powerful tools</span>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 font-mono hover:text-foreground"
          title={`Commit ${fullSha} · built ${buildTime || 'locally'}`}
        >
          <GitBranch className="h-3 w-3" /> {buildLabel}
        </button>
      </div>
    </footer>
  )
}
