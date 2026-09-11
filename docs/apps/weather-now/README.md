# Weather Now

Weather Now is a public, no-login current-conditions dashboard backed by AppForge's same-origin `/api/weather` route and Open-Meteo. Saved locations and unit/view preferences remain browser-local.

## Card design

Each location card has three layers:

1. location, local observation time, refresh and removal controls;
2. current temperature, feels-like temperature and condition identity;
3. compact metric tiles for humidity, wind, surface pressure, cloud cover, visibility, sunrise and sunset.

The surface uses AppForge semantic `primary`, `accent`, `background`, `border`, `foreground`, and `muted-foreground` tokens. It therefore follows Settings → Appearance without maintaining a separate Weather theme. The grid expands from two-column metric tiles on narrow screens to three columns on wider cards; list mode uses a wrapping summary suitable for desktop tables without hiding data on touch devices.

Missing optional metrics render as an em dash rather than invented values. Cached locations from earlier versions remain compatible because the added fields are optional.

## Data mapping

`api/weather.js` requests Open-Meteo current values for temperature, apparent temperature, relative humidity, weather code, wind speed, surface pressure, cloud cover and visibility. It also requests the current day's sunrise and sunset using the resolved location timezone. Visibility is converted from metres to kilometres on the server.

The API response is cached at the edge for five minutes with stale-while-revalidate support. Browser geolocation is optional and never sent anywhere except the same-origin weather route.

## Verification

- Search by city and postal code.
- Test browser geolocation allowed and denied states.
- Verify Celsius/Fahrenheit switching.
- Verify grid and list layouts at phone, tablet and desktop widths.
- Refresh and remove individual locations.
- Confirm older saved locations show placeholders for newly added optional fields.
- Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.

## Version

**Weather Now 1.2.0** — richer live metrics and a responsive, theme-aware card hierarchy.
