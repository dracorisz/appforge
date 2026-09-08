const weatherText = (code) => {
  if (code === 0) return 'Clear sky'
  if ([1, 2].includes(code)) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if ([45, 48].includes(code)) return 'Fog'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow'
  if ([95, 96, 99].includes(code)) return 'Thunderstorm'
  return 'Unknown'
}

const fetchJson = async (url, timeoutMs = 8000) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error(`Upstream HTTP ${response.status}`)
    return response.json()
  } finally {
    clearTimeout(timeout)
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const query = String(req.query?.q || '').trim()
  if (!query) return res.status(400).json({ error: 'City or postal code is required' })
  if (query.length > 120) return res.status(400).json({ error: 'Location query is too long' })

  try {
    const geo = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`)
    const place = geo?.results?.[0]
    if (!place) return res.status(404).json({ error: `No location found for “${query}”` })

    const forecast = await fetchJson(
      `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(place.latitude)}&longitude=${encodeURIComponent(place.longitude)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
    )
    const current = forecast?.current
    if (!current) throw new Error('Weather provider returned no current conditions')

    return res.status(200).json({
      ok: true,
      location: [place.name, place.admin1, place.country].filter(Boolean).join(', '),
      countryCode: place.country_code,
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: forecast.timezone,
      temp_c: current.temperature_2m,
      feelslike_c: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      wind_kph: current.wind_speed_10m,
      condition: weatherText(current.weather_code),
      weather_code: current.weather_code,
      local_time: current.time,
      source: 'Open-Meteo',
    })
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : 'Weather provider failed' })
  }
}
