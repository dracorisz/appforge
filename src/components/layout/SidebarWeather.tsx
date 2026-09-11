import React from 'react'
import { CloudSun, Loader2, MapPin, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { isWidgetEnabled, subscribeWidgetPreferences } from '@/lib/widgetPreferences'

type Weather = {
  location: string
  temp_c: number
  condition: string
  feelslike_c?: number
  latitude?: number
  longitude?: number
}

const STORAGE_KEY = 'appforge-weather-cities-v2'
export const SIDEBAR_WEATHER_LOCATION_KEY = 'appforge-weather-sidebar-location-v1'
export const SIDEBAR_WEATHER_CHANGED_EVENT = 'appforge:sidebar-weather-location-changed'
const FALLBACK_LOCATION = 'Belgrade'

function preferredLocation() {
  const explicit = localStorage.getItem(SIDEBAR_WEATHER_LOCATION_KEY)?.trim()
  if (explicit) return explicit
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    if (Array.isArray(saved) && typeof saved[0]?.location === 'string' && saved[0].location.trim()) return saved[0].location.trim()
  } catch { /* use fallback */ }
  return FALLBACK_LOCATION
}

const coordinatesFromSavedLocation = (location: string) => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    if (!Array.isArray(saved)) return null
    const match = saved.find((item) => item?.location === location)
    const latitude = Number(match?.latitude)
    const longitude = Number(match?.longitude)
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null
  } catch { return null }
}

const validWeather = (data: unknown): data is Weather => {
  if (!data || typeof data !== 'object') return false
  const candidate = data as Record<string, unknown>
  return typeof candidate.location === 'string' && candidate.location.trim().length > 0 && Number.isFinite(Number(candidate.temp_c))
}

export function SidebarWeather({ collapsed }: { collapsed: boolean }) {
  const [weather, setWeather] = React.useState<Weather | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [enabled, setEnabled] = React.useState(() => isWidgetEnabled('weather-sidebar'))

  React.useEffect(() => subscribeWidgetPreferences((changed) => {
    if (!changed || changed === 'weather-sidebar') setEnabled(isWidgetEnabled('weather-sidebar'))
  }), [])

  const refresh = React.useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    try {
      const location = preferredLocation()
      const savedCoordinates = coordinatesFromSavedLocation(location)
      const isLocationPlaceholder = location.toLowerCase() === 'your location'

      if (savedCoordinates) {
        try {
          const response = await fetch(`/api/weather?lat=${encodeURIComponent(savedCoordinates.latitude)}&lon=${encodeURIComponent(savedCoordinates.longitude)}`)
          const data = await response.json().catch(() => null)
          if (response.ok && validWeather(data)) {
            setWeather(data)
            return
          }
        } catch { /* fall through to the saved city name */ }
      }

      if (isLocationPlaceholder && navigator.geolocation) {
        const located = await new Promise<boolean>((resolve) => {
          navigator.geolocation.getCurrentPosition(async (position) => {
            try {
              const response = await fetch(`/api/weather?lat=${encodeURIComponent(position.coords.latitude)}&lon=${encodeURIComponent(position.coords.longitude)}`)
              const data = await response.json().catch(() => null)
              if (response.ok && validWeather(data)) {
                setWeather(data)
                resolve(true)
                return
              }
            } catch { /* use fallback city below */ }
            resolve(false)
          }, () => resolve(false), { enableHighAccuracy: false, maximumAge: 300000, timeout: 8000 })
        })
        if (located) return
      }

      const safeLocation = isLocationPlaceholder ? FALLBACK_LOCATION : location
      const response = await fetch(`/api/weather?q=${encodeURIComponent(safeLocation)}`)
      const data = await response.json().catch(() => null)
      if (response.ok && validWeather(data)) setWeather(data)
    } catch { /* weather is an optional sidebar enhancement */ }
    finally { setLoading(false) }
  }, [enabled])

  React.useEffect(() => { void refresh() }, [refresh])
  React.useEffect(() => {
    const handlePreferenceChange = () => { void refresh() }
    window.addEventListener(SIDEBAR_WEATHER_CHANGED_EVENT, handlePreferenceChange)
    window.addEventListener('storage', handlePreferenceChange)
    return () => {
      window.removeEventListener(SIDEBAR_WEATHER_CHANGED_EVENT, handlePreferenceChange)
      window.removeEventListener('storage', handlePreferenceChange)
    }
  }, [refresh])

  if (!enabled) return null

  if (collapsed) {
    return (
      <Link to="/apps/weather-now" title={weather ? `${weather.location} · ${Math.round(weather.temp_c)}°C · ${weather.condition}` : 'Weather Now'} className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background/45 text-muted-foreground hover:bg-accent hover:text-foreground">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudSun className="h-4 w-4" />}
      </Link>
    )
  }

  return (
    <div className="rounded-xl border border-border/60 bg-background/45 p-2.5">
      <div className="flex items-start gap-2">
        <Link to="/apps/weather-now" className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"><CloudSun className="h-3.5 w-3.5" /> Weather</div>
          {weather ? <>
            <div className="mt-1.5 flex items-end gap-2"><span className="text-xl font-semibold tabular-nums text-foreground">{Math.round(weather.temp_c)}°</span><span className="mb-0.5 truncate text-[11px] text-muted-foreground">{weather.condition}</span></div>
            <div className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" /> {weather.location}</div>
          </> : <div className="mt-2 text-[11px] text-muted-foreground">{loading ? 'Loading current conditions…' : 'Open Weather Now'}</div>}
        </Link>
        <button type="button" onClick={() => void refresh()} disabled={loading} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60" aria-label="Refresh sidebar weather"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>
    </div>
  )
}
