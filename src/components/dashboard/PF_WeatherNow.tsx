import React from 'react'
import { Card, Button, Input, Badge, Select } from '@/components/ui'
import { Cloud, RefreshCw, MapPin, Sun, CloudRain, Snowflake, Wind, Eye, Loader2, X, ArrowUpDown, List, LayoutGrid } from 'lucide-react'

export interface WeatherData {
  location: string
  temp_c: number
  condition: string
  humidity: number
  wind_kph: number
  feelslike_c: number
  local_time?: string
}

const DUMMY_WEATHER: Record<string, WeatherData> = {
  'New York': { location: 'New York, US', temp_c: 22, condition: 'Sunny', humidity: 45, wind_kph: 12, feelslike_c: 24, local_time: '2026-09-07 08:30' },
  'London': { location: 'London, GB', temp_c: 14, condition: 'Cloudy', humidity: 78, wind_kph: 18, feelslike_c: 12, local_time: '2026-09-07 09:30' },
  'Moscow': { location: 'Moscow, RU', temp_c: 8, condition: 'Rain', humidity: 85, wind_kph: 22, feelslike_c: 5, local_time: '2026-09-07 11:30' },
  'Paris': { location: 'Paris, FR', temp_c: 16, condition: 'Cloudy', humidity: 70, wind_kph: 15, feelslike_c: 14, local_time: '2026-09-07 10:30' },
  'Berlin': { location: 'Berlin, DE', temp_c: 12, condition: 'Rain', humidity: 80, wind_kph: 20, feelslike_c: 9, local_time: '2026-09-07 11:00' },
  'Tokyo': { location: 'Tokyo, JP', temp_c: 25, condition: 'Sunny', humidity: 55, wind_kph: 10, feelslike_c: 27, local_time: '2026-09-07 16:30' },
  'Sydney': { location: 'Sydney, AU', temp_c: 19, condition: 'Clear', humidity: 60, wind_kph: 14, feelslike_c: 18, local_time: '2026-09-07 18:30' },
  'Dubai': { location: 'Dubai, AE', temp_c: 35, condition: 'Sunny', humidity: 30, wind_kph: 18, feelslike_c: 38, local_time: '2026-09-07 13:30' },
  'Toronto': { location: 'Toronto, CA', temp_c: 15, condition: 'Cloudy', humidity: 65, wind_kph: 16, feelslike_c: 13, local_time: '2026-09-07 08:00' },
  'Mumbai': { location: 'Mumbai, IN', temp_c: 30, condition: 'Humid', humidity: 85, wind_kph: 12, feelslike_c: 34, local_time: '2026-09-07 15:00' },
}

const EU_CITIES = ['Paris', 'Berlin', 'Madrid', 'Rome', 'Vienna', 'Amsterdam', 'Lisbon', 'Athens', 'Warsaw', 'Prague']

