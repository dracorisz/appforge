import { AppHeading } from "@/components/layout/AppHeading";
import React from "react";
import { Copy, Download, Heart, Search, Star } from "lucide-react";
import type { IconType } from "react-icons";

const PACKS = {
  ai: { label: "Ant Design Icons", load: () => import("react-icons/ai") },
  bi: { label: "Bootstrap Icons", load: () => import("react-icons/bi") },
  bs: { label: "Bootstrap / misc", load: () => import("react-icons/bs") },
  cg: { label: "css.gg", load: () => import("react-icons/cg") },
  ci: { label: "Circum Icons", load: () => import("react-icons/ci") },
  di: { label: "Devicons", load: () => import("react-icons/di") },
  fa: { label: "Font Awesome 5", load: () => import("react-icons/fa") },
  fa6: { label: "Font Awesome 6", load: () => import("react-icons/fa6") },
  fc: { label: "Flat Color Icons", load: () => import("react-icons/fc") },
  fi: { label: "Feather", load: () => import("react-icons/fi") },
  gi: { label: "Game Icons", load: () => import("react-icons/gi") },
  go: { label: "Octicons", load: () => import("react-icons/go") },
  gr: { label: "Grommet Icons", load: () => import("react-icons/gr") },
  hi: { label: "Heroicons 1", load: () => import("react-icons/hi") },
  hi2: { label: "Heroicons 2", load: () => import("react-icons/hi2") },
  im: { label: "IcoMoon Free", load: () => import("react-icons/im") },
  io: { label: "Ionicons 4", load: () => import("react-icons/io") },
  io5: { label: "Ionicons 5", load: () => import("react-icons/io5") },
  lia: { label: "Line Awesome", load: () => import("react-icons/lia") },
  lu: { label: "Lucide", load: () => import("react-icons/lu") },
  md: { label: "Material Design", load: () => import("react-icons/md") },
  pi: { label: "Phosphor", load: () => import("react-icons/pi") },
  ri: { label: "Remix Icons", load: () => import("react-icons/ri") },
  rx: { label: "Radix Icons", load: () => import("react-icons/rx") },
  si: { label: "Simple Icons", load: () => import("react-icons/si") },
  sl: { label: "Simple Line Icons", load: () => import("react-icons/sl") },
  tb: { label: "Tabler Icons", load: () => import("react-icons/tb") },
  tfi: { label: "Themify Icons", load: () => import("react-icons/tfi") },
  ti: { label: "Typicons", load: () => import("react-icons/ti") },
  vsc: { label: "VS Code Icons", load: () => import("react-icons/vsc") },
  wi: { label: "Weather Icons", load: () => import("react-icons/wi") },
} as const;

type PackKey = keyof typeof PACKS;
type IconRecord = { name: string; pack: PackKey; Component: IconType };

const FAVORITES_KEY = "appforge-svg-icons-favorites-v1";
const RECENTS_KEY = "appforge-svg-icons-recents-v1";

const loadStored = (key: string) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 500) : [];
  } catch {
    return [];
  }
};

const saveStored = (key: string, value: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* optional local preference */
  }
};
const iconId = (pack: PackKey, name: string) => `${pack}:${name}`;

