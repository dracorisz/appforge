import { AppHeading } from "@/components/layout/AppHeading";
import React from "react";
import { Button, Card, Input, Select } from "@/components/ui";
import { AlertCircle, ChevronLeft, ChevronRight, LayoutGrid, List, RefreshCw, Search, Star, TrendingDown, TrendingUp } from "lucide-react";

export interface CryptoCoin {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
  image?: string;
}

type Provider = "auto" | "coingecko" | "coinpaprika";
type SortBy = "marketCap" | "price" | "change24h" | "name";
type ViewMode = "list" | "grid";
type MarketView = "all" | "gainers" | "losers";

interface CryptoResponse {
  ok: boolean;
  provider: string;
  updatedAt: string;
  coins: CryptoCoin[];
  error?: string;
  details?: string[];
}

const WATCHLIST_KEY = "appforge-crypto-watchlist-v2";
const PAGE_SIZE = 12;

const formatUsd = (value: number) => {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) < 0.01) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 8 })}`;
  if (Math.abs(value) < 1) return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatCompactUsd = (value?: number) => {
  if (!value || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
};

const localLogo = (coin: CryptoCoin) => `/crypto-logos/${coin.id.toLowerCase().replace(/\s+/g, "-")}-${coin.symbol.toLowerCase()}.png`;

export function PF_CryptoTrack() {
  const [coins, setCoins] = React.useState<CryptoCoin[]>([]);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [provider, setProvider] = React.useState<Provider>("auto");
  const [resolvedProvider, setResolvedProvider] = React.useState("");
  const [updatedAt, setUpdatedAt] = React.useState("");
  const [viewMode, setViewMode] = React.useState<ViewMode>("list");
  const [sortBy, setSortBy] = React.useState<SortBy>("marketCap");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const [watchlistOnly, setWatchlistOnly] = React.useState(false);
  const [marketView, setMarketView] = React.useState<MarketView>("all");
  const [watchlist, setWatchlist] = React.useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(WATCHLIST_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [failedImages, setFailedImages] = React.useState<Set<string>>(new Set());

  const fetchCoins = React.useCallback(
    async (selectedProvider: Provider = provider) => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/crypto?provider=${encodeURIComponent(selectedProvider)}`);
        const data = (await response.json()) as CryptoResponse;
        if (!response.ok || !data.ok) {
          throw new Error(data.error || `Market-data request failed with HTTP ${response.status}`);
        }
        setCoins(data.coins || []);
        setResolvedProvider(data.provider || "");
        setUpdatedAt(data.updatedAt || "");
        setPage(1);
      } catch (requestError) {
        setCoins([]);
        setResolvedProvider("");
        setError(requestError instanceof Error ? requestError.message : "Could not load market data.");
      } finally {
        setLoading(false);
      }
    },
    [provider],
  );

  React.useEffect(() => {
    fetchCoins("auto");
  }, [fetchCoins]);

  React.useEffect(() => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(Array.from(watchlist)));
  }, [watchlist]);

  const toggleWatchlist = (coinId: string) => {
    setWatchlist((current) => {
      const next = new Set(current);
      if (next.has(coinId)) next.delete(coinId);
      else next.add(coinId);
      return next;
    });
  };

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return coins.filter((coin) => {
      if (watchlistOnly && !watchlist.has(coin.id)) return false;
      if (marketView === "gainers" && coin.change24h <= 0) return false;
      if (marketView === "losers" && coin.change24h >= 0) return false;
      if (!needle) return true;
      return coin.name.toLowerCase().includes(needle) || coin.symbol.toLowerCase().includes(needle);
    });
  }, [coins, marketView, query, watchlistOnly, watchlist]);

  const sorted = React.useMemo(() => {
    const next = [...filtered];
    next.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") comparison = a.name.localeCompare(b.name);
      if (sortBy === "price") comparison = a.price - b.price;
      if (sortBy === "change24h") comparison = a.change24h - b.change24h;
      if (sortBy === "marketCap") comparison = (a.marketCap || 0) - (b.marketCap || 0);
      return sortDir === "asc" ? comparison : -comparison;
    });
    return next;
  }, [filtered, sortBy, sortDir]);

  React.useEffect(() => {
    setPage(1);
  }, [marketView, query, watchlistOnly, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const visible = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const renderLogo = (coin: CryptoCoin) => {
    if (failedImages.has(coin.id)) {
      return <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-sm font-semibold text-foreground">{coin.symbol.slice(0, 3)}</div>;
    }

    return (
      <img
        src={coin.image || localLogo(coin)}
        alt=""
        loading="lazy"
        className="h-9 w-9 rounded-xl object-contain"
        onError={(event) => {
          if (coin.image && event.currentTarget.src !== new URL(localLogo(coin), window.location.origin).href) {
            event.currentTarget.src = localLogo(coin);
            return;
          }
          setFailedImages((current) => new Set([...current, coin.id]));
        }}
      />
    );
  };

  return (
    <div className="space-y-4">
      <AppHeading />

      <Card>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Search market</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Bitcoin, ETH, SOL…" className="pl-8" />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Provider</label>
            <Select
              value={provider}
              onChange={(event) => {
                const next = event.target.value as Provider;
                setProvider(next);
                fetchCoins(next);
              }}
              className="h-9 rounded-xl border border-input bg-background px-4 text-sm text-foreground"
            >
              <option value="auto">Auto fallback</option>
              <option value="coingecko">CoinGecko</option>
              <option value="coinpaprika">CoinPaprika</option>
            </Select>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border p-2">
            <Button onClick={() => setViewMode("list")} aria-label="List view" className={`rounded-xl p-2 ${viewMode === "list" ? "bg-accent" : "text-muted-foreground hover:text-foreground"}`}>
              <List className="h-4 w-4" />
            </Button>
            <Button onClick={() => setViewMode("grid")} aria-label="Grid view" className={`rounded-xl p-2 ${viewMode === "grid" ? "bg-accent" : "text-muted-foreground hover:text-foreground"}`}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => fetchCoins(provider)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button
            type="button"
            onClick={() => setWatchlistOnly((value) => !value)}
            className={`inline-flex items-center gap-2 rounded-xl border px-2 py-2 text-sm font-medium ${watchlistOnly ? "border-warning/40 bg-warning/10 text-warning dark:text-warning" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            <Star className={`h-4 w-4 ${watchlistOnly ? "fill-current" : ""}`} /> Watchlist {watchlist.size}
          </Button>
          <div className="flex items-center gap-2 rounded-xl border border-border p-2">
            {(["all", "gainers", "losers"] as MarketView[]).map((value) => (
              <Button key={value} type="button" onClick={() => setMarketView(value)} className={`rounded-xl px-2 py-2 text-sm font-medium capitalize ${marketView === value ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {value}
              </Button>
            ))}
          </div>
          <span className="ml-2 text-sm text-muted-foreground">Sort:</span>
          <Select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)} className="rounded-xl border border-input bg-background px-2 py-2 text-sm text-foreground">
            <option value="marketCap">Market cap</option>
            <option value="price">Price</option>
            <option value="change24h">24h change</option>
            <option value="name">Name</option>
          </Select>
          <Button onClick={() => setSortDir((value) => (value === "asc" ? "desc" : "asc"))} className="rounded-xl border border-border px-2 py-2 text-sm text-muted-foreground hover:text-foreground">
            {sortDir === "desc" ? "Descending" : "Ascending"}
          </Button>
          <div className="ml-auto flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {resolvedProvider && <span>Source: {resolvedProvider}</span>}
            {updatedAt && <span>Updated {new Date(updatedAt).toLocaleTimeString()}</span>}
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive-foreground">
            <AlertCircle className="mt-2 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </Card>

      {loading && coins.length === 0 ? (
        <Card>
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" /> Loading live market data…
          </div>
        </Card>
      ) : visible.length > 0 ? (
        <>
          <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-2"}>
            {visible.map((coin) => {
              const positive = coin.change24h >= 0;
              const watching = watchlist.has(coin.id);

              return viewMode === "grid" ? (
                <Card key={coin.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      {renderLogo(coin)}
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-foreground">{coin.name}</h2>
                        <p className="text-sm font-medium text-muted-foreground">{coin.symbol}</p>
                      </div>
                    </div>
                    <Button onClick={() => toggleWatchlist(coin.id)} aria-label={watching ? "Remove from watchlist" : "Add to watchlist"} className={`rounded-xl p-2 ${watching ? "text-warning" : "text-muted-foreground hover:text-foreground"}`}>
                      <Star className={`h-4 w-4 ${watching ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                  <p className="mt-4 text-lg font-semibold tracking-tight text-foreground">{formatUsd(coin.price)}</p>
                  <div className={`mt-2 inline-flex items-center gap-2 text-sm font-medium ${positive ? "text-success dark:text-success" : "text-destructive dark:text-destructive"}`}>
                    {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {positive ? "+" : ""}
                    {coin.change24h.toFixed(2)}%
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
                    <div>
                      <p className="text-sm uppercase tracking-wide text-muted-foreground">Market cap</p>
                      <p className="mt-2 text-sm font-medium text-foreground">{formatCompactUsd(coin.marketCap)}</p>
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-wide text-muted-foreground">24h volume</p>
                      <p className="mt-2 text-sm font-medium text-foreground">{formatCompactUsd(coin.volume24h)}</p>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card key={coin.id} className="p-4">
                  <div className="grid grid-cols-[minmax(160px,1fr)_minmax(100px,.6fr)_minmax(90px,.5fr)_auto] items-center gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      {renderLogo(coin)}
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-foreground">{coin.name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {coin.symbol} · Cap {formatCompactUsd(coin.marketCap)}
                        </p>
                      </div>
                    </div>
                    <p className="text-right text-sm font-semibold text-foreground">{formatUsd(coin.price)}</p>
                    <p className={`flex items-center justify-end gap-2 text-right text-sm font-medium ${positive ? "text-success dark:text-success" : "text-destructive dark:text-destructive"}`}>
                      {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {positive ? "+" : ""}
                      {coin.change24h.toFixed(2)}%
                    </p>
                    <Button onClick={() => toggleWatchlist(coin.id)} aria-label={watching ? "Remove from watchlist" : "Add to watchlist"} className={`rounded-xl p-2 ${watching ? "text-warning" : "text-muted-foreground hover:text-foreground"}`}>
                      <Star className={`h-4 w-4 ${watching ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <Card>
          <div className="py-8 text-center">
            <TrendingUp className="mx-auto h-7 w-7 text-muted-foreground" />
            <h2 className="mt-4 text-sm font-medium text-foreground">{error ? "Market data unavailable" : watchlistOnly ? "Your watchlist is empty" : "No matching assets"}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {error ? "Try Auto fallback again. SSToken will use the next provider when the primary source is unavailable." : watchlistOnly ? "Star assets from the full market list to keep a lightweight watchlist on this device." : "Try a different coin name or symbol."}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
