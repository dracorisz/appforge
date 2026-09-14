import React from "react";

type HeadingLevel = "h1" | "h2" | "h3";
type HeadingScale = "hero" | "title" | "compact";

const titleClasses: Record<HeadingScale, string> = {
  hero: "text-5xl font-semibold tracking-tight",
  title: "text-lg font-semibold tracking-tight",
  compact: "text-sm font-semibold",
};

export function Heading({ title, description, icon, actions, level = "h1", scale = "title", className = "" }: { title: React.ReactNode; description?: React.ReactNode; icon?: React.ReactNode; actions?: React.ReactNode; level?: HeadingLevel; scale?: HeadingScale; className?: string }) {
  const Tag = level;
  return (
    <header className={`flex min-w-0 flex-col gap-2 ${className}`}>
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          {icon && <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/50 text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
          <Tag className={`min-w-0 text-foreground ${titleClasses[scale]}`}>{title}</Tag>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {description && <div className="max-w-3xl text-sm text-muted-foreground text-left">{description}</div>}
    </header>
  );
}
