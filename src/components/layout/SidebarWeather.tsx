import React from "react";
import { Cloud, CloudRain, CloudSun, Loader2, MapPin, RefreshCw, Snowflake, Sun, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import { isWidgetEnabled, subscribeWidgetPreferences } from "@/lib/widgetPreferences";
import { Button } from "@/components/ui";

type Weather = {
  location: string;
  temp_c: number;
  condition: string;
  feelslike_c?: number;
  latitude?: number;
  longitude?: number;
};

const STORAGE_KEY = "appforge-weather-cities-v2";
export const SIDEBAR_WEATHER_LOCATION_KEY = "appforge-weather-sidebar-location-v1";
export const SIDEBAR_WEATHER_CHANGED_EVENT = "appforge:sidebar-weather-location-changed";
const FALLBACK_LOCATION = "Belgrade";

const weatherTone = (condition?: string) => {
  const value = String(condition || "").toLowerCase();
  if (value.includes("clear") || value.includes("sun")) return "sunny";
  if (value.includes("rain") || value.includes("drizzle") || value.includes("thunder")) return "rainy";
  if (value.includes("snow")) return "snowy";
  if (value.includes("cloud") || value.includes("overcast") || value.includes("fog")) return "cloudy";
  if (value.includes("wind")) return "windy";
  return "default";
};

const WeatherIcon = ({ condition, className = "h-4 w-4" }: { condition?: string; className?: string }) => {
  const tone = weatherTone(condition);
  if (tone === "sunny") return <Sun className={className} />;
  if (tone === "rainy") return <CloudRain className={className} />;
  if (tone === "snowy") return <Snowflake className={className} />;
  if (tone === "cloudy") return <Cloud className={className} />;
  if (tone === "windy") return <Wind className={className} />;
  return <CloudSun className={className} />;
};

function preferredLocation() {
  const explicit = localStorage.getItem(SIDEBAR_WEATHER_LOCATION_KEY)?.trim();
  if (explicit) return explicit;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(saved) && typeof saved[0]?.location === "string" && saved[0].location.trim()) return saved[0].location.trim();
  } catch {
    /* use fallback */
  }
  return FALLBACK_LOCATION;
}

const coordinatesFromSavedLocation = (location: string) => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return null;
    const match = saved.find((item) => item?.location === location);
    if (match?.latitude == null || match?.longitude == null) return null;
    const latitude = Number(match.latitude);
    const longitude = Number(match.longitude);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
  } catch {
    return null;
  }
};

const validWeather = (data: unknown): data is Weather => {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Record<string, unknown>;
  return typeof candidate.location === "string" && candidate.location.trim().length > 0 && Number.isFinite(Number(candidate.temp_c));
};

export function SidebarWeather({ collapsed }: { collapsed: boolean }) {
  const [weather, setWeather] = React.useState<Weather | null>(null);
  const requestSequence = React.useRef(0);
  const [selectedLocation, setSelectedLocation] = React.useState(preferredLocation);
  const [loading, setLoading] = React.useState(false);
  const [enabled, setEnabled] = React.useState(() => isWidgetEnabled("weather-sidebar"));

  React.useEffect(
    () =>
      subscribeWidgetPreferences((changed) => {
        if (!changed || changed === "weather-sidebar") setEnabled(isWidgetEnabled("weather-sidebar"));
      }),
    [],
  );

  const refresh = React.useCallback(async () => {
    if (!enabled) return;
    const sequence = ++requestSequence.current;
    const location = preferredLocation();
    setSelectedLocation(location);
    setWeather(null);
    setLoading(true);
    try {
      const savedCoordinates = coordinatesFromSavedLocation(location);
      const isLocationPlaceholder = location.toLowerCase() === "your location";

      if (savedCoordinates) {
        try {
          const response = await fetch(`/api/weather?lat=${encodeURIComponent(savedCoordinates.latitude)}&lon=${encodeURIComponent(savedCoordinates.longitude)}`);
          const data = await response.json().catch(() => null);
          if (sequence === requestSequence.current && response.ok && validWeather(data)) {
            setWeather({ ...data, location: isLocationPlaceholder ? data.location : location });
            return;
          }
        } catch {
          /* fall through to the saved city name */
        }
      }

      if (isLocationPlaceholder && navigator.geolocation) {
        const located = await new Promise<boolean>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                const response = await fetch(`/api/weather?lat=${encodeURIComponent(position.coords.latitude)}&lon=${encodeURIComponent(position.coords.longitude)}`);
                const data = await response.json().catch(() => null);
                if (sequence === requestSequence.current && response.ok && validWeather(data)) {
                  setWeather({ ...data, location: data.location });
                  resolve(true);
                  return;
                }
              } catch {
                /* use fallback city below */
              }
              resolve(false);
            },
            () => resolve(false),
            { enableHighAccuracy: false, maximumAge: 300000, timeout: 8000 },
          );
        });
        if (located) return;
      }

      const safeLocation = isLocationPlaceholder ? FALLBACK_LOCATION : location;
      const response = await fetch(`/api/weather?q=${encodeURIComponent(safeLocation)}`);
      const data = await response.json().catch(() => null);
      if (sequence === requestSequence.current && response.ok && validWeather(data)) {
        setWeather({ ...data, location: isLocationPlaceholder ? data.location : location });
      }
    } catch {
      /* weather is an optional sidebar enhancement */
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [enabled]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);
  React.useEffect(() => {
    const handlePreferenceChange = () => {
      void refresh();
    };
    window.addEventListener(SIDEBAR_WEATHER_CHANGED_EVENT, handlePreferenceChange);
    window.addEventListener("storage", handlePreferenceChange);
    return () => {
      window.removeEventListener(SIDEBAR_WEATHER_CHANGED_EVENT, handlePreferenceChange);
      window.removeEventListener("storage", handlePreferenceChange);
    };
  }, [refresh]);

  if (!enabled) return null;
  const tone = weatherTone(weather?.condition);

  if (collapsed) {
    return (
      <Link
        to="/apps/weather-now"
        title={weather ? `${weather.location} · ${Math.round(weather.temp_c)}°C · ${weather.condition}` : "Weather Now"}
        data-weather-tone={tone}
        className="sidebar-weather-tone mx-auto flex h-9 w-9 items-center justify-center rounded-xl border text-muted-foreground hover:text-foreground"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <WeatherIcon condition={weather?.condition} />}
      </Link>
    );
  }

  return (
    <div data-weather-tone={tone} className="sidebar-weather-tone rounded-xl border p-2">
      <div className="flex items-start gap-2">
        <Link to="/apps/weather-now" className="min-w-0 flex-1 rounded-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{/* design-xs-ok: compact weather label */}<WeatherIcon condition={weather?.condition} /> Weather</div>
          {weather ? (
            <>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-lg font-semibold tabular-nums text-foreground">{Math.round(weather.temp_c)}°</span>
                <span className="mb-2 truncate text-sm text-muted-foreground">{weather.condition}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 truncate text-sm text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" /> {weather.location}</div>
            </>
          ) : (
            <div className="mt-1 text-sm text-muted-foreground">{loading ? `Loading ${selectedLocation}…` : `Open Weather Now · ${selectedLocation}`}</div>
          )}
        </Link>
        <Button type="button" onClick={() => void refresh()} disabled={loading} className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60" aria-label="Refresh sidebar weather">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>
    </div>
  );
}
