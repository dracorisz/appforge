# AppForge

1-init Unified toolbox for everyday developer work. Local-first, no backend, no analytics.

## Quick Start

```bash
git clone <repo-url>
cd projectpf
cp .env.example .env
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in the root:

```env
VITE_WEATHERAPI_KEY=
VITE_PARIFLOW_API_KEY=
VITE_COINMARKETCAP_API_KEY=
```

All keys are optional. Apps fall back to dummy/demo data when keys are missing.

## API Keys

### WeatherAPI (WeatherNow)
- Sign up at https://www.weatherapi.com/
- Free tier: 1M calls/month
- Paste key into `.env` as `VITE_WEATHERAPI_KEY`

### Pariflow (PariflowSmpl)
- Contact pariflow.com for API access
- Paste key into `.env` as `VITE_PARIFLOW_API_KEY`

### CoinMarketCap (CryptoTrack)
- Sign up at https://coinmarketcap.com/api/
- Free tier: 10,000 calls/month
- Paste key into `.env` as `VITE_COINMARKETCAP_API_KEY`

Keys are stored in `localStorage` via Settings and never sent to our servers.

## Branching Strategy

- `main` — stable, deployable
- `feature/<name>` — new apps, components, or tools
- `fix/<name>` — bug fixes
- `refactor/<name>` — structural changes without behavior changes

Create a branch, open a PR, squash-merge into `main`.

## Adding a New Mini App

1. Add entry in `src/lib/registry.ts` under the appropriate category
2. Create the component in `src/components/dashboard/`
3. Add route in `src/App.tsx`
4. Export component from `src/components/dashboard/index.ts`

### App Interface

Every mini app should be self-contained, manage its own internal state, and use the shared UI kit (`@/components/ui`). Do not mutate global `AppState` unless the app is part of the workspace.

## Architecture

```
src/
  App.tsx                    # Router + global state
  types/index.ts             # All TypeScript interfaces + default data
  components/
    dashboard/               # Mini apps + workspace
    layout/                  # Sidebar, header, footer
    ui/                      # Shared UI kit
    plan/, article/, pitches/, sources/, outreach/, safety/, resources/  # Workspace tabs
  hooks/useTheme.ts          # Theme, accent, radius
  lib/                       # Utilities
```

### State Management

- Global state lives in `App.tsx` as `AppState`
- Persisted to `localStorage` key `projectforge-workplan-v1`
- Mini apps are standalone unless they need workspace data
- Use `useTheme()` for appearance settings

## Frontend Stack

- React 18 + TypeScript
- Vite 6
- Tailwind CSS 3.4 (dark mode via `class`)
- React Router 6
- Lucide icons
- PWA via `vite-plugin-pwa`

UI is intentionally simple: cards, buttons, inputs, badges. No heavy frameworks.

## Build

```bash
npm run build      # TypeScript check + Vite build
npm run preview    # Preview production build
npm run dev        # Dev server with HMR
```

## Deployment

- **Vercel / Netlify**: connect repo, build command `npm run build`, output `dist/`
- **GitHub Pages**: enable Pages, source GitHub Actions
- **sstoken.space**: upload `dist/` via FTP/SFTP

## Data

All data is local-first. Export/import JSON from Settings. No backend. No sync. No tracking.

## Safety Notice

This workspace is for genuine independent editorial research. Do not manufacture, disguise, or manipulate sources. Readiness indicators are internal workflow status, not Wikipedia predictions.
