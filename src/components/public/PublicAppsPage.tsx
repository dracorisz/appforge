import { PublicFooter } from "./PublicFooter";
import React from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getPublicApps, CATEGORIES } from "@/lib/registry";
import { PublicHeader } from "./PublicHeader";
import { SearchInput, Select } from "@/components/ui";

const categoryName = (id: string) => CATEGORIES.find((category) => category.id === id)?.name || id;

export function PublicAppsPage() {
  const [, refreshRegistry] = React.useReducer((value) => value + 1, 0);
  const apps = getPublicApps().filter((app) => app.status !== "deprecated");
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");
  React.useEffect(() => {
    window.addEventListener("appforge:app-overrides-updated", refreshRegistry);
    return () => window.removeEventListener("appforge:app-overrides-updated", refreshRegistry);
  }, []);
  const categories = React.useMemo(() => Array.from(new Set(apps.map((app) => app.category))).sort((a, b) => categoryName(a).localeCompare(categoryName(b))), [apps]);
  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return apps.filter((app) => {
      if (category !== "all" && app.category !== category) return false;
      if (!needle) return true;
      return [app.name, app.description, app.category, ...app.tags].join(" ").toLowerCase().includes(needle);
    });
  }, [apps, category, query]);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-4 lg:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Apps</div>
          <h1 className="mt-4 text-lg font-semibold tracking-[-0.04em] sm:text-5xl">Useful tools, ready to open.</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">Browse the public AppForge catalog.</p>
        </header>

        <section className="mx-auto mt-8 max-w-3xl border-y border-border/60 py-4" aria-label="Filter apps">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_200px]">
            <SearchInput value={query} onChange={(event) => setQuery(event.target.value)} onClear={() => setQuery("")} placeholder="Search apps…" aria-label="Search apps" />
            <Select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-border bg-secondary px-2 text-sm h-9 outline-none focus:ring-1 focus:ring-ring/30">
              <option value="all">All categories</option>
              {categories.map((id) => (
                <option key={id} value={id}>
                  {categoryName(id)}
                </option>
              ))}
            </Select>
          </div>
          <div className="mt-2 text-center text-sm text-muted-foreground">{visible.length} apps found.</div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {visible.map((app) => (
            <Link
              key={app.id}
              to={app.route}
              className="group flex min-h-32 flex-col rounded-xl border border-border bg-card p-4 transition-[border-color,background-color,box-shadow] hover:border-foreground/20 hover:bg-secondary hover:shadow-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {app.coverImage && <img src={app.coverImage} alt="" className="-mx-4 -mt-4 mb-4 h-24 w-[calc(100%+2rem)] rounded-xl object-cover" loading="lazy" />}
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{app.name}</div>
                <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{categoryName(app.category)}</div> {/* design-xs-ok: compact category label */}
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{app.description}</p>
              <div className="mt-auto flex items-center justify-end pt-4">
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  Open <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </section>
        {!visible.length && <div className="mt-8 rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">No apps match.</div>}
      </main>
      <PublicFooter />
    </div>
  );
}
