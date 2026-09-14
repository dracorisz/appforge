import { PublicFooter } from "./PublicFooter";
import React from "react";
import { FileText, Plus } from "lucide-react";
import changelogSource from "../../../CHANGELOG.md?raw";
import { BUILD_INFO } from "@/lib/buildInfo";
import { PublicHeader } from "./PublicHeader";

type ChangelogGroup = { title: string; items: string[] };
type ChangelogRelease = { title: string; groups: ChangelogGroup[] };

function parseChangelog(source: string): ChangelogRelease[] {
  const releases: ChangelogRelease[] = [];
  let release: ChangelogRelease | null = null;
  let group: ChangelogGroup | null = null;
  for (const rawLine of source.split("\n")) {
    const line = rawLine.trim();
    if (line.startsWith("## ")) {
      release = { title: line.slice(3), groups: [] };
      releases.push(release);
      group = null;
      continue;
    }
    if (line.startsWith("### ") && release) {
      group = { title: line.slice(4), items: [] };
      release.groups.push(group);
      continue;
    }
    if (line.startsWith("- ") && group) group.items.push(line.slice(2).replace(/\*\*/g, "").replace(/`/g, ""));
  }
  return releases.filter((item) => item.groups.some((entry) => entry.items.length > 0));
}

export function ChangelogPage() {
  const releases = React.useMemo(() => parseChangelog(changelogSource), []);
  React.useEffect(() => {
    document.title = "AppForge Changelog";
  }, []);
  return (
    <div className="dark flex min-h-dvh flex-col bg-overlay text-foreground" style={{ colorScheme: "dark", "--background": "0 0% 0%" } as React.CSSProperties}>
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-4 lg:px-8">
        <section className="border-b border-border/60 pb-8">
          <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <FileText className="h-4 w-4" /> Release history
          </div>
          <h1 className="mt-4 text-lg font-semibold tracking-[-0.04em] sm:text-5xl">What changed in AppForge.</h1>
          <p className="mt-4 max-w-3xl text-sm text-muted-foreground sm:text-sm">This page is generated from the repository changelog so release notes have one source of truth. Expand only the sections you need.</p>
          <div className="mt-4 text-sm text-muted-foreground">Current app version: v{BUILD_INFO.version}</div>
        </section>
        <div className="space-y-4 py-8">
          {releases.map((release, releaseIndex) => (
            <section key={release.title} className="rounded-xl border border-border/70 bg-background/45 p-4 sm:p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold tracking-[-0.025em] sm:text-lg">{release.title}</h2>
                <span className="text-sm text-muted-foreground">{release.groups.reduce((total, group) => total + group.items.length, 0)} changes</span>
              </div>
              <div className="mt-4 space-y-2">
                {release.groups.map((group, groupIndex) => (
                  <details key={`${release.title}-${group.title}`} open={releaseIndex === 0 && groupIndex === 0} className="group rounded-xl border border-border/60 bg-background/30">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-sm font-semibold outline-none focus-visible:ring-1 focus-visible:ring-ring/25">
                      <span>{group.title}</span>
                      <span className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                        <span>{group.items.length}</span>
                        <Plus className="h-4 w-4 group-open:rotate-45" />
                      </span>
                    </summary>
                    <ul className="border-t border-border/60 px-4 py-4 text-sm text-muted-foreground">
                      {group.items.map((item) => (
                        <li key={item} className="flex gap-2 py-2">
                          <span aria-hidden="true">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
