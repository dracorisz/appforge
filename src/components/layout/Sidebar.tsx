import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ArrowLeftRight,
  Binary,
  Braces,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Code,
  FileCode,
  Hash,
  HeartHandshake,
  Image as ImageIcon,
  LayoutDashboard,
  Lock,
  LogOut,
  Palette,
  QrCode,
  Regex,
  Search,
  Settings,
  Sliders,
  Sparkles,
  Table2,
  Type,
  Users,
  Video,
  Wrench,
  X,
} from "lucide-react";
import { getAllApps, getAppsByCategory, searchApps } from "@/lib/registry";
import { appSidebarPreferenceKey, isAppVisibleInSidebar, isCategoryVisibleInSidebar, loadCategoryOverrides, resolveCategories, subscribeCategoryOverrides } from "@/lib/categories";
import { useAuth } from "@/auth/AuthProvider";
import { ensureProfile } from "@/lib/account";
import { DragonArenaIcon } from "@/components/dashboard/DragonArenaIcon";
import { Button, SearchInput } from "@/components/ui";
import { SidebarWeather } from "./SidebarWeather";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = { ArrowLeftRight, Binary, Braces, Calendar, CloudSun, Code, FileCode, Hash, Image: ImageIcon, Lock, Palette, QrCode, Regex, Search, Sparkles, Table2, Type, Video, Wrench, DragonArena: DragonArenaIcon };
const coreItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: "people", label: "People", icon: Users, path: "/people" },
];
const navClass = (active: boolean) => `flex items-center gap-4 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"}`;
const collapsedNavClass = "w-full justify-center px-2 group-hover/sidebar:justify-start group-hover/sidebar:px-4";
const collapsedLabelClass = "pointer-events-none hidden whitespace-nowrap pr-4 text-sm font-medium group-hover/sidebar:block";

