import React from 'react'
import { Card, Button, Input, Badge } from '@/components/ui'
import {
  ArrowUpDown,
  Cloud,
  CloudRain,
  CloudSun,
  Droplets,
  Eye,
  Gauge,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  RefreshCw,
  Snowflake,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
  X,
} from 'lucide-react'

export interface WeatherData {
  location: string
  temp_c: number
  condition: string
  humidity: number
  wind_kph: number
  feelslike_c: number
  local_time?: string
  timezone?: string
  latitude?: number
  longitude?: number
  source?: string
  pressure_hpa?: number
  cloud_cover?: number
  visibility_km?: number
  sunrise?: string
  sunset?: string
}

type SortBy = 'name' | 'temp' | 'humidity' | 'wind'
type ViewMode = 'grid' | 'list'
type Unit = 'c' | 'f'

const STORAGE_KEY = 'appforge-weather-cities-v2'
const EU_CITIES = ['Paris', 'Berlin', 'Madrid', 'Rome', 'Vienna', 'Amsterdam', 'Lisbon', 'Athens', 'Warsaw', 'Prague']

const toFahrenheit = (celsius: number) => (celsius * 9) / 5 + 32
const timeOnly = (value?: string) => value ? value.split('T')[1]?.slice(0, 5) || value : '—'

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return <div className="group rounded-xl border border-border/70 bg-background/45 p-3 backdrop-blur-sm transition-colors hover:border-foreground/15 hover:bg-accent/35"><div className="flex items-center gap-2 text-muted-foreground"><Icon className="h-3.5 w-3.5" /><span className="text-[10px] font-semibold uppercase tracking-[0.12em]">{label}</span></div><p className="mt-2 text-sm font-semibold tabular-nums text-foreground">{value}</p></div>
}

