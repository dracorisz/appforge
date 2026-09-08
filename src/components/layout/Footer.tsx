import React from 'react'
import { useNavigate } from 'react-router-dom'
import { GitBranch } from 'lucide-react'

export function Footer({ version }: { version: string }) {
  const navigate = useNavigate()
  return (
    <footer className="no-print border-t border-border bg-background py-3">
      <div className="flex items-center justify-between px-4 text-xs text-muted-foreground">
        <span>AppForge — Simple, powerful tools</span>
        <button onClick={() => navigate('/')} className="flex items-center gap-1 hover:text-foreground">
          <GitBranch className="h-3 w-3" /> v{version}
        </button>
      </div>
    </footer>
  )
}
