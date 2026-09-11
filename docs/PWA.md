# AppForge PWA

AppForge is delivered as one installable Progressive Web App using `vite-plugin-pwa` and a generated Workbox service worker.

> The PWA boundary is **AppForge as a whole**. Individual tools inside AppForge do not have a standalone-PWA readiness, extraction, or forkability track in this repository.

If an app category later becomes an independent commercial or open-source product, that work should start in a separate project with its own architecture, branding, deployment, and lifecycle.

## Install and update behavior

AppForge uses a prompt-based service-worker update flow. When a newer build is available, the application can tell the user that an update is ready and reload after the user accepts it. This keeps the visible build fingerprint aligned with the code actually running in the browser.

Supported browsers may offer AppForge through their normal install or Add to Home Screen flow. The installed application starts at `/` and uses standalone display mode.

## Offline expectations

AppForge is not fully offline by design. Once the shell is cached, static UI and browser-local utilities can continue to work where their own dependencies permit it.

Network-dependent capabilities still require connectivity, including authentication, Supabase synchronization/storage, Getter Pro aggregation, Weather Now, Crypto Track, AI/provider endpoints, and other server-backed workflows.

Never present stale provider or API data as current live data.

## Navigation and API boundaries

The generated service worker uses the application entry point as the navigation fallback for client-side routes. `/api/*` is excluded from SPA navigation fallback so API failures remain API failures instead of returning HTML.

## Local PWA testing

For PWA-specific changes, test a production build rather than relying on the development server:

```bash
npm run build
npm run preview
```

Then inspect the browser's Manifest and Service Worker panels and verify:

1. AppForge is installable where the browser supports installation.
2. A nested client route survives direct navigation and refresh.
3. `/api/*` requests are not replaced by the SPA shell.
4. Static shell behavior is sensible offline.
5. A newer production build produces the expected update flow.
6. The visible build/version fingerprint matches the running deployment.

## Production responsibility

PWA configuration is shared platform infrastructure. Changes to `vite.config.ts`, `src/components/pwa/`, manifest assets, service-worker caching, or update behavior affect the whole AppForge product and should be tested accordingly.

The canonical brand mark is `public/favicon.svg`; raster variants remain available for platform compatibility.

## Troubleshooting a stale browser build

Use the in-app update flow first. During development or recovery from a genuinely stuck service worker, browser DevTools can unregister the worker and clear site data before reopening the production site. This is a debugging fallback, not the normal release process.
