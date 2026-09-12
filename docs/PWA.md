# AppForge PWA

AppForge is delivered as one installable Progressive Web App using `vite-plugin-pwa` and a generated Workbox service worker.

> The PWA boundary is **AppForge as a whole**. Individual tools inside AppForge do not have a standalone-PWA readiness, extraction, or forkability track in this repository.

## Install and update behavior

AppForge uses an explicit prompt-based lifecycle. When a newer service-worker build is ready, the user can choose **Update now** or defer it. When the browser exposes `beforeinstallprompt`, AppForge can offer **Install** without replacing the browser's own installation controls.

The lifecycle prompt uses a deliberately high-contrast dark surface with white primary actions and clearly separated secondary actions. It does not rely on the current app theme for readable foreground/background combinations, so update and install controls remain legible in light, dark, and system appearance modes.

Supported browsers may also offer AppForge through their own Install / Add to Home Screen flow. The installed application starts at `/` and uses standalone display mode.

## Offline expectations

AppForge is not fully offline by design. Once the shell is cached, static UI and browser-local utilities can continue to work where their own dependencies permit it.

Network-dependent capabilities still require connectivity, including authentication, Supabase synchronization/storage, Getter Pro aggregation, Weather Now, Crypto Track, AI/provider endpoints, and other server-backed workflows. Never present stale provider or API data as current live data.

## Navigation and API boundaries

The generated service worker uses the application entry point as the navigation fallback for client-side routes. `/api/*` is excluded from SPA navigation fallback so API failures remain API failures instead of returning HTML.

## Local PWA testing

For PWA-specific changes, test a production build rather than relying on the development server:

```bash
npm run build
npm run preview
```

Verify the following before release:

1. AppForge is installable where the browser supports installation.
2. Install, Update, Later, Not now, and close controls remain readable in both light and dark application themes.
3. Keyboard focus is visible on lifecycle-prompt actions.
4. A nested client route survives direct navigation and refresh.
5. `/api/*` requests are not replaced by the SPA shell.
6. Static shell behavior is sensible offline.
7. A newer production build produces the expected update flow and matching visible build fingerprint.

## Production responsibility

PWA configuration is shared platform infrastructure. Changes to `vite.config.ts`, `src/components/pwa/`, manifest assets, service-worker caching, or update behavior affect the whole AppForge product and should be tested accordingly.

The canonical brand mark is `public/favicon.svg`; raster variants remain available for platform compatibility.

## Troubleshooting a stale browser build

Use the in-app update flow first. During development or recovery from a genuinely stuck service worker, browser DevTools can unregister the worker and clear site data before reopening the production site. This is a debugging fallback, not the normal release process.
