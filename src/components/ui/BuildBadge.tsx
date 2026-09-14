import React from "react";
import { GitBranch } from "lucide-react";
import { BUILD_INFO } from "@/lib/buildInfo";

export function BuildBadge({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  const label = compact ? BUILD_INFO.label : BUILD_INFO.detailedLabel;

  return (
    <span title={`AppForge ${BUILD_INFO.version}\nCommit: ${BUILD_INFO.sha}\nBuilt: ${BUILD_INFO.buildTime || "local"}`} className={`app-pill inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/55 px-2 font-mono text-sm text-muted-foreground backdrop-blur-md ${className}`}>
      <GitBranch className="h-4 w-4" />
      {label}
    </span>
  );
}