export function PF_WeatherNow() {
  const [query, setQuery] = React.useState('')
  const [cities, setCities] = React.useState<WeatherData[]>([])
  const [loading, setLoading] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState<string | null>(null)
  const [error, setError] = React.useState('')
  const [sortBy, setSortBy] = React.useState<SortBy>('name')
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid')
  const [unit, setUnit] = React.useState<Unit>('c')
  const [locating, setLocating] = React.useState(false)

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setCities(parsed)
      }
    } catch {
      // Ignore malformed local state.
    }
  }, [])

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cities))
  }, [cities])

  const requestWeatherAtCoordinates = async (latitude: number, longitude: number): Promise<WeatherData> => {
    const response = await fetch(`/api/weather?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`)
    const data = await response.json()
    if (!response.ok || data.error) throw new Error(data.error || `Weather request failed with HTTP ${response.status}`)
    return data as WeatherData
  }

  React.useEffect(() => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void requestWeatherAtCoordinates(position.coords.latitude, position.coords.longitude)
          .then(upsertCity)
          .catch(() => undefined)
          .finally(() => setLocating(false))
      },
      () => setLocating(false),
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    )
  }, [])

  const requestWeather = async (location: string): Promise<WeatherData> => {
    const response = await fetch(`/api/weather?q=${encodeURIComponent(location)}`)
    const data = await response.json()
    if (!response.ok || data.error) throw new Error(data.error || `Weather request failed with HTTP ${response.status}`)
    return data as WeatherData
  }

  const upsertCity = (weather: WeatherData) => {
    setCities((current) => {
      const index = current.findIndex((item) => item.location.toLowerCase() === weather.location.toLowerCase())
      if (index === -1) return [weather, ...current]
      const next = [...current]
      next[index] = weather
      return next
    })
  }

  const addCity = async () => {
    const location = query.trim()
    if (!location || loading) return
    setLoading(true)
    setError('')
    try {
      const weather = await requestWeather(location)
      upsertCity(weather)
      setQuery('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load weather.')
    } finally {
      setLoading(false)
    }
  }

  const useMyLocation = () => {
    if (!navigator.geolocation || locating) return
    setLocating(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void requestWeatherAtCoordinates(position.coords.latitude, position.coords.longitude)
          .then(upsertCity)
          .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Could not load your location.'))
          .finally(() => setLocating(false))
      },
      (locationError) => {
        setLocating(false)
        setError(locationError.message || 'Location permission was not granted.')
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    )
  }

  const refreshCity = async (weather: WeatherData) => {
    setRefreshing(weather.location)
    setError('')
    try {
      const refreshed = await requestWeather(weather.location)
      upsertCity(refreshed)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not refresh weather.')
    } finally {
      setRefreshing(null)
    }
  }

  const addEuropeanCities = async () => {
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const settled = await Promise.allSettled(EU_CITIES.map(requestWeather))
      const successful = settled
        .filter((result): result is PromiseFulfilledResult<WeatherData> => result.status === 'fulfilled')
        .map((result) => result.value)

      setCities((current) => {
        const map = new Map(current.map((item) => [item.location.toLowerCase(), item]))
        successful.forEach((item) => map.set(item.location.toLowerCase(), item))
        return Array.from(map.values())
      })

      const failed = settled.length - successful.length
      if (failed) setError(`${successful.length} cities loaded; ${failed} could not be resolved right now.`)
    } finally {
      setLoading(false)
    }
  }

  const sortedCities = React.useMemo(() => {
    const next = [...cities]
    if (sortBy === 'name') next.sort((a, b) => a.location.localeCompare(b.location))
    if (sortBy === 'temp') next.sort((a, b) => b.temp_c - a.temp_c)
    if (sortBy === 'humidity') next.sort((a, b) => b.humidity - a.humidity)
    if (sortBy === 'wind') next.sort((a, b) => b.wind_kph - a.wind_kph)
    return next
  }, [cities, sortBy])

  const weatherIcon = (condition: string) => {
    const value = condition.toLowerCase()
    if (value.includes('clear')) return <Sun className="h-8 w-8 text-amber-500" />
    if (value.includes('rain') || value.includes('drizzle') || value.includes('thunder')) return <CloudRain className="h-8 w-8 text-blue-500" />
    if (value.includes('snow')) return <Snowflake className="h-8 w-8 text-cyan-400" />
    if (value.includes('cloud') || value.includes('overcast') || value.includes('fog')) return <Cloud className="h-8 w-8 text-muted-foreground" />
    return <Wind className="h-8 w-8 text-muted-foreground" />
  }

  const displayTemp = (value: number) => {
    const converted = unit === 'c' ? value : toFahrenheit(value)
    return `${converted.toFixed(1)}°${unit.toUpperCase()}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Weather Now</h1>
            <Badge color="green">Live · no API key</Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Current conditions by city or postal code, powered through SSToken's same-origin Open-Meteo endpoint. No random or demo weather is shown.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          {(['c', 'f'] as Unit[]).map((value) => (
            <button
              key={value}
              onClick={() => setUnit(value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${unit === value ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              °{value.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-foreground">City or postal code</label>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='e.g. "Belgrade", "London", or "10001"'
              onKeyDown={(event) => {
                if (event.key === 'Enter') addCity()
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={addCity} disabled={!query.trim() || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
              Add location
            </Button>
            <Button variant="secondary" onClick={useMyLocation} disabled={locating || loading}>
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              Use my location
            </Button>
            <Button variant="secondary" onClick={addEuropeanCities} disabled={loading}>+ 10 EU cities</Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowUpDown className="h-3.5 w-3.5" /> Sort
          </div>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortBy)}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground"
          >
            <option value="name">Name</option>
            <option value="temp">Temperature</option>
            <option value="humidity">Humidity</option>
            <option value="wind">Wind</option>
          </select>
          <div className="ml-auto flex items-center gap-1 rounded-md border border-border p-1">
            <button onClick={() => setViewMode('grid')} aria-label="Grid view" className={`rounded p-1 ${viewMode === 'grid' ? 'bg-accent' : 'text-muted-foreground hover:text-foreground'}`}><LayoutGrid className="h-3.5 w-3.5" /></button>
            <button onClick={() => setViewMode('list')} aria-label="List view" className={`rounded p-1 ${viewMode === 'list' ? 'bg-accent' : 'text-muted-foreground hover:text-foreground'}`}><List className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        {error && <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">{error}</div>}
      </Card>

      {sortedCities.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid gap-3 md:grid-cols-2 xl:grid-cols-3' : 'space-y-2'}>
          {sortedCities.map((weather) => (
            <Card key={weather.location} className={`relative overflow-hidden ${viewMode === 'list' ? 'p-3' : 'p-0'}`}>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/25" />
              <div className={viewMode === 'list' ? 'relative' : 'relative p-4'}>
              <div className={viewMode === 'list' ? 'flex flex-wrap items-center gap-4' : ''}>
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-foreground">{weather.location}</h3>
                      {weather.local_time && <p className="mt-0.5 text-xs text-muted-foreground">Local: {weather.local_time.replace('T', ' ')}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="sm" onClick={() => refreshCity(weather)} disabled={refreshing === weather.location} title="Refresh">
                      {refreshing === weather.location ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setCities((current) => current.filter((item) => item.location !== weather.location))} title="Remove">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className={viewMode === 'list' ? 'ml-auto flex flex-1 flex-wrap items-center justify-end gap-6' : 'mt-5'}>
                  <div className="flex items-center justify-between gap-5">
                    <div>
                      <p className="text-4xl font-bold tracking-[-0.04em] text-foreground">{displayTemp(weather.temp_c)}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><Thermometer className="h-3.5 w-3.5" /> Feels like {displayTemp(weather.feelslike_c)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-background/55 shadow-sm backdrop-blur-md">{weatherIcon(weather.condition)}</span>
                      <Badge color="slate">{weather.condition}</Badge>
                    </div>
                  </div>

                  <div className={viewMode === 'list' ? 'grid min-w-[300px] grid-cols-2 gap-2 xl:grid-cols-4' : 'mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3'}>
                    <Metric icon={Droplets} label="Humidity" value={`${weather.humidity}%`} />
                    <Metric icon={Wind} label="Wind" value={`${weather.wind_kph.toFixed(1)} km/h`} />
                    <Metric icon={Gauge} label="Pressure" value={typeof weather.pressure_hpa === 'number' ? `${Math.round(weather.pressure_hpa)} hPa` : '—'} />
                    <Metric icon={CloudSun} label="Cloud cover" value={typeof weather.cloud_cover === 'number' ? `${Math.round(weather.cloud_cover)}%` : '—'} />
                    <Metric icon={Eye} label="Visibility" value={typeof weather.visibility_km === 'number' ? `${weather.visibility_km.toFixed(1)} km` : '—'} />
                    <div className="grid grid-cols-2 gap-2"><Metric icon={Sunrise} label="Sunrise" value={timeOnly(weather.sunrise)} /><Metric icon={Sunset} label="Sunset" value={timeOnly(weather.sunset)} /></div>
                  </div>
                </div>
              </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="py-12 text-center">
            <Cloud className="mx-auto h-7 w-7 text-muted-foreground" />
            <h2 className="mt-3 text-sm font-medium text-foreground">Add your first location</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Search by city or postal code. Saved locations remain on this device and can be refreshed individually.</p>
          </div>
        </Card>
      )}
    </div>
  )
}