export function PF_WeatherNow() {
  const [query, setQuery] = React.useState('')
  const [cities, setCities] = React.useState<WeatherData[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [useDummy, setUseDummy] = React.useState(true)
  const [sortBy, setSortBy] = React.useState<'name' | 'temp' | 'humidity'>('name')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('list')

  const getApiKey = () => {
    try {
      const keys = localStorage.getItem('appforge-api-keys')
        ? JSON.parse(localStorage.getItem('appforge-api-keys') || '{}')
        : {}
      return keys.weather || import.meta.env.VITE_WEATHERAPI_KEY || '138de7053de44a84a93191957262803'
    } catch {
      return import.meta.env.VITE_WEATHERAPI_KEY || '138de7053de44a84a93191957262803'
    }
  }
  const API_KEY = getApiKey()

  React.useEffect(() => {
    setCities([
      { ...DUMMY_WEATHER['New York'] },
      { ...DUMMY_WEATHER['London'] },
      { ...DUMMY_WEATHER['Moscow'] },
    ])
  }, [])

  const fetchWeather = async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    setError('')
    try {
      if (useDummy) {
        const data = DUMMY_WEATHER[q] || {
          location: q,
          temp_c: Math.floor(Math.random() * 30) - 5,
          condition: 'Clear',
          humidity: Math.floor(Math.random() * 60) + 20,
          wind_kph: Math.floor(Math.random() * 30) + 5,
          feelslike_c: Math.floor(Math.random() * 30) - 5,
          local_time: new Date().toISOString().slice(0, 16).replace('T', ' ')
        }
        setCities(prev => {
          const exists = prev.find(c => c.location.toLowerCase() === q.toLowerCase())
          if (exists) return prev.map(c => c.location.toLowerCase() === q.toLowerCase() ? data : c)
          return [...prev, data]
        })
        return
      }
      const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      const weather: WeatherData = {
        location: `${data.location.name}, ${data.location.country}`,
        temp_c: data.current.temp_c,
        condition: data.current.condition.text,
        humidity: data.current.humidity,
        wind_kph: data.current.wind_kph,
        feelslike_c: data.current.feelslike_c,
        local_time: data.location.localtime
      }
      setCities(prev => {
        const exists = prev.find(c => c.location.toLowerCase() === weather.location.toLowerCase())
        if (exists) return prev.map(c => c.location.toLowerCase() === weather.location.toLowerCase() ? weather : c)
        return [...prev, weather]
      })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const removeCity = (location: string) => {
    setCities(prev => prev.filter(c => c.location !== location))
  }

  const bulkAddEU = () => {
    const newCities = EU_CITIES.map(city => {
      const existing = cities.find(c => c.location.toLowerCase() === city.toLowerCase())
      if (existing) return existing
      return DUMMY_WEATHER[city] || {
        location: city,
        temp_c: Math.floor(Math.random() * 25) + 5,
        condition: ['Sunny', 'Cloudy', 'Rain', 'Clear'][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 60) + 30,
        wind_kph: Math.floor(Math.random() * 25) + 5,
        feelslike_c: Math.floor(Math.random() * 25) + 5,
        local_time: new Date().toISOString().slice(0, 16).replace('T', ' ')
      }
    })
    const merged = [...cities]
    newCities.forEach(nc => {
      const idx = merged.findIndex(c => c.location.toLowerCase() === nc.location.toLowerCase())
      if (idx >= 0) merged[idx] = nc
      else merged.push(nc)
    })
    setCities(merged)
  }

  const sortedCities = React.useMemo(() => {
    const arr = [...cities]
    if (sortBy === 'name') arr.sort((a, b) => a.location.localeCompare(b.location))
    else if (sortBy === 'temp') arr.sort((a, b) => b.temp_c - a.temp_c)
    else if (sortBy === 'humidity') arr.sort((a, b) => b.humidity - a.humidity)
    return arr
  }, [cities, sortBy])

  const getWeatherIcon = (condition: string) => {
    const c = condition.toLowerCase()
    if (c.includes('sunny') || c.includes('clear')) return <Sun className="h-8 w-8 text-amber-500" />
    if (c.includes('cloud')) return <Cloud className="h-8 w-8 text-muted-foreground" />
    if (c.includes('rain') || c.includes('drizzle')) return <CloudRain className="h-8 w-8 text-blue-500" />
    if (c.includes('snow')) return <Snowflake className="h-8 w-8 text-cyan-400" />
    if (c.includes('humid')) return <Wind className="h-8 w-8 text-orange-400" />
    return <Wind className="h-8 w-8 text-muted-foreground" />
  }

  const getWeatherGradient = (condition: string) => {
    const c = condition.toLowerCase()
    if (c.includes('sunny') || c.includes('clear')) return 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
    if (c.includes('cloud')) return 'from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border-input dark:border-border text-foreground dark:text-foreground'
    if (c.includes('rain')) return 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
    if (c.includes('snow')) return 'from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/30 border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-100'
    if (c.includes('humid')) return 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100'
    return 'from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border-input dark:border-border text-foreground dark:text-foreground'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground dark:text-foreground">Weather Now</h1>
        <p className="mt-1 text-sm text-foreground dark:text-muted-foreground">Current weather by city or ZIP code. Toggle between live API and dummy data.</p>
      </div>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-foreground dark:text-foreground">City or ZIP</label>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder='e.g. "London" or "10001"' onKeyDown={(e) => e.key === 'Enter' && fetchWeather(query)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => fetchWeather(query)} disabled={loading || !query.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
              {loading ? 'Loading...' : 'Add city'}
            </Button>
            <Button variant="secondary" onClick={bulkAddEU}>
              + 10 Cities
            </Button>
            <Button variant="secondary" onClick={() => setUseDummy(!useDummy)}>
              {useDummy ? 'Use API' : 'Use Dummy'}
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground dark:bg-secondary dark:text-muted-foreground">
            Mode: {useDummy ? 'Simple Dummy' : 'Live API'}
          </span>
          {!useDummy && <span className="text-foreground">Requires WeatherAPI key</span>}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-foreground">Sort:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'temp' | 'humidity')}
            className="rounded-lg border border-input bg-white px-2 py-1 text-xs dark:border-border dark:bg-secondary dark:text-foreground"
          >
            <option value="name">Name</option>
            <option value="temp">Temperature</option>
            <option value="humidity">Humidity</option>
          </select>
          <div className="ml-auto flex items-center gap-1 border-l border-border pl-2 dark:border-border">
            <button onClick={() => setViewMode('grid')} className={`rounded p-1 ${viewMode === 'grid' ? 'bg-slate-200 dark:bg-slate-700' : 'hover:bg-muted dark:hover:bg-secondary'}`}>
              <LayoutGrid className="h-3 w-3" />
            </button>
            <button onClick={() => setViewMode('list')} className={`rounded p-1 ${viewMode === 'list' ? 'bg-slate-200 dark:bg-slate-700' : 'hover:bg-muted dark:hover:bg-secondary'}`}>
              <List className="h-3 w-3" />
            </button>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </Card>

      <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
        {sortedCities.map((weather, idx) => (
          <Card key={weather.location} className={`transition-all hover:shadow-md bg-gradient-to-br ${getWeatherGradient(weather.condition)} ${viewMode === 'list' ? 'flex items-center gap-4' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-foreground" />
                <h3 className="font-semibold text-foreground dark:text-foreground">{weather.location}</h3>
              </div>
              <button onClick={() => removeCity(weather.location)} className="rounded-full p-1 hover:bg-slate-200/50 dark:hover:bg-slate-700/50">
                <X className="h-4 w-4 text-foreground" />
              </button>
            </div>
            {weather.local_time && <p className="mt-1 text-xs text-foreground">Local time: {weather.local_time}</p>}
            <div className={`mt-4 flex items-center ${viewMode === 'list' ? 'justify-between' : 'justify-between'}`}>
              <div>
                <p className="text-4xl font-bold text-foreground dark:text-foreground">{weather.temp_c.toFixed(1)}°C</p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Feels like {weather.feelslike_c.toFixed(1)}°C</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {getWeatherIcon(weather.condition)}
                <Badge color={weather.condition.toLowerCase().includes('sunny') || weather.condition.toLowerCase().includes('clear') ? 'yellow' : weather.condition.toLowerCase().includes('rain') ? 'blue' : weather.condition.toLowerCase().includes('cloud') ? 'slate' : 'slate'}>{weather.condition}</Badge>
              </div>
            </div>
            <div className={`mt-4 grid ${viewMode === 'list' ? 'grid-cols-4' : 'grid-cols-3'} gap-2`}>
              <div className="rounded-lg bg-white/60 p-3 dark:bg-primary/40">
                <p className="text-lg font-bold text-foreground dark:text-foreground">{weather.humidity}%</p>
                <p className="text-xs text-foreground">Humidity</p>
              </div>
              <div className="rounded-lg bg-white/60 p-3 dark:bg-primary/40">
                <p className="text-lg font-bold text-foreground dark:text-foreground">{weather.wind_kph.toFixed(1)}</p>
                <p className="text-xs text-foreground">Wind kph</p>
              </div>
              <div className={`rounded-lg bg-white/60 p-3 dark:bg-primary/40 ${viewMode === 'list' ? '' : ''}`}>
                <p className="text-lg font-bold text-foreground dark:text-foreground flex items-center gap-1"><Eye className="h-3 w-3" /> 10</p>
                <p className="text-xs text-foreground">Visibility</p>
              </div>
              {viewMode === 'list' && (
                <div className="rounded-lg bg-white/60 p-3 dark:bg-primary/40">
                  <p className="text-sm font-bold text-foreground dark:text-foreground capitalize">{weather.condition}</p>
                  <p className="text-xs text-foreground">Condition</p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