export default function SvgIconsBrowser() {
  const [pack, setPack] = React.useState<PackKey>("lu");
  const [query, setQuery] = React.useState("");
  const [icons, setIcons] = React.useState<IconRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [visible, setVisible] = React.useState(120);
  const [size, setSize] = React.useState(28);
  const [scope, setScope] = React.useState<"all" | "favorites" | "recent">("all");
  const [favorites, setFavorites] = React.useState<string[]>(() => loadStored(FAVORITES_KEY));
  const [recents, setRecents] = React.useState<string[]>(() => loadStored(RECENTS_KEY));
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setVisible(120);
    setMessage("");
    PACKS[pack]
      .load()
      .then((module) => {
        if (cancelled) return;
        const next = Object.entries(module)
          .filter((entry): entry is [string, IconType] => /^([A-Z][A-Za-z0-9]*)$/.test(entry[0]) && typeof entry[1] === "function")
          .map(([name, Component]) => ({ name, pack, Component }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setIcons(next);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setIcons([]);
          setLoading(false);
          setMessage(`Could not load ${PACKS[pack].label}.`);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pack]);

  React.useEffect(() => {
    saveStored(FAVORITES_KEY, favorites);
  }, [favorites]);
  React.useEffect(() => {
    saveStored(RECENTS_KEY, recents);
  }, [recents]);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return icons
      .filter((icon) => {
        const id = iconId(icon.pack, icon.name);
        if (scope === "favorites" && !favorites.includes(id)) return false;
        if (scope === "recent" && !recents.includes(id)) return false;
        return !needle || icon.name.toLowerCase().includes(needle);
      })
      .sort((a, b) => (scope === "recent" ? recents.indexOf(iconId(a.pack, a.name)) - recents.indexOf(iconId(b.pack, b.name)) : a.name.localeCompare(b.name)));
  }, [favorites, icons, query, recents, scope]);

  const remember = React.useCallback((icon: IconRecord) => {
    const id = iconId(icon.pack, icon.name);
    setRecents((current) => [id, ...current.filter((item) => item !== id)].slice(0, 24));
  }, []);

  const copyText = async (value: string, success: string, icon: IconRecord) => {
    try {
      await navigator.clipboard.writeText(value);
      remember(icon);
      setMessage(success);
    } catch {
      setMessage("Clipboard access was blocked by the browser.");
    }
  };

  const copyImport = async (icon: IconRecord) => copyText(`import { ${icon.name} } from 'react-icons/${icon.pack}'`, "React import copied.", icon);
  const copyJsx = async (icon: IconRecord) => copyText(`<${icon.name} size={24} />`, "JSX usage copied.", icon);

  const getSvgMarkup = async (icon: IconRecord) => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    return renderToStaticMarkup(React.createElement(icon.Component, { size: 512, title: icon.name }));
  };

  const copySvg = async (icon: IconRecord) => {
    try {
      const svg = await getSvgMarkup(icon);
      await copyText(svg, "Rendered SVG copied. Keep the upstream icon-pack license/attribution requirements.", icon);
    } catch {
      setMessage("Could not render or copy this SVG.");
    }
  };

  const downloadSvg = async (icon: IconRecord) => {
    try {
      const svg = await getSvgMarkup(icon);
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${icon.name}.svg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      remember(icon);
      setMessage("SVG downloaded. Review the upstream pack license before redistribution.");
    } catch {
      setMessage("Could not render or download this SVG.");
    }
  };

  const toggleFavorite = (icon: IconRecord) => {
    const id = iconId(icon.pack, icon.name);
    setFavorites((current) => (current.includes(id) ? current.filter((item) => item !== id) : [id, ...current].slice(0, 500)));
    remember(icon);
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-4">
      <section className="surface-card rounded-xl border p-4 sm:p-4">
        <AppHeading />
        <div className="grid gap-4 md:grid-cols-[minmax(220px,0.45fr)_minmax(260px,1fr)_180px]">
          <label className="grid gap-2 text-sm font-medium">
            Icon pack
            <select value={pack} onChange={(event) => setPack(event.target.value as PackKey)} className="h-11 rounded-xl border bg-background px-4">
              {Object.entries(PACKS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Search component name
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                maxLength={100}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setVisible(120);
                }}
                placeholder="Search e.g. arrow, github, cloud…"
                className="h-11 w-full rounded-xl border bg-background pl-8 pr-4 hover:cursor-pointer  "
              />
            </span>
          </label>
          <label className="grid gap-2 text-sm font-medium grid-cols-2">
            Preview size <span className="font-normal text-muted-foreground">{size}px</span>
            <input type="range" min="18" max="64" className="col-span-2 -mt-8" value={size} onChange={(event) => setSize(Number(event.target.value))} />
          </label>
        </div>
        <div className="flex justify-between">
          <div className="flex mt-4 flex-wrap gap-2">
            {(["all", "favorites", "recent"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setScope(value);
                  setVisible(120);
                }}
                className={`rounded-xl border px-4 py-2 text-sm font-medium hover:cursor-pointer capitalize ${scope === value ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {value === "favorites" ? `Favorites (${favorites.length})` : value === "recent" ? `Recent (${recents.length})` : "All icons"}
              </button>
            ))}
          </div>
          <div aria-live="polite" className="min-h-9 px-2 pt-4 text-sm text-muted-foreground">
            {loading ? `Loading ${PACKS[pack].label}…` : message}
          </div>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6" aria-busy={loading}>
        {filtered.slice(0, visible).map((icon) => {
          const id = iconId(icon.pack, icon.name);
          const favorite = favorites.includes(id);
          return (
            <article key={id} className="surface-card group flex min-h-32 flex-col rounded-xl border p-4">
              <div className="flex min-h-24 flex-1 items-center justify-center rounded-xl bg-background/60">
                <icon.Component size={size} aria-hidden="true" />
              </div>
              <div className="mt-4 min-w-0">
                <div className="truncate text-sm font-semibold" title={icon.name}>
                  {icon.name}
                </div>
                <div className="text-sm text-muted-foreground">react-icons/{icon.pack}</div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                <button type="button" onClick={() => void copyImport(icon)} className="grid place-items-center rounded-xl border hover:bg-accent" title="Copy import">
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => void copyJsx(icon)} className="grid place-items-center rounded-xl border text-sm font-semibold hover:bg-accent" title="Copy JSX">
                  JSX
                </button>
                <button type="button" onClick={() => void copySvg(icon)} className="grid place-items-center rounded-xl border text-sm font-semibold hover:bg-accent" title="Copy rendered SVG">
                  SVG
                </button>
                <button type="button" onClick={() => toggleFavorite(icon)} className="grid place-items-center rounded-xl border hover:bg-accent" title={favorite ? "Remove favorite" : "Favorite"}>
                  {favorite ? <Heart className="h-3.5 w-3.5 fill-current" /> : <Star className="h-3.5 w-3.5" />}
                </button>
              </div>
              <button type="button" onClick={() => void downloadSvg(icon)} className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl border text-sm font-medium hover:bg-accent">
                <Download className="h-3.5 w-3.5" /> Download SVG
              </button>
            </article>
          );
        })}
      </section>

      {!loading && filtered.length === 0 && <div className="surface-card rounded-xl border p-8 text-center text-sm text-muted-foreground">No icons in this pack match “{query}”.</div>}
      {visible < filtered.length && (
        <div className="mt-4 flex justify-center">
          <button type="button" onClick={() => setVisible((value) => value + 120)} className="rounded-xl border bg-background px-4 text-sm font-semibold hover:bg-accent">
            Load 120 more
          </button>
        </div>
      )}

      <section className="mt-4 rounded-xl border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Licensing:</strong> react-icons aggregates upstream icon projects with different licenses. AppForge does not own those icon sets. Before redistributing a copied/exported SVG, review the source pack license and attribution requirements published by
        react-icons/upstream. Brand icons may also be subject to trademark rules.
      </section>
    </div>
  );
}