export function Sidebar({ onClose, collapsed: collapsedProp, onToggleCollapse }: { onClose?: () => void; collapsed?: boolean; onToggleCollapse?: () => void }) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [internalCollapsed, setInternalCollapsed] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [signingOut, setSigningOut] = React.useState(false);
  const [signOutError, setSignOutError] = React.useState("");
  const [profileAvatar, setProfileAvatar] = React.useState<string | null>(null);
  const [profileName, setProfileName] = React.useState<string | null>(null);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const accountMenuRef = React.useRef<HTMLDivElement | null>(null);
  const [, refreshWorkspace] = React.useReducer((value) => value + 1, 0);

  React.useEffect(() => subscribeCategoryOverrides(refreshWorkspace), []);
  React.useEffect(() => {
    setSearchQuery("");
    setSignOutError("");
  }, [location.pathname]);
  React.useEffect(() => {
    let cancelled = false;
    if (!user) {
      setProfileAvatar(null);
      setProfileName(null);
      return undefined;
    }
    void ensureProfile(user)
      .then((profile) => {
        if (!cancelled) {
          setProfileAvatar(profile.avatar_url || null);
          setProfileName(profile.display_name || profile.username || null);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user, location.pathname]);

  const isCollapsed = collapsedProp ?? internalCollapsed;
  const searchResults = searchQuery.trim().length > 1 ? searchApps(searchQuery) : [];
  const categoryOverrides = loadCategoryOverrides();
  const sidebarCategories = resolveCategories(categoryOverrides).filter((category) => isCategoryVisibleInSidebar(category.id, categoryOverrides[category.id]) && getAppsByCategory(category.id).length > 0);
  const sidebarApps = getAllApps().filter((app) => app.status !== "deprecated" && isAppVisibleInSidebar(app.id, categoryOverrides[appSidebarPreferenceKey(app.id)]));
  const avatar = profileAvatar || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const displayName = profileName || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "Account";
  const initial = String(displayName).trim().charAt(0).toUpperCase() || "A";
  const toggleCollapse = () => {
    if (onToggleCollapse) onToggleCollapse();
    else setInternalCollapsed((value) => !value);
  };
  React.useEffect(() => {
    if (!accountOpen) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, [accountOpen]);

  const handleSignOut = async () => {
    setAccountOpen(false);
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError("");
    try {
      await signOut();
      onClose?.();
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : "Could not sign out. Try again.");
    } finally {
      setSigningOut(false);
    }
  };
  const closeSearchAndSidebar = () => {
    setSearchQuery("");
    onClose?.();
  };
  const asideWidth = onClose ? "w-screen max-w-none border-r-0" : isCollapsed ? "w-16 border-r border-border hover:w-64" : "w-64 border-r border-border";
  const isCoreActive = (path: string) => (path === "/settings" ? location.pathname.startsWith("/settings") : location.pathname === path);
  const collapsedLinkClass = (active: boolean) => `${navClass(active)} ${isCollapsed ? collapsedNavClass : ""}`;

  return (
    <aside className={`group/sidebar relative z-40 flex h-full flex-col overflow-visible bg-background/92 backdrop-blur-xl transition-[width,transform,opacity] duration-200 ease-out ${asideWidth}`}>
      <div className={`flex items-center gap-2 py-4 ${isCollapsed ? "flex-col px-2" : "px-4"}`}>
        {isCollapsed ? (
          <NavLink to="/" aria-label="AppForge home" className="shrink-0">
            <img src="/favicon.svg" alt="" className="h-6 w-6" />
          </NavLink>
        ) : (
          <NavLink to="/" onClick={onClose} className="flex min-w-0 items-center gap-2">
            <img src="/favicon.svg" alt="AppForge" className="h-9 w-9 shrink-0" />
            <h1 className="truncate text-sm font-semibold text-foreground">AppForge</h1>
          </NavLink>
        )}
        {onClose ? (
          <Button onClick={onClose} className="ml-auto rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close navigation">
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={toggleCollapse} className={`${isCollapsed ? "" : "ml-auto"} rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground`} aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>
      {!isCollapsed && (
        <div className="px-4 pb-2">
          <div className="relative">
            <SearchInput value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onClear={() => setSearchQuery("")} placeholder="Search apps…" aria-label="Search apps" />
            {searchResults.length > 0 && (
              <div className="surface-card mt-2 max-h-52 space-y-2 overflow-y-auto rounded-xl border p-2 shadow-xl">
                {searchResults.slice(0, 8).map((app) => {
                  const Icon = iconMap[app.id === "ai-dragon-arena" ? "DragonArena" : app.icon] || Wrench;
                  return (
                    <NavLink key={app.id} to={app.route} onClick={closeSearchAndSidebar} className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{app.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      <nav className={`scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-2 ${isCollapsed ? "px-2" : "px-4"}`}>
        {!isCollapsed && <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">System</h3>}
        <div className="space-y-2">
          {coreItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.id} to={item.path} onClick={onClose} title={isCollapsed ? item.label : undefined} className={collapsedLinkClass(isCoreActive(item.path))}>
                <Icon className="h-4 w-4 shrink-0" />
                {isCollapsed ? <span className={collapsedLabelClass}>{item.label}</span> : <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </div>
        {(sidebarCategories.length > 0 || sidebarApps.length > 0) && (
          <div className="mt-4">
            {!isCollapsed && (
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Workspace</h3>
                <NavLink to="/workspace" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
                  Customize
                </NavLink>
              </div>
            )}
            <div className="space-y-2">
              {sidebarCategories.map((category) => {
                const Icon = iconMap[category.icon] || Wrench;
                const path = `/category/${category.id}`;
                return (
                  <NavLink key={category.id} to={path} onClick={onClose} title={isCollapsed ? category.name : undefined} className={collapsedLinkClass(location.pathname === path)}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {isCollapsed ? <span className={collapsedLabelClass}>{category.name}</span> : <span className="truncate">{category.name}</span>}
                  </NavLink>
                );
              })}
            </div>
            {sidebarApps.length > 0 && (
              <div className={`${sidebarCategories.length > 0 ? "mt-2 " : ""}space-y-2`}>
                {sidebarApps.map((app) => {
                  const Icon = iconMap[app.id === "ai-dragon-arena" ? "DragonArena" : app.icon] || Wrench;
                  return (
                    <NavLink key={app.id} to={app.route} onClick={onClose} title={isCollapsed ? app.name : undefined} className={collapsedLinkClass(location.pathname === app.route)}>
                      <Icon className="h-4 w-4 shrink-0" />
                      {isCollapsed ? <span className={collapsedLabelClass}>{app.name}</span> : <span className="truncate">{app.name}</span>}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>
      {!isCollapsed && (
        <div className="px-4 pb-2">
          <SidebarWeather collapsed={false} />
        </div>
      )}
      <div ref={accountMenuRef} className="relative border-t border-border p-4">
        {user && (
          <>
            {accountOpen && (
              <div className={`absolute bottom-full z-[80] mb-2 rounded-xl border border-border/70 bg-background p-2 shadow-xl ${isCollapsed ? "left-2 w-56" : "left-4 right-4 w-auto"}`}>
                <div className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Appearance</div>
                <div className="grid grid-cols-3 gap-2 px-2 pb-2">
                  {(["light", "dark", "system"] as const).map((mode) => (
                    <Button
                      key={mode}
                      type="button"
                      onClick={() => {
                        localStorage.setItem("appforge-theme", JSON.stringify({ mode }));
                        const dark = mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
                        document.documentElement.classList.toggle("dark", dark);
                        document.documentElement.style.colorScheme = dark ? "dark" : "light";
                        setAccountOpen(false);
                      }}
                      className="rounded-xl px-2 py-2 text-sm capitalize text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      {mode}
                    </Button>
                  ))}
                </div>
                <NavLink
                  to="/settings"
                  onClick={() => {
                    setAccountOpen(false);
                    onClose?.();
                  }}
                  className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Settings className="h-4 w-4" /> Settings
                </NavLink>
                <a href="https://github.com/dracorisz/appforge/issues" target="_blank" rel="noreferrer" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                  <HeartHandshake className="h-4 w-4" /> Support
                </a>
                <Button onClick={() => void handleSignOut()} disabled={signingOut} className="flex w-full items-center justify-start gap-2 rounded-xl px-2 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60">
                  <LogOut className="h-4 w-4" />
                  {signingOut ? "Signing out…" : "Sign out"}
                </Button>
              </div>
            )}
            <Button
              type="button"
              onClick={() => setAccountOpen((value) => !value)}
              className={`flex h-auto max-h-none w-full items-center gap-2 rounded-xl border border-border/60 bg-background/35 px-2 text-left hover:border-foreground/15 ${isCollapsed ? "justify-center group-hover/sidebar:justify-start" : ""}`}
              style={{ paddingBlock: "0.25rem" }}
              title={isCollapsed ? String(displayName) : undefined}
              aria-expanded={accountOpen}
              aria-haspopup="menu"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-accent text-sm font-semibold text-foreground">
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : initial}
              </div>
              <div className={`min-w-0 flex-1 ${isCollapsed ? "hidden group-hover/sidebar:block" : ""}`}>
                <div className="truncate text-sm font-medium text-foreground">{String(displayName)}</div>
                {user.email && <div className="truncate text-sm text-muted-foreground">{user.email}</div>}
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${accountOpen ? "rotate-180" : ""} ${isCollapsed ? "hidden group-hover/sidebar:block" : ""}`} />
            </Button>
          </>
        )}
        {signOutError && !isCollapsed && (
          <div role="alert" className="mt-2 rounded-xl border border-destructive/25 bg-destructive/5 px-2 py-2 text-sm text-destructive">
            {signOutError}
          </div>
        )}
      </div>
    </aside>
  );
}

export function MobileHeader({ onOpen, triggerRef }: { onOpen: () => void; triggerRef?: React.Ref<HTMLButtonElement> }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-xl lg:hidden">
      <Button ref={triggerRef} onClick={onOpen} className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Open navigation">
        <Sliders className="h-4 w-4" />
      </Button>
      <NavLink to="/" className="flex items-center gap-2">
        <img src="/favicon.svg" alt="AppForge" className="h-9 w-9" />
        <span className="text-sm font-semibold text-foreground">AppForge</span>
      </NavLink>
    </header>
  );
}
