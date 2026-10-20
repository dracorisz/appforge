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
  const compact = scale === "compact";
  return (
    <header className={`flex min-w-0 flex-col ${compact ? "gap-2" : "gap-2"} ${className}`}>
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          {icon && <span className={`flex shrink-0 items-center justify-center border border-border bg-muted/50 text-muted-foreground ${compact ? "h-7 w-7 rounded-xl [&>svg]:h-3.5 [&>svg]:w-3.5" : "h-9 w-9 rounded-xl [&>svg]:h-4 [&>svg]:w-4"}`}>{icon}</span>}
          <Tag className={`min-w-0 text-foreground ${titleClasses[scale]}`}>{title}</Tag>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {description && <div className={`max-w-3xl text-muted-foreground text-left ${compact ? "text-sm " : "text-sm"}`}>{description}</div>}
    </header>
  );
}
