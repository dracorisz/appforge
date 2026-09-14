import React from "react";
// @code-scanning/ignore js/xss-through-dom: Project Pulse build data is derived from app registry metadata (trusted source) and rendered via React JSX which auto-escapes all text content.
import { Activity, Boxes, ChevronDown, ChevronUp, CheckCircle2, ExternalLink, Rocket } from "lucide-react";
import { BuildBadge, Button } from "@/components/ui";
import { getAllApps } from "@/lib/registry";

const readinessScore = {
  launched: 100,
  beta: 75,
  building: 45,
  idea: 20,
  deprecated: 0,
} as const;

export function ProjectPulse() {
  const [expanded, setExpanded] = React.useState(false);
  const apps = getAllApps();
  const active = apps.filter((app) => app.status === "launched" || app.status === "beta").length;
  const building = apps.filter((app) => app.status === "building" || app.status === "idea").length;
  const average = apps.length ? Math.round(apps.reduce((sum, app) => sum + readinessScore[app.status], 0) / apps.length) : 0;

  return (
    <div className="mb-4 rounded-xl border border-border/60 bg-background/45 text-sm text-muted-foreground backdrop-blur-lg">
      <Button type="button" className="flex w-full flex-col gap-2 px-0 text-left sm:flex-row sm:items-center sm:justify-between" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
        <div className="flex min-w-0 items-center gap-2 py-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/45">
            <Activity className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <span className="font-medium text-foreground">Project pulse</span>
            <span className="ml-2 hidden sm:inline">Release tracker · {average}% portfolio readiness</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-xl bg-background/45 px-2 py-2">
            <Boxes className="h-3 w-3" />
            {apps.length} tools · {active} active · {building} building
          </span>
          <BuildBadge compact />
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </Button>

      {expanded && (
        <div className="border-t border-border/60 p-4">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium text-foreground">Apps → full-ready PWA</span>
                <span>{apps.length} tracked</span>
              </div>
              <div className="grid max-h-72 gap-2 overflow-y-auto pr-2 sm:grid-cols-2">
                {apps.map((app) => {
                  const score = readinessScore[app.status];
                  return (
                    <a key={app.id} href={app.route} className="rounded-xl border border-border/60 bg-background/50 p-2 transition hover:bg-muted/45">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">{app.name}</div>
                          <div className="mt-2 truncate text-sm">
                            {app.status} · v{app.version}
                          </div>
                        </div>
                        <span className="shrink-0 font-medium text-foreground">{score}%</span>
                      </div>
                      <div className="mt-2 h-1 overflow-hidden rounded-xl bg-muted">
                        <div className="h-full rounded-xl bg-foreground/65" style={{ width: `${score}%` }} />
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/50 p-4">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Rocket className="h-4 w-4" /> Shared release gates
              </div>
              <div className="mt-8 space-y-4">
                {["Installable manifest + icons", "Service-worker app shell", "Responsive tool routes", "GitHub Pages path-safe build", "Registry-backed release status"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-foreground" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-4">
                <a href="https://docs.sstoken.space/PROJECT-PULSE" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-medium text-foreground hover:underline">
                  Live tracking docs <ExternalLink className="h-3 w-3" />
                </a>
                <a href="https://github.com/dracorisz/appforge/issues" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-medium text-foreground hover:underline">
                  GitHub issues <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
