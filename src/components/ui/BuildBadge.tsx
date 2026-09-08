import React from 'react'
import { GitBranch } from 'lucide-react'
import { BUILD_INFO } from '@/lib/buildInfo'

export function BuildBadge({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  const label = compact ? BUILD_INFO.label : BUILD_INFO.detailedLabel

  return (
    <span
      title={`AppForge ${BUILD_INFO.version}\nCommit: ${BUILD_INFO.sha}\nBuilt: ${BUILD_INFO.buildTime || 'local'}`}
      className={`inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/55 px-2 py-1 font-mono text-[10px] text-muted-foreground shadow-sm backdrop-blur-md ${className}`}
    >
      <GitBranch className="h-3 w-3" />
      {label}
    </span>
  )
}
