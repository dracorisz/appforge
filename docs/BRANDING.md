# Branding

AppForge branding is intentionally simple: the canonical favicon geometry, dark slate, white, and restrained neutral surfaces. Avoid introducing a second accent system in docs, screenshots, demos, Marketplace assets, or standalone-PWA shells unless a specific app needs its own identity.

## Canonical product identity

The PWA manifest in `vite.config.ts` is the source of truth for public product/install metadata.

- **Product name:** AppForge — Simple, powerful tools
- **Short name:** AppForge
- **Description:** An open-source toolbox of focused web utilities, media tools, and practical browser apps.
- **Primary categories:** utilities, productivity, developer
- **Production:** https://www.sstoken.space/
- **Documentation:** https://docs.sstoken.space/
- **Repository:** https://github.com/dracorisz/appforge

## Canonical palette

The canonical `public/favicon.svg` defines the visual core:

- **AppForge slate:** `#0f172a`
- **White:** `#ffffff`
- **Deep page black/slate:** `#020617` for dark documentation/background surfaces
- **Neutral light surface:** `#ffffff`

The docs theme should derive from those values. Do not use violet or a separate bright-blue brand gradient as the default documentation identity. Links and interactive states may use accessible neutral/slate contrast while the mark remains the recognizable accent.

## Canonical mark

`public/favicon.svg` is the source mark: a rounded `#0f172a` square, white outlined triangle, and white center point. `docs/public/favicon.svg` is the docs copy used by GitHub Pages for the browser favicon and navigation logo.

For documentation, Marketplace preparation, screenshots, and simple promotional layouts, use these derived display assets:

<div class="brand-assets">
  <div class="brand-asset brand-asset--dark">
    <img src="/branding/appforge-mark-dark.svg" alt="AppForge dark branding mark" />
  </div>
  <div class="brand-asset brand-asset--light">
    <img src="/branding/appforge-mark-light.svg" alt="AppForge light branding mark" />
  </div>
</div>

- **Dark mark:** `docs/public/branding/appforge-mark-dark.svg`
- **Light mark:** `docs/public/branding/appforge-mark-light.svg`

These are derived from the favicon geometry for presentation at larger sizes. If the canonical favicon changes, update both derived assets in the same pass.

## Usage rules

Use the dark mark on light/neutral surfaces and the light mark on dark surfaces. Keep generous clear space around the mark, avoid shadows/glows as a default brand treatment, and do not distort the triangle or remove the center point.

Do not recolor the mark independently for Docs, Marketplace, GitHub, YouTube, or support surfaces. Product screenshots may naturally include app-specific colors, but platform-level branding should remain slate + white.

## PWA assets

The main application includes install assets referenced by the manifest:

- `favicon/android-chrome-192x192.png`
- `favicon/android-chrome-512x512.png`
- `pwa-512x512.png` for maskable installation contexts
- `favicon.svg` for shortcuts/browser identity

Standalone apps may inherit AppForge branding while still using a distinct app icon where that improves recognition. Keep platform attribution subtle and consistent.

## Product naming

Use **AppForge** for the platform and the canonical registry name for individual apps. Current examples include **Desktop Buddy**, **Story Studio**, **Getter Pro**, **Media Vault**, **Any to Any Converter**, and **Task List**.

Compatibility IDs/routes may intentionally preserve historical names (`ai-dragon-arena`, `scrapper-pro`) internally. Do not surface those legacy names as the primary product label unless a migration/debugging context requires it.

## Surface roles

- `sstoken.space` — use AppForge
- `docs.sstoken.space` — understand, build, operate, and contribute
- GitHub repository — source, issues, pull requests, releases, and automation
- YouTube — demos, walkthroughs, and product showcases
- Buy Me a Coffee — optional project support

## Updating branding

When branding changes, update these together:

1. `public/favicon.svg` and install assets;
2. manifest metadata in `vite.config.ts`;
3. `docs/public/favicon.svg`, VitePress theme variables, and this page;
4. derived black/white branding assets;
5. Marketplace/GitHub/YouTube/support visuals;
6. standalone app manifests where applicable.

See `docs/DOC_MAINTENANCE.md` for the wider documentation synchronization contract.
