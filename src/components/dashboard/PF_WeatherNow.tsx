import { AppHeading } from "@/components/layout/AppHeading";
import React from "react";
import { Badge, Button, Card, Input, Select } from "@/components/ui";
import { ArrowUpDown, Cloud, CloudRain, CloudSun, Droplets, Eye, Gauge, LayoutGrid, List, Loader2, MapPin, RefreshCw, Snowflake, Star, Sun, Sunrise, Sunset, Thermometer, Wind, X } from "lucide-react";

export interface WeatherData {
  location: string;
  temp_c: number;
  condition: string;
  humidity: number;
  wind_kph: number;
  feelslike_c: number;
  local_time?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  source?: string;
  pressure_hpa?: number;
  cloud_cover?: number;
  visibility_km?: number;
  sunrise?: string;
  sunset?: string;
  fetched_at?: string;
}

type SortBy = "name" | "temp" | "humidity" | "wind";
type ViewMode = "grid" | "list";
type Unit = "c" | "f";

const STORAGE_KEY = "appforge-weather-cities-v2";
const SIDEBAR_LOCATION_KEY = "appforge-weather-sidebar-location-v1";
const SIDEBAR_CHANGED_EVENT = "appforge:sidebar-weather-location-changed";
const EU_SETS = [
  ["Paris", "Berlin", "Madrid"],
  ["Rome", "Vienna", "Amsterdam"],
  ["Lisbon", "Athens", "Prague"],
];
const US_SETS = [
  ["New York", "Los Angeles", "Chicago"],
  ["Miami", "Seattle", "Austin"],
  ["Boston", "Denver", "San Francisco"],
];

