const EXCLUDED = new Set(['HELOC', 'LEO', 'HL', 'USDS', 'WBTC', 'BKUSD'])

const fetchJson = async (url, timeoutMs = 8000) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'SSToken-CryptoTrack/1.0' },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  } finally {
    clearTimeout(timeout)
  }
}

const fromCoinGecko = async () => {
  const data = await fetchJson('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h')
  return data
    .filter((coin) => !EXCLUDED.has(String(coin.symbol || '').toUpperCase()))
    .map((coin) => ({
      id: coin.id,
      name: coin.name,
      symbol: String(coin.symbol || '').toUpperCase(),
      price: Number(coin.current_price || 0),
      change24h: Number(coin.price_change_percentage_24h || 0),
      marketCap: Number(coin.market_cap || 0),
      volume24h: Number(coin.total_volume || 0),
      image: coin.image || undefined,
    }))
}

const fromCoinPaprika = async () => {
  const data = await fetchJson('https://api.coinpaprika.com/v1/tickers?quotes=USD&limit=50')
  return data
    .filter((coin) => !EXCLUDED.has(String(coin.symbol || '').toUpperCase()))
    .map((coin) => ({
      id: coin.id || String(coin.symbol || '').toLowerCase(),
      name: coin.name || coin.symbol,
      symbol: String(coin.symbol || '').toUpperCase(),
      price: Number(coin.quotes?.USD?.price || 0),
      change24h: Number(coin.quotes?.USD?.percent_change_24h || 0),
      marketCap: Number(coin.quotes?.USD?.market_cap || 0),
      volume24h: Number(coin.quotes?.USD?.volume_24h || 0),
    }))
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const requested = String(req.query?.provider || 'auto').toLowerCase()
  const attempts = requested === 'coingecko'
    ? ['coingecko']
    : requested === 'coinpaprika'
      ? ['coinpaprika']
      : ['coingecko', 'coinpaprika']

  const errors = []
  for (const provider of attempts) {
    try {
      const coins = provider === 'coingecko' ? await fromCoinGecko() : await fromCoinPaprika()
      return res.status(200).json({ ok: true, provider, updatedAt: new Date().toISOString(), coins })
    } catch (error) {
      errors.push(`${provider}: ${error instanceof Error ? error.message : 'failed'}`)
    }
  }

  return res.status(502).json({ error: 'All market-data providers failed', details: errors })
}
