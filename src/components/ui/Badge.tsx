import React from "react";

const colors: Record<string, string> = {
  green: "border-primary/30 bg-primary/10 text-foreground",
  red: "border-destructive/30 bg-destructive/10 text-destructive",
  yellow: "border-border bg-muted text-muted-foreground",
  blue: "border-border bg-secondary text-secondary-foreground",
  slate: "border-border bg-muted text-muted-foreground",
  orange: "border-border bg-accent text-accent-foreground",
  pink: "border-border bg-accent text-accent-foreground",
  cyan: "border-border bg-accent text-accent-foreground",
  purple: "border-border bg-accent text-accent-foreground",
};

export function Badge({ children, color = "slate", className = "" }: { children: React.ReactNode; color?: keyof typeof colors; className?: string }) {
  return <span className={`app-pill inline-flex items-center rounded-xl border px-2 text-sm font-medium ${colors[color]} ${className}`}>{children}</span>;
}