const toFahrenheit = (celsius: number) => (celsius * 9) / 5 + 32;
const timeOnly = (value?: string) => (value ? value.split("T")[1]?.slice(0, 5) || value : "—");
const stampWeather = (weather: WeatherData): WeatherData => ({ ...weather, fetched_at: new Date().toISOString() });
const freshnessLabel = (weather: WeatherData) => {
  if (!weather.fetched_at) return "Saved snapshot · refresh for current data";
  const date = new Date(weather.fetched_at);
  if (Number.isNaN(date.getTime())) return "Saved snapshot · refresh for current data";
  return `Updated ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};
const readSidebarLocation = () => {
  try {
    return localStorage.getItem(SIDEBAR_LOCATION_KEY) || "";
  } catch {
    return "";
  }
};

function Metric({ icon: Icon, label, value, className = "" }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; className?: string }) {
  return (
    <div className={`group min-w-0 rounded-xl border border-border/70 bg-background/45 p-4 backdrop-blur-sm transition-colors hover:border-foreground/15 hover:bg-accent/35 ${className}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-[0.12em]">{label}</span> {/* design-xs-ok: compact metric label */}
      </div>
      <p className="mt-2 text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function ListMetric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="min-w-0 px-4 py-2 lg:border-l lg:border-border/55">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-[0.12em]">{label}</span> {/* design-xs-ok: compact list metric label */}
      </div>
      <p className="mt-2 truncate text-sm font-medium tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export function PF_WeatherNow() {
  const [query, setQuery] = React.useState("");
  const [cities, setCities] = React.useState<WeatherData[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortBy>("name");
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [unit, setUnit] = React.useState<Unit>("c");
  const [locating, setLocating] = React.useState(false);
  const [sidebarLocation, setSidebarLocation] = React.useState(readSidebarLocation);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cities));
    } catch {
      /* saved weather is an optional device cache */
    }
  }, [cities]);

  const requestWeatherAtCoordinates = async (latitude: number, longitude: number): Promise<WeatherData> => {
    const response = await fetch(`/api/weather?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`);
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error || `Weather request failed with HTTP ${response.status}`);
    return stampWeather(data as WeatherData);
  };

  const requestWeather = async (location: string): Promise<WeatherData> => {
    const clean = location.trim();
    if (!clean || clean.toLowerCase() === "your location") throw new Error("Choose a real city or use the location button.");
    const response = await fetch(`/api/weather?q=${encodeURIComponent(clean)}`);
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error || `Weather request failed with HTTP ${response.status}`);
    return stampWeather(data as WeatherData);
  };

  const upsertCity = React.useCallback((weather: WeatherData) => {
    setCities((current) => {
      const index = current.findIndex((item) => item.location.toLowerCase() === weather.location.toLowerCase());
      if (index === -1) return [weather, ...current];
      const next = [...current];
      next[index] = weather;
      return next;
    });
  }, []);

  const addCity = async () => {
    const location = query.trim();
    if (!location || loading) return;
    setLoading(true);
    setError("");
    try {
      upsertCity(await requestWeather(location));
      setQuery("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load weather.");
    } finally {
      setLoading(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation || locating) {
      if (!navigator.geolocation) setError("Geolocation is unavailable in this browser.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void requestWeatherAtCoordinates(position.coords.latitude, position.coords.longitude)
          .then(upsertCity)
          .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Could not load your location."))
          .finally(() => setLocating(false));
      },
      (locationError) => {
        setLocating(false);
        setError(locationError.message || "Location permission was not granted.");
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    );
  };

  const refreshCity = async (weather: WeatherData) => {
    setRefreshing(weather.location);
    setError("");
    try {
      const latitude = Number(weather.latitude);
      const longitude = Number(weather.longitude);
      const refreshed = Number.isFinite(latitude) && Number.isFinite(longitude) ? await requestWeatherAtCoordinates(latitude, longitude) : await requestWeather(weather.location);
      upsertCity(refreshed);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not refresh weather.");
    } finally {
      setRefreshing(null);
    }
  };

  const refreshAll = async () => {
    if (!cities.length || loading) return;
    setLoading(true);
    setError("");
    try {
      const refreshed = await Promise.allSettled(
        cities.map((weather) => {
          const latitude = Number(weather.latitude);
          const longitude = Number(weather.longitude);
          return Number.isFinite(latitude) && Number.isFinite(longitude) ? requestWeatherAtCoordinates(latitude, longitude) : requestWeather(weather.location);
        }),
      );
      const successful = refreshed.filter((result): result is PromiseFulfilledResult<WeatherData> => result.status === "fulfilled").map((result) => result.value);
      setCities(successful.length ? successful : cities);
      if (successful.length !== cities.length) setError(`Refreshed ${successful.length} of ${cities.length} saved locations.`);
    } finally {
      setLoading(false);
    }
  };

  const copySummary = async () => {
    if (!sortedCities.length) return;
    const summary = sortedCities.map((weather) => `${weather.location}: ${displayTemp(weather.temp_c)}, ${weather.condition}, humidity ${weather.humidity}%, wind ${weather.wind_kph.toFixed(1)} km/h`).join("\n");
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      setError("Clipboard access was blocked by the browser.");
    }
  };

  const addPresetSet = async (preset: string[]) => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const settled = await Promise.allSettled(preset.map(requestWeather));
      const successful = settled.filter((result): result is PromiseFulfilledResult<WeatherData> => result.status === "fulfilled").map((result) => result.value);
      setCities((current) => {
        const map = new Map(current.map((item) => [item.location.toLowerCase(), item]));
        successful.forEach((item) => map.set(item.location.toLowerCase(), item));
        return Array.from(map.values());
      });
      const failed = settled.length - successful.length;
      if (failed) setError(`${successful.length} cities loaded; ${failed} could not be resolved right now.`);
    } finally {
      setLoading(false);
    }
  };

  const chooseSidebarCity = (location: string) => {
    try {
      if (!location) localStorage.removeItem(SIDEBAR_LOCATION_KEY);
      else localStorage.setItem(SIDEBAR_LOCATION_KEY, location);
    } catch {
      /* sidebar preference remains active for this session */
    }
    setSidebarLocation(location);
    window.dispatchEvent(new Event(SIDEBAR_CHANGED_EVENT));
  };

  const removeCity = (location: string) => {
    setCities((current) => current.filter((item) => item.location !== location));
    if (sidebarLocation === location) chooseSidebarCity("");
  };

  const sortedCities = React.useMemo(() => {
    const next = [...cities];
    if (sortBy === "name") next.sort((a, b) => a.location.localeCompare(b.location));
    if (sortBy === "temp") next.sort((a, b) => b.temp_c - a.temp_c);
    if (sortBy === "humidity") next.sort((a, b) => b.humidity - a.humidity);
    if (sortBy === "wind") next.sort((a, b) => b.wind_kph - a.wind_kph);
    return next;
  }, [cities, sortBy]);

  const weatherIcon = (condition: string, compact = false) => {
    const size = compact ? "h-5 w-5" : "h-9 w-9";
    const value = condition.toLowerCase();
    if (value.includes("clear")) return <Sun className={`${size} text-warning`} />;
    if (value.includes("rain") || value.includes("drizzle") || value.includes("thunder")) return <CloudRain className={`${size} text-info`} />;
    if (value.includes("snow")) return <Snowflake className={`${size} text-info`} />;
    if (value.includes("cloud") || value.includes("overcast") || value.includes("fog")) return <Cloud className={`${size} text-muted-foreground`} />;
    return <Wind className={`${size} text-muted-foreground`} />;
  };

  const displayTemp = (value: number) => `${(unit === "c" ? value : toFahrenheit(value)).toFixed(1)}°${unit.toUpperCase()}`;

  return (
    <div className="space-y-4">
      <AppHeading />

      <Card className="p-4 sm:p-4">
        <div className="rounded-xl border border-border/70 bg-background/35 p-4 sm:p-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">City or postal code</label>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder='e.g. "Belgrade", "London", or "10001"'
                onKeyDown={(event) => {
                  if (event.key === "Enter") void addCity();
                }}
              />
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <Button onClick={() => void addCity()} disabled={!query.trim() || loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />} Add location
              </Button>
              <Button variant="secondary" onClick={useMyLocation} disabled={locating || loading}>
                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />} Use my location
              </Button>
            </div>
          </div>
          <div className="mt-4 grid gap-4 border-t border-border/60 pt-4 lg:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Europe · add 3 at a time</div> {/* design-xs-ok: compact preset label */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {EU_SETS.map((set, index) => (
                  <Button key={`eu-${index}`} variant="secondary" size="sm" onClick={() => void addPresetSet(set)} disabled={loading}>
                    EU {index + 1} · +3
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">United States · add 3 at a time</div> {/* design-xs-ok: compact preset label */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {US_SETS.map((set, index) => (
                  <Button key={`us-${index}`} variant="secondary" size="sm" onClick={() => void addPresetSet(set)} disabled={loading}>
                    US {index + 1} · +3
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center">
          <label className="flex min-w-0 flex-col items-start gap-2 text-sm text-muted-foreground md:flex-row md:items-center">
            <span className="shrink-0 font-medium text-foreground">Sidebar weather city</span>
            <Select value={sidebarLocation} onChange={(event) => chooseSidebarCity(event.target.value)} className="w-full flex-1 rounded-xl border border-input bg-background px-2 py-2 text-sm text-foreground">
              <option value="">First saved city</option>
              {cities.map((weather) => (
                <option key={weather.location} value={weather.location}>
                  {weather.location}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)} className="rounded-xl border border-input bg-background px-2 py-2 text-sm text-foreground">
              <option value="name">Name</option>
              <option value="temp">Temperature</option>
              <option value="humidity">Humidity</option>
              <option value="wind">Wind</option>
            </Select>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border h-9">
            {(["c", "f"] as Unit[]).map((value) => (
              <Button key={value} onClick={() => setUnit(value)} className={`rounded-xl px-2 py-2 text-sm font-medium ${unit === value ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                °{value.toUpperCase()}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border h-9">
            <Button onClick={() => setViewMode("grid")} aria-label="Grid view" className={`rounded-xl p-2 ${viewMode === "grid" ? "bg-accent" : "text-muted-foreground hover:text-foreground"}`}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button onClick={() => setViewMode("list")} aria-label="List view" className={`rounded-xl p-2 ${viewMode === "list" ? "bg-accent" : "text-muted-foreground hover:text-foreground"}`}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="-mt-2 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => void refreshAll()} disabled={!cities.length || loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh all
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void copySummary()} disabled={!cities.length}>
            Copy weather summary
          </Button>
        </div>
        {error && <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2 text-sm text-warning dark:text-warning">{error}</div>}
      </Card>

      {sortedCities.length > 0 ? (
        viewMode === "list" ? (
          <div className="space-y-2">
            {sortedCities.map((weather) => (
              <Card key={weather.location} className="relative overflow-hidden p-2">
                <div className="relative grid items-center gap-2 px-4 py-2 sm:grid-cols-2 lg:grid-cols-[minmax(180px,1.45fr)_minmax(145px,.9fr)_repeat(3,minmax(105px,.7fr))_108px] lg:px-4">
                  <div className="min-w-0 py-2 lg:pr-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <h3 className="truncate text-lg font-semibold text-foreground">{weather.location}</h3>
                      {sidebarLocation === weather.location && <Star className="h-4 w-4 fill-current text-warning" />}
                    </div>
                    {weather.local_time && <p className="mt-2 truncate text-sm text-muted-foreground">Local: {weather.local_time.replace("T", " ")}</p>}
                    <p className="mt-2 truncate text-sm text-muted-foreground">{freshnessLabel(weather)}</p>
                  </div>
                  <div className="flex min-w-0 items-center gap-4 px-2 py-2 lg:border-l lg:border-border/55 lg:px-4">
                    <span className="shrink-0">{weatherIcon(weather.condition, true)}</span>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-medium tabular-nums text-foreground">{displayTemp(weather.temp_c)}</p>
                      <p className="truncate text-sm text-muted-foreground">{weather.condition}</p>
                    </div>
                  </div>
                  <ListMetric icon={Thermometer} label="Feels like" value={displayTemp(weather.feelslike_c)} />
                  <ListMetric icon={Droplets} label="Humidity" value={`${weather.humidity}%`} />
                  <ListMetric icon={Wind} label="Wind" value={`${weather.wind_kph.toFixed(1)} km/h`} />
                  <div className="flex items-center justify-end gap-2 py-2 lg:border-l lg:border-border/55 lg:pl-4">
                    <Button variant="ghost" size="sm" onClick={() => chooseSidebarCity(weather.location)} title="Show in sidebar">
                      <Star className={`h-4 w-4 ${sidebarLocation === weather.location ? "fill-current text-warning" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void refreshCity(weather)} disabled={refreshing === weather.location} title="Refresh">
                      {refreshing === weather.location ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeCity(weather.location)} title="Remove">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sortedCities.map((weather) => (
              <Card key={weather.location} className="relative overflow-hidden p-4">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/25" />
                <div className="relative">
                  <div className="flex min-w-0 items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <h3 className="truncate font-semibold text-foreground">{weather.location}</h3>
                        {sidebarLocation === weather.location && <Star className="h-4 w-4 fill-current text-warning" />}
                      </div>
                      {weather.local_time && <p className="mt-2 text-sm text-muted-foreground">Local: {weather.local_time.replace("T", " ")}</p>}
                      <p className="mt-2 text-sm text-muted-foreground">{freshnessLabel(weather)}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="ghost" size="sm" onClick={() => chooseSidebarCity(weather.location)} title="Show in sidebar">
                        <Star className={`h-4 w-4 ${sidebarLocation === weather.location ? "fill-current text-warning" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => void refreshCity(weather)} disabled={refreshing === weather.location} title="Refresh">
                        {refreshing === weather.location ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeCity(weather.location)} title="Remove">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold tracking-[-0.04em] text-foreground">{displayTemp(weather.temp_c)}</p>
                        <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                          <Thermometer className="h-4 w-4" /> Feels like {displayTemp(weather.feelslike_c)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="flex items-center justify-center">{weatherIcon(weather.condition)}</span>
                        <Badge color="slate">{weather.condition}</Badge>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Metric icon={Droplets} label="Humidity" value={`${weather.humidity}%`} />
                      <Metric icon={Wind} label="Wind" value={`${weather.wind_kph.toFixed(1)} km/h`} />
                      <Metric icon={Gauge} label="Pressure" value={typeof weather.pressure_hpa === "number" ? `${Math.round(weather.pressure_hpa)} hPa` : "—"} />
                      <Metric icon={CloudSun} label="Cloud cover" value={typeof weather.cloud_cover === "number" ? `${Math.round(weather.cloud_cover)}%` : "—"} />
                      <Metric icon={Sunrise} label="Sunrise" value={timeOnly(weather.sunrise)} />
                      <Metric icon={Sunset} label="Sunset" value={timeOnly(weather.sunset)} />
                      <Metric icon={Eye} label="Visibility" value={typeof weather.visibility_km === "number" ? `${weather.visibility_km.toFixed(1)} km` : "—"} className="col-span-2" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card>
          <div className="py-8 text-center">
            <Cloud className="mx-auto h-7 w-7 text-muted-foreground" />
            <h2 className="mt-4 text-sm font-medium text-foreground">Add your first location</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Search by city or postal code, use device location, or add one of the three-city regional sets above.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
