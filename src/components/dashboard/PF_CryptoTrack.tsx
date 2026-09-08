import React from 'react'
import { Card, Button, Input, Badge } from '@/components/ui'
import { TrendingUp, ExternalLink, RefreshCw, AlertCircle, LayoutGrid, List, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

export interface CryptoCoin {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  marketCap?: number
  volume24h?: number
  image?: string
}

const CRYPTO_LOGO_COM = 'https://crypto-logo.com/api/logo'

const getCryptoLogo = (id: string, symbol: string, coinMap?: Map<string, string>) => {
  const sym = symbol.toLowerCase()
  const name = id.toLowerCase()
  if (coinMap) {
    const bySymbol = coinMap.get(`symbol:${sym}`)
    if (bySymbol) return bySymbol
    const byName = coinMap.get(`name:${name}`)
    if (byName) return byName
    const byId = coinMap.get(`slug:${id}`)
    if (byId) return byId
  }
  return `/crypto-logos/${id.toLowerCase().replace(/\s+/g, '-')}-${sym}.png`
}

const getReliableLogo = (id: string, symbol: string, coinMap?: Map<string, string>): string => {
  const sym = symbol.toLowerCase()
  if (sym === 'xrp') return '/crypto-logos/xrp-xrp.png'
  return getCryptoLogo(id, symbol, coinMap)
}

const getCryptoLogoSvg = (id: string, symbol: string, coinMap?: Map<string, string>) => {
  const sym = symbol.toLowerCase()
  const name = id.toLowerCase()
  if (coinMap) {
    const bySymbol = coinMap.get(`symbol:${sym}`)
    if (bySymbol) return bySymbol.replace('.png', '.svg')
    const byName = coinMap.get(`name:${name}`)
    if (byName) return byName.replace('.png', '.svg')
    const byId = coinMap.get(`slug:${id}`)
    if (byId) return byId.replace('.png', '.svg')
  }
  return `/crypto-logos/${id.toLowerCase().replace(/\s+/g, '-')}-${sym}.svg`
}

const EXCLUDED_COINS = new Set([
  'HELOC',
  'LEO',
  'HL',
  'USDS',
  'WBTC',
  'BKUSD'
])

const DEMO_COINS: CryptoCoin[] = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 67432.12, change24h: 2.34, marketCap: 1324000000000, volume24h: 28500000000, image: '/crypto-logos/bitcoin-btc.png' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 3521.45, change24h: -1.23, marketCap: 423000000000, volume24h: 15200000000, image: '/crypto-logos/ethereum-eth.png' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', price: 178.90, change24h: 5.67, marketCap: 82000000000, volume24h: 3800000000, image: '/crypto-logos/solana-sol.png' },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA', price: 0.6234, change24h: -0.45, marketCap: 22000000000, volume24h: 850000000, image: '/crypto-logos/cardano-ada.png' },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', price: 0.1876, change24h: 8.90, marketCap: 27000000000, volume24h: 2100000000, image: '/crypto-logos/dogecoin-doge.png' },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', price: 7.85, change24h: -2.10, marketCap: 11000000000, volume24h: 420000000, image: '/crypto-logos/polkadot-dot.png' },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', price: 42.30, change24h: 3.21, marketCap: 16000000000, volume24h: 680000000, image: '/crypto-logos/avalanche-avax.png' },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', price: 18.45, change24h: 1.56, marketCap: 10800000000, volume24h: 520000000, image: '/crypto-logos/chainlink-link.png' },
  { id: 'ripple', name: 'XRP', symbol: 'XRP', price: 0.6234, change24h: -0.89, marketCap: 34000000000, volume24h: 1200000000, image: '/crypto-logos/xrp-xrp.png' },
  { id: 'toncoin', name: 'Toncoin', symbol: 'TON', price: 7.21, change24h: 4.32, marketCap: 28000000000, volume24h: 950000000, image: '/crypto-logos/toncoin-ton.png' }
]

const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
]

