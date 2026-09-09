# AppForge status and roadmap

Living pickup notes for the next contributor or agent. Update this file in the same pull request as the work it describes.

Last updated: 2026-09-09 · AppForge 1.18.0 · Dragon Arena 1.3.0

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev          # Vite on 5173, local API server on 5174
npm run typecheck
npm run build
```

`npm run dev` starts `scripts/dev-api.js` so `/api/*` routes work locally; Vite proxies `/api` to `localhost:5174` (configured in `vite.config.ts`).

## Recently shipped

| Item | Where |
|---|---|
| Dragon Arena 1.3.0 — personal OpenRouter keys, HF token rotation, asset gallery, points, leaderboard, session switcher, cover header | `PF_AIDragonArena.tsx`, `lib/dragonArena.ts`, `api/ai-game.js`, `api/dragon-image.js` |
| Local API dev server and `/api` proxy | `scripts/dev-api.js`, `vite.config.ts` |
| Scrapper Pro → Dragon Arena result saving | `PF_ScrapperPro.tsx` |
| DNS TXT Checker mini-app | `PF_DnsTxtChecker.tsx`, `App.tsx`, `lib/registry.ts` |
| App admin CRUD with search and cover images | `AppAdminPage.tsx` |
| Cover image backgrounds on cards, favorites, People | `AppWorkspace.tsx`, `MiniAppShell.tsx`, `People.tsx` |
| Public/private account settings, cover photo upload, public profile preview | `resources/Settings.tsx` |
| Build unblocked: missing `AppState` defaults and nullable profile access | `App.tsx`, `resources/Settings.tsx` |
| Stale compiled `vite.config.js` removed so the TS config (including the `/api` dev proxy) is the one Vite loads | repo root |

## Open issues

| Item | Where | Notes |
|---|---|---|
| Asset gallery renders empty | `PF_AIDragonArena.tsx` | Rows exist in `dragon_arena_assets` and storage. Check RLS on reads and `storage_path` vs `external_url` precedence in `refreshAssets` |
| `/api/ai-game` returns an error | `api/ai-game.js` | Verify OpenRouter quota and model allowlist, and the `consume_dragon_arena_daily_request` RPC. Frontend sends `x-openrouter-key` when a personal key is saved |
| `/api/dragon-image` returns an error | `api/dragon-image.js` | OpenRouter image path first, then Hugging Face fallback with `HF_TOKEN_1..3` rotation and `consume_dragon_arena_image_request` |
| Bundle is a single ~770 kB chunk | `vite.config.ts` | Route-level `import()` or `manualChunks` would cut first load |

## Planned

- Notes tab in the workspace with local/remote sync (`AppWorkspace.tsx`)
- Messenger/chat in the plan timeline (`AppWorkspace.tsx`, `types/index.ts`) — `PlanMessage` and `DocumentReadinessItem` types and `AppState` fields already exist and are currently unused
- Document readiness checklist surface (`types/index.ts`, `AppWorkspace.tsx`)
- Integrations flyout modal in the top nav, with user-managed API keys under Settings → Integrations
- Image Labeler with Pinterest import
- User media storage app with a 500 MB per-user quota
- Ideas and timeline workflow docs

## Environment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the authoritative environment-variable table.

## Dragon Arena notes

- Every run opens with the same scene: *"You enter the Ember Vault..."*, then branches on player choices and free-text actions.
- Runs persist per user in `dragon_arena_sessions` and `dragon_arena_turns`.
- Points are awarded for turns and scenes; the leaderboard shows public profiles only.
- A personal OpenRouter key bypasses the daily quota and is never stored server-side.
- Generated scenes upload to the `dragon-arena-assets` bucket under `{userId}/{uuid}.png`.
