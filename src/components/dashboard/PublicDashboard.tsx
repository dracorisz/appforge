import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Edit2, LayoutGrid, RotateCcw, Save, Search, Star, Wrench, X } from "lucide-react";
import { Button, Card, Input, Switch, Tabs } from "@/components/ui";
import type { AppState } from "@/types";
import type { AppDefinition, CategoryDefinition } from "@/lib/registry";
import { getAllApps, getAppsByCategory, searchApps } from "@/lib/registry";
import { DragonArenaIcon } from "./DragonArenaIcon";
import { appSidebarPreferenceKey, isAppVisibleInSidebar, isCategoryVisibleInSidebar, loadCategoryOverrides, resetCategoryOverride, restoreDefaultSidebarApps, restoreDefaultSidebarCategories, resolveCategories, subscribeCategoryOverrides, updateCategoryOverride } from "@/lib/categories";
import * as Icons from "lucide-react";

function AppIcon({ app, className = "h-5 w-5" }: { app: Pick<AppDefinition, "id" | "icon">; className?: string }) {
  if (app.id === "ai-dragon-arena") return <DragonArenaIcon className={className} />;
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[app.icon] || Wrench;
  return <Icon className={className} />;
}

function ToolCard({ app, favorite, onFavorite, onOpen }: { app: AppDefinition; favorite: boolean; onFavorite: () => void; onOpen: () => void }) {
  return (
    <Card className="flex min-h-32 flex-col overflow-hidden p-2 transition-colors hover:border-foreground/15">
      {app.coverImage && <img src={app.coverImage} alt="" className="h-28 w-full object-cover" loading="lazy" />}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background/45">
            <AppIcon app={app} />
          </span>
          <Button type="button" aria-label={favorite ? `Remove ${app.name} from favorites` : `Add ${app.name} to favorites`} onClick={onFavorite} className={`rounded-xl p-2 hover:bg-accent ${favorite ? "text-warning" : "text-muted-foreground hover:text-foreground"}`}>
            <Star className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
          </Button>
        </div>
        <div className="mt-4 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{app.name}</h3>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{app.description}</p>
        </div>
        <div className="mt-4 flex min-h-9 items-center justify-end border-t border-border/60 pt-4">
          <Button type="button" onClick={onOpen} variant="ghost" className="justify-end hover:text-primary">
            Open <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function WorkspaceEditor({ apps, categories }: { apps: AppDefinition[]; categories: CategoryDefinition[] }) {
  const [, refresh] = React.useReducer((value) => value + 1, 0);
  const [editing, setEditing] = React.useState<CategoryDefinition | null>(null);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  React.useEffect(() => subscribeCategoryOverrides(refresh), []);
  const overrides = loadCategoryOverrides();

  return (
    <div className="space-y-4">
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Sidebar shortcuts</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose what stays pinned.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={restoreDefaultSidebarCategories}>
            <RotateCcw className="h-4 w-4" /> Categories
          </Button>
          <Button variant="secondary" size="sm" onClick={restoreDefaultSidebarApps}>
            <RotateCcw className="h-4 w-4" /> Apps
          </Button>
        </div>
      </Card>

      <section>
        <h2 className="mb-4 text-sm font-semibold">Categories</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const visible = isCategoryVisibleInSidebar(category.id, overrides[category.id]);
            return (
              <Card key={category.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{category.name}</div>
                    <div className="mt-2 truncate text-sm text-muted-foreground">{category.description}</div>
                  </div>
                  <Switch checked={visible} onCheckedChange={(checked) => updateCategoryOverride(category.id, { visibleInSidebar: checked })} label={`${visible ? "Hide" : "Show"} ${category.name}`} />
                </div>
                <Button
                  onClick={() => {
                    setEditing(category);
                    setName(category.name);
                    setDescription(category.description);
                  }}
                  className="mt-4 text-muted-foreground hover:text-foreground"
                >
                  <Edit2 className="h-4 w-4" /> Edit label
                </Button>
              </Card>
            );
          })}
        </div>
      </section>

      {editing && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Edit category</h3>
            <Button onClick={() => setEditing(null)} className="p-2 text-muted-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Input label="Name" value={name} onChange={(event) => setName(event.target.value)} />
            <Input label="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                if (!editing || !name.trim()) return;
                updateCategoryOverride(editing.id, { name: name.trim(), description: description.trim() });
                setEditing(null);
              }}
            >
              <Save className="h-4 w-4" /> Save
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                resetCategoryOverride(editing.id);
                setEditing(null);
              }}
            >
              Reset
            </Button>
          </div>
        </Card>
      )}

      <section>
        <h2 className="mb-4 text-sm font-semibold">Apps</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {apps.map((app) => {
            const key = appSidebarPreferenceKey(app.id);
            const visible = isAppVisibleInSidebar(app.id, overrides[key]);
            return (
              <Card key={app.id} className="flex items-center gap-4 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60">
                  <AppIcon app={app} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{app.name}</div>
                  <div className="text-sm text-muted-foreground">{app.category}</div>
                </div>
                <Switch checked={visible} onCheckedChange={(checked) => updateCategoryOverride(key, { visibleInSidebar: checked })} label={`${visible ? "Hide" : "Show"} ${app.name}`} />
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function PublicDashboard({ state, onOpenApp, onToggleFavorite }: { state: AppState; onOpenApp?: (appId: string) => void; onToggleFavorite?: (appId: string) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const routeSearch = typeof (location.state as { appSearch?: unknown } | null)?.appSearch === "string" ? String((location.state as { appSearch: string }).appSearch) : "";
  const [query, setQuery] = React.useState(routeSearch);
  const [, refreshCategories] = React.useReducer((value) => value + 1, 0);
  const apps = getAllApps().filter((app) => app.status !== "deprecated");
  const categories = resolveCategories();
  const favorites = state.favorites || [];
  const recentApps = (state.recentApps || []).map((id) => apps.find((app) => app.id === id)).filter((app): app is AppDefinition => Boolean(app));
  const categoryId = location.pathname.match(/^\/category\/(.+)$/)?.[1];
  const selectedCategory = categoryId ? categories.find((category) => category.id === categoryId) : undefined;
  const isWorkspace = location.pathname === "/workspace" || location.pathname === "/categories";
  const isRecent = location.pathname === "/recent";
  const isFavorites = location.pathname === "/favorites";
  const isDashboard = location.pathname === "/";

  React.useEffect(() => {
    const unsubscribe = subscribeCategoryOverrides(refreshCategories);
    window.addEventListener("appforge:app-overrides-updated", refreshCategories);
    return () => {
      unsubscribe();
      window.removeEventListener("appforge:app-overrides-updated", refreshCategories);
    };
  }, []);
  React.useEffect(() => {
    setQuery(routeSearch);
  }, [routeSearch]);

  let visibleApps = apps;
  let title = "All apps";
  if (isRecent) {
    visibleApps = recentApps;
    title = "Recent";
  } else if (isFavorites) {
    visibleApps = apps.filter((app) => favorites.includes(app.id));
    title = "Favorites";
  } else if (selectedCategory) {
    visibleApps = getAppsByCategory(selectedCategory.id);
    title = selectedCategory.name;
  }
  if (query.trim() && !isWorkspace) {
    const ids = new Set(searchApps(query).map((app) => app.id));
    visibleApps = visibleApps.filter((app) => ids.has(app.id));
    title = "Search results";
  }

  const updateSearch = (value: string) => {
    setQuery(value);
    if (isDashboard && value.trim()) navigate("/apps", { replace: true, state: { appSearch: value } });
  };
  const openApp = (app: AppDefinition) => {
    onOpenApp?.(app.id);
    navigate(app.route);
  };

  return (
    <div className="space-y-4 pb-8">
      <section className="surface-card rounded-xl border p-4 sm:p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {" "}
              {/* design-xs-ok: compact section eyebrow */}
              <LayoutGrid className="h-4 w-4" /> AppForge
            </div>
            <h1 className="mt-2 text-lg font-semibold tracking-tight sm:text-lg">{isWorkspace ? "Workspace" : isDashboard ? "Dashboard" : title}</h1>
          </div>
        </div>
        {!isWorkspace && (
          <div className="relative mt-4 max-w-3xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search apps…"
              className="h-11 w-full rounded-xl border border-input bg-background/55 pl-8 pr-8 text-sm outline-none focus:ring-0 focus:ring-ring/25 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <Button type="button" onClick={() => updateSearch("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </section>

      <Tabs
        tabs={[
          { id: "/", label: "Dashboard" },
          { id: "/recent", label: "Recent" },
          { id: "/favorites", label: "Favorites" },
          { id: "/workspace", label: "Workspace" },
        ]}
        active={location.pathname === "/categories" ? "/workspace" : location.pathname}
        onChange={(path) => navigate(path)}
        ariaLabel="Dashboard sections"
      />

      {isWorkspace ? (
        <WorkspaceEditor apps={apps} categories={categories} />
      ) : (
        <>
          {isDashboard && !query && recentApps.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Recent</h2>
                <Button onClick={() => navigate("/recent")} className="text-muted-foreground hover:text-foreground">
                  View all
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {recentApps.slice(0, 3).map((app) => (
                  <ToolCard key={app.id} app={app} favorite={favorites.includes(app.id)} onFavorite={() => onToggleFavorite?.(app.id)} onOpen={() => openApp(app)} />
                ))}
              </div>
            </section>
          )}
          {isDashboard && !query && (
            <section>
              <h2 className="mb-4 text-sm font-semibold">Categories</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categories
                  .filter((category) => getAppsByCategory(category.id).length > 0)
                  .map((category) => (
                    <Button key={category.id} onClick={() => navigate(`/category/${category.id}`)} className="flex justify-start border-border/60 p-4 text-left">
                      <span>{category.name}</span>
                      <span className="ml-auto text-sm text-muted-foreground">{getAppsByCategory(category.id).length}</span>
                    </Button>
                  ))}
              </div>
            </section>
          )}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{title}</h2>
              {query && <span className="text-sm text-muted-foreground">{visibleApps.length} results</span>}
            </div>
            {visibleApps.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleApps.map((app) => (
                  <ToolCard key={app.id} app={app} favorite={favorites.includes(app.id)} onFavorite={() => onToggleFavorite?.(app.id)} onOpen={() => openApp(app)} />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center text-sm text-muted-foreground">No matching apps.</Card>
            )}
          </section>
        </>
      )}
    </div>
  );
}