const DEFAULT_CMC_KEY = '80ce520384dc44f7a3c9c91e591bfddd'

const COINPAPRIKA_BASE = 'https://api.coinpaprika.com/v1'

type ApiProvider = 'coingecko' | 'coinpaprika'

export function PF_CryptoTrack() {
  const [coins, setCoins] = React.useState<CryptoCoin[]>(DEMO_COINS)
  const [query, setQuery] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [useDemo, setUseDemo] = React.useState(true)
  const [proxyIndex, setProxyIndex] = React.useState(0)
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('list')
  const [apiProvider, setApiProvider] = React.useState<ApiProvider>('coingecko')
  const [savedLogos, setSavedLogos] = React.useState<Record<string, string>>({})
  const [coinMap, setCoinMap] = React.useState<Map<string, string>>(new Map())
  const [page, setPage] = React.useState(1)
  const PAGE_SIZE = 8
  const [sortBy, setSortBy] = React.useState<'name' | 'price' | 'marketCap' | 'change24h'>('marketCap')
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc')

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('appforge-crypto-logos')
      if (stored) setSavedLogos(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    const fetchCoinMap = async () => {
      try {
        const res = await fetch('/crypto-logos/coinmap.json')
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        const map = new Map<string, string>()
        for (const [slug, entry] of Object.entries(data)) {
          const e = entry as any
          map.set(`slug:${slug}`, e.localPath)
          map.set(`name:${e.name.toLowerCase()}`, e.localPath)
          map.set(`symbol:${e.ticker.toLowerCase()}`, e.localPath)
        }
        setCoinMap(map)
      } catch { /* ignore */ }
    }
    fetchCoinMap()
    return () => { cancelled = true }
  }, [])

  const saveLogo = (id: string, url: string) => {
    setSavedLogos(prev => {
      const next = { ...prev, [id]: url }
      localStorage.setItem('appforge-crypto-logos', JSON.stringify(next))
      localStorage.setItem('projectforge-crypto-logos', JSON.stringify(next))
      return next
    })
  }

  const getLogo = (coin: CryptoCoin) => {
    if (savedLogos[coin.id]) return savedLogos[coin.id]
    if (coin.image) return coin.image
    return getReliableLogo(coin.id, coin.symbol, coinMap)
  }

  const clearSavedLogos = () => {
    if (confirm('Clear all saved logos?')) {
      setSavedLogos({})
      localStorage.removeItem('appforge-crypto-logos')
      localStorage.removeItem('projectforge-crypto-logos')
    }
  }

  const fetchCoins = async () => {
    setLoading(true)
    setError('')
    try {
      if (apiProvider === 'coingecko') {
        const baseUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h'
        let res: Response
        try {
          res = await fetch(baseUrl)
        } catch (e) {
          const proxyUrl = CORS_PROXIES[proxyIndex] + encodeURIComponent(baseUrl)
          res = await fetch(proxyUrl)
          if (!res.ok && CORS_PROXIES[proxyIndex + 1]) {
            setProxyIndex(proxyIndex + 1)
            throw new Error('CORS blocked, trying next proxy...')
          }
        }
        if (!res.ok) throw new Error('CoinGecko API error')
        const data = await res.json()
        const mapped: CryptoCoin[] = data
          .filter((c: any) => !EXCLUDED_COINS.has((c.symbol || '').toUpperCase()))
          .map((c: any) => {
            const logo = getCryptoLogo(c.id, c.symbol, coinMap)
            saveLogo(c.id, logo)
            return {
              id: c.id,
              name: c.name,
              symbol: c.symbol.toUpperCase(),
              price: c.current_price || 0,
              change24h: c.price_change_percentage_24h || 0,
              marketCap: c.market_cap,
              volume24h: c.total_volume,
              image: logo
            }
          })
        setCoins(mapped)
        setUseDemo(false)
      } else if (apiProvider === 'coinpaprika') {
         const url = `${COINPAPRIKA_BASE}/tickers?start=0&limit=50&sort=market_cap&quotes[0][quote]=usd`
        const res = await fetch(url)
        if (!res.ok) throw new Error('CoinPaprika API error')
        const data = await res.json()
        const mapped: CryptoCoin[] = data
          .filter((c: any) => !EXCLUDED_COINS.has((c.symbol || '').toUpperCase()))
          .map((c: any) => {
            const logo = getCryptoLogo(c.symbol || c.id, c.symbol || '', coinMap)
            saveLogo(c.symbol || c.id, logo)
            return {
              id: c.id || c.symbol,
              name: c.name || c.symbol,
              symbol: (c.symbol || '').toUpperCase(),
              price: c.quotes?.USD?.price || 0,
              change24h: c.quotes?.USD?.percent_change_24h || 0,
              marketCap: c.quotes?.USD?.market_cap,
              volume24h: c.quotes?.USD?.volume_24h,
              image: logo
            }
          })
        setCoins(mapped)
        setUseDemo(false)
      }
    } catch (e) {
      setError((e as Error).message)
      setUseDemo(true)
    } finally {
      setLoading(false)
    }
  }

  const filtered = query
    ? coins.filter(c => {
        const symbolUpper = c.symbol.toUpperCase()
        const nameLower = c.name.toLowerCase()
        const queryLower = query.toLowerCase()
        return !EXCLUDED_COINS.has(symbolUpper) && (nameLower.includes(queryLower) || symbolUpper.includes(queryLower))
      })
    : coins.filter(c => !EXCLUDED_COINS.has(c.symbol.toUpperCase()))

  const sorted = [...filtered].sort((a, b) => {
    let aVal: number | string = 0
    let bVal: number | string = 0
    switch (sortBy) {
      case 'name':
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
        break
      case 'price':
        aVal = a.price
        bVal = b.price
        break
      case 'marketCap':
        aVal = a.marketCap || 0
        bVal = b.marketCap || 0
        break
      case 'change24h':
        aVal = a.change24h
        bVal = b.change24h
        break
    }
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
  })

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE) || 1
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const formatPrice = (p: number) => p < 1 ? `$${p.toFixed(6)}` : `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const formatLarge = (n?: number) => n ? `$${(n / 1e9).toFixed(2)}B` : '-'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Crypto Track</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live cryptocurrency prices and market data. Uses CoinGecko / CoinPaprika API with demo fallback.</p>
      </div>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-foreground">Search</label>
             <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="Filter by name or symbol..." />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={fetchCoins} disabled={loading}><RefreshCw className="h-4 w-4" /> Refresh</Button>
            <Button variant="secondary" onClick={clearSavedLogos} title="Clear saved logos"><Trash2 className="h-4 w-4" /> Logos</Button>
            <Button variant="secondary" onClick={() => { setUseDemo(true); setCoins(DEMO_COINS); setError('') }}>Demo data</Button>
            <div className="flex items-center gap-1 border-l border-input pl-2">
              <button onClick={() => setViewMode('grid')} className={`rounded p-1 ${viewMode === 'grid' ? 'bg-accent' : 'hover:bg-accent'}`}>
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`rounded p-1 ${viewMode === 'list' ? 'bg-accent' : 'hover:bg-accent'}`}>
                <List className="h-4 w-4" />
              </button>
            </div>
            <select
              value={apiProvider}
              onChange={(e) => setApiProvider(e.target.value as ApiProvider)}
              className="rounded-lg border border-input bg-white px-3 py-2 text-sm dark:border-border dark:bg-secondary dark:text-foreground"
            >
              <option value="coingecko">CoinGecko</option>
              <option value="coinpaprika">CoinPaprika</option>
            </select>
          </div>
        </div>
        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <AlertCircle className="h-4 w-4 mt-0.5 text-destructive-foreground" />
            <div>
              <p className="text-sm text-destructive-foreground">{error}</p>
              <p className="mt-1 text-xs text-muted-foreground">Showing demo data instead. Click Refresh to retry live API.</p>
            </div>
          </div>
        )}
        {useDemo && !error && (
          <p className="mt-2 text-xs text-muted-foreground">Showing demo data. Click Refresh to try live API.</p>
        )}
      </Card>

      {viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginated.map(coin => (
            <Card key={coin.id} className="transition-colors hover:bg-accent/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <img src={getLogo(coin)} alt={coin.name} className="h-6 w-6 rounded-full" onError={(e) => { const img = e.target as HTMLImageElement; img.src = `https://placehold.co/24x24/1e293b/ffffff?text=${coin.symbol.slice(0, 2)}` }} />
                   <div>
                     <h3 className="font-semibold text-foreground">{coin.name}</h3>
                     <p className="text-xs text-muted-foreground">{coin.symbol}</p>
                   </div>
                </div>
                <Badge color={coin.change24h >= 0 ? 'green' : 'red'}>{coin.change24h.toFixed(2)}%</Badge>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-lg font-bold text-foreground">{formatPrice(coin.price)}</p>
                {coin.marketCap && <p className="text-xs text-muted-foreground">Market Cap: {formatLarge(coin.marketCap)}</p>}
                {coin.volume24h && <p className="text-xs text-muted-foreground">Volume 24h: {formatLarge(coin.volume24h)}</p>}
              </div>
              <div className="mt-3">
                <a href={`https://www.coingecko.com/en/coins/${coin.id}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" className="w-full"><ExternalLink className="h-4 w-4" /> View on CoinGecko</Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="col-span-1">#</div>
            <div className="col-span-3">
              <button onClick={() => { setSortBy('name'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); setPage(1) }} className="hover:text-foreground">
                Coin {sortBy === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </button>
            </div>
            <div className="col-span-2 text-right">
              <button onClick={() => { setSortBy('price'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); setPage(1) }} className="hover:text-foreground">
                Price {sortBy === 'price' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </button>
            </div>
            <div className="col-span-2 text-right">
              <button onClick={() => { setSortBy('change24h'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); setPage(1) }} className="hover:text-foreground">
                24h Change {sortBy === 'change24h' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </button>
            </div>
            <div className="col-span-2 text-right">
              <button onClick={() => { setSortBy('marketCap'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); setPage(1) }} className="hover:text-foreground">
                Market Cap {sortBy === 'marketCap' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </button>
            </div>
            <div className="col-span-2 text-right">Volume 24h</div>
          </div>
          <div className="divide-y divide-border">
             {paginated.map((coin, idx) => (
              <div key={coin.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-accent/50 transition-colors">
                <div className="col-span-1 text-sm text-muted-foreground">{(page - 1) * PAGE_SIZE + idx + 1}</div>
                <div className="col-span-3 flex items-center gap-2">
                  <img src={getLogo(coin)} alt={coin.name} className="h-6 w-6 rounded-full" onError={(e) => { const img = e.target as HTMLImageElement; img.src = `https://placehold.co/24x24/1e293b/ffffff?text=${coin.symbol.slice(0, 2)}` }} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{coin.name}</p>
                    <p className="text-xs text-muted-foreground">{coin.symbol}</p>
                  </div>
                </div>
                <div className="col-span-2 text-right text-sm font-medium text-foreground">{formatPrice(coin.price)}</div>
                <div className="col-span-2 text-right">
                  <Badge color={coin.change24h >= 0 ? 'green' : 'red'}>{coin.change24h.toFixed(2)}%</Badge>
                </div>
                <div className="col-span-2 text-right text-xs text-muted-foreground">{formatLarge(coin.marketCap)}</div>
                <div className="col-span-2 text-right text-xs text-muted-foreground">{formatLarge(coin.volume24h)}</div>
              </div>
              ))
            }
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">Showing {Math.min((page - 1) * PAGE_SIZE + 1, sorted.length)}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}</span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-3 w-3" /></Button>
                <span className="text-xs text-muted-foreground">Page {page} / {totalPages}</span>
                <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-3 w-3" /></Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
