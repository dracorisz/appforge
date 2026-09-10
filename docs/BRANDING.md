# Branding

AppForge branding should stay consistent across the production app, GitHub Pages documentation, screenshots, demos, and future standalone PWAs.

## Canonical product identity

The PWA manifest in `vite.config.ts` is the source of truth for the public product name and install metadata.

- **Product name:** AppForge — Simple, powerful tools
- **Short name:** AppForge
- **Description:** An open-source toolbox of focused web utilities, media tools, and practical browser apps.
- **Primary categories:** utilities, productivity, developer
- **Production URL:** https://www.sstoken.space/
- **Documentation URL:** https://dracorisz.github.io/appforge/
- **Repository:** https://github.com/dracorisz/appforge

## Core colors

The application manifest defines a dark slate application surface:

- **Theme/background:** `#0f172a`
- **Docs brand blue:** `#2563eb`
- **Docs light blue accent:** `#60a5fa`
- **Docs deep blue accent:** `#1e3a8a`

Documentation should use blue accents over the same dark/slate family rather than violet/purple branding.

## Mark and favicon

The canonical lightweight mark is `public/favicon.svg`. It is a rounded dark square containing the outlined AppForge triangle and center point.

The docs copy this asset to `docs/public/favicon.svg` so GitHub Pages does not depend on the production application bundle.

Do not redraw or recolor the mark independently unless the canonical app asset is changed first.

## PWA assets

The main application includes install assets referenced by the manifest:

- `favicon/android-chrome-192x192.png`
- `favicon/android-chrome-512x512.png`
- `pwa-512x512.png` for maskable installation contexts
- `favicon.svg` for shortcuts and browser identity

Standalone apps should derive their visual identity from the AppForge system while remaining clearly identifiable as individual tools.

## Naming guidance

Use **AppForge** for the platform. Use the canonical registry name for a tool or app. Avoid introducing alternate platform names in UI, docs, metadata, or screenshots.

For public descriptions, prefer language around focused tools, practical browser apps, media utilities, developer utilities, and standalone-PWA readiness.

## Surface roles

Keep each public surface unambiguous:

- `sstoken.space` — use the product
- `dracorisz.github.io/appforge/` — understand, build, operate, and contribute
- GitHub repository — source, issues, pull requests, releases, and automation

## Updating branding

When branding changes, update the canonical app assets/manifest first, then synchronize:

1. `public/favicon.svg` and PWA image assets;
2. manifest metadata in `vite.config.ts`;
3. docs favicon/theme and this page;
4. screenshots, demos, channel assets, and marketing handoff notes;
5. standalone app manifests where applicable.
