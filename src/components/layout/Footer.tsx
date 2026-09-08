import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BuildBadge } from '@/components/ui'

export function Footer({ version: _version }: { version?: string }) {
  const navigate = useNavigate()

  return (
    <footer className="no-print border-t border-border/70 bg-background/72 py-2.5 backdrop-blur-xl">
      <div className="flex flex-col gap-1.5 px-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="truncate">AppForge — Simple, powerful tools</span>
        <button
          onClick={() => navigate('/')}
          className="w-fit shrink-0 rounded-full transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring/30"
          aria-label="Open AppForge dashboard"
        >
          <BuildBadge />
        </button>
      </div>
    </footer>
  )
}
