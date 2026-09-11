# AppForge PWA guide

AppForge is built as an installable Progressive Web App using `vite-plugin-pwa` and a generated Workbox service worker.

## Goals

The PWA layer should make AppForge feel like a dependable installed toolbox without hiding deployment state from testers.

AppForge therefore uses a **prompt-based update flow** instead of silently replacing a running build. When a newer service worker is available, the UI shows:

> New AppForge build ready

Choosing **Update now** activates the new worker and reloads the app so the Footer/build fingerprint matches the deployed source.

## Canonical branding 

`public/favicon.svg` is the canonical AppForge brand mark and is included in the PWA manifest as the scalable SVG application icon.

Raster 192×192 and 512×512 icons remain in the manifest for platform compatibility and maskable-install requirements.

## Install behavior

On supported Chromium browsers, AppForge captures the `beforeinstallprompt` event and offers a subtle **Install AppForge** prompt.

Other platforms use their normal browser installation flow:

- Chrome/Edge desktop: Install App / icon in the address bar
- Android: Add to Home screen / Install app
- iOS/iPadOS Safari: Share → Add to Home Screen

The installed app starts at `/` and uses standalone display mode.

## Offline expectations

AppForge is not fully offline by design.

After the shell has been cached:

- local-only utilities can continue to work,
- static UI/assets can load,
- cached routes can render,
- the app reports offline state.

These features still require a network connection:

- Google/Supabase authentication,
- Supabase profile sync and storage,
- Scrapper Pro source aggregation,
- media/article proxy endpoints,
- Weather Now,
- Crypto Track,
- any future AI/provider endpoint.

Never display stale network data as if it were live.

## SPA navigation

The generated service worker uses `/index.html` as the navigation fallback so direct app routes continue to work after installation.

`/api/*` is explicitly excluded from navigation fallback so API failures remain API failures rather than returning HTML.

## Local PWA testing

Development mode does not behave exactly like a production service worker. Test a production build:

```bash
npm run build
npm run preview
```

Then inspect:

1. Browser DevTools → Application → Manifest
2. Browser DevTools → Application → Service Workers
3. installability
4. standalone launch
5. offline shell behavior
6. update prompt behavior after a second build

## Production review checklist

For each meaningful deployment:

1. Confirm the Footer/build badge shows the expected Git SHA.
2. Open a protected route and verify auth behavior.
3. Open `/apps/scrapper-pro` in a signed-out window and verify public access.
4. Hard reload a nested route.
5. Confirm API routes do not return the SPA shell.
6. Install once on a test browser.
7. Deploy a new build and confirm the **Update now** prompt appears.

## If the browser appears stuck on an old build

Normally use the in-app **Update now** prompt first.

If a browser is genuinely stuck during development/testing:

1. DevTools → Application → Service Workers → **Unregister**
2. DevTools → Application → Storage → **Clear site data**
3. close all AppForge tabs/windows
4. reopen `https://www.sstoken.space/`

This should be a debugging fallback, not the normal release process.

## Cache policy

- App shell/static assets: precached by Workbox
- outdated precaches: cleaned automatically
- Google font CSS: cache-first with bounded expiration
- live `/api` calls: not treated as offline truth

If a new network integration needs caching, document its freshness semantics before adding a runtime cache rule.
