# AppForge — Agent Handoff

## Quick start
- **Repo**: `/home/dragoljub/Projects/appforge`
- **Dev**: `npm run dev` starts Vite on `5173` and API server on `5174`
- **Typecheck**: `npm run typecheck` passes
- **Git**: on `origin/main` (commit `b281b31`); working tree clean
- **Production**: `sstoken.space` (live at commit `f4fe671` from separate deployment workflow)
- **Docs**: `docs.sstoken.space` in progress

## Current production state (from latest deployment)
- TypeScript build errors fixed
- Dragon Arena scene generation repaired
- Hugging Face-only image generation enabled
- Point awards secured against client-side manipulation
- Supabase security migration applied
- Leaderboard restricted to public profiles
- AI-provider privacy wording updated
- Route-level code splitting still pending

## Indexed roadmap
| Status | Item | Files | Notes |
|---|---|---|---|
| 🔴 | Dragon Arena playable E2E | `PF_AIDragonArena.tsx`, `api/ai-game.js`, `api/dragon-image.js` | Must verify: play → persistence → points → image gen → gallery → session switch → leaderboard |
| 🟡 | Image generation integrity | `api/dragon-image.js` | HF endpoint updated; test real image response in production |
| 🟡 | Video upload support | `api/user-media.js`, `mediaVault.ts` | Direct-to-Supabase signed uploads; Vercel limit is 4.5 MB request payload |
| 🟡 | User media storage | `PF_UserMediaVault.tsx` | Per-user quota, default 200 MB, admin override |
| 🟡 | Scrapper Pro → Dragon Arena | `PF_ScrapperPro.tsx`, `dragonArena.ts` | Save scrapper assets to DA gallery with integrity checks |
| 🟡 | Profile media & privacy | `Settings.tsx`, `People.tsx` | Cover photo, avatar, gallery; public/private toggle with data breakdown |
| 🟡 | Integrations flyout | `Layout.tsx` or top nav | Front-facing integrations panel; user-based API management in Settings |
| 🟡 | Dragon theme | `Settings.tsx` | Dragon appearance theme in Settings > Appearance |
| 🟡 | Payment/support button | `PF_AIDragonArena.tsx` | Front-page support button linked to PayPal |
| 🟢 | App admin CRUD | `AppAdminPage.tsx` | Search, create, edit, delete apps with cover image |
| 🟢 | Cover images | `AppWorkspace.tsx`, `MiniAppShell.tsx`, `People.tsx` | App cards, favorites, People page |
| 🟢 | Local API dev server | `scripts/dev-api.js`, `vite.config.ts` | `/api/*` proxy to localhost:5174 |
| 🟢 | Media Vault | `PF_UserMediaVault.tsx`, `api/user-media.js`, `mediaVault.ts` | Private per-user storage, quota, signed uploads |

## Environment

| Variable | Purpose | Where |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | Frontend + API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | Frontend + API |
| `OPENROUTER_API_KEY` | Server-side OpenRouter key | API |
| `HF_TOKEN_1/2/3` | Server-side HF pool (round-robin) | API |
| `HF_IMAGE_MODEL` | HF Inference model ID | API, default tested working replacement |

## Known issues & fixes
1. **Asset gallery cross-run leak** — Fixed. `listAssets` now enforces `user_id` ownership; public assets only returned when `publicOnly` is set.
2. **Settings.tsx JSX errors** — Fixed. Null-safety on `profile?.skills`.
3. **Video uploads** — Fixed. Direct-to-Supabase signed uploads via `api/user-media.js` and the `user-media-vault` bucket.
4. **Dev API server route lookup** — Fixed. `scripts/dev-api.js` now stores handlers without the `/api/` prefix.
5. **dragon-image.js syntax error** — Fixed. `saveImage` no longer uses `await` inside a nested IIFE.
6. **ScrapperPro regression** — Fixed. Restored `saveToDragonArena` and `savingDragonId` after a remote commit removed them while the JSX still referenced them.

## Assets & media
- **Dragon Arena cover**: `public/Dragon Arena.png` is used as the app header background.
- **App card backgrounds**: `coverImage` from registry in `AppWorkspace.tsx` and `MiniAppShell.tsx`.
- **People page**: Cover photos above profile cards when uploaded via Settings.
- **Asset storage**: generated scenes upload to Supabase storage bucket `dragon-arena-assets` under `{userId}/{uuid}.png`; DB record stores `storage_path` and `external_url`.
- **User media vault**: private storage bucket `user-media-vault` under `{userId}/{kind}/{uuid}-{name}`; 200 MB default quota, admin override; signed URLs for preview/download.

## Dragon Arena gameplay notes
- First scene: *“You enter the Ember Vault...”*
- Story branches through choices + free-text actions
- Persistence: `dragon_arena_sessions` + `dragon_arena_turns`
- Points for turns/scenes; leaderboard public profiles only
- Personal OpenRouter key bypasses daily quota
- HF token rotation for scene generation

## Docs index
- `docs/README.md` — documentation index
- `docs/DATABASE.md` — database setup
- `docs/BRANCHING.md` — branch policy
- `docs/PWA.md` — PWA behavior
- `docs/apps/dragon-arena.md` — Dragon Arena deep dive
- `docs/apps/media-vault.md` — Media Vault deep dive
- `docs/apps/scrapper-pro/` — Scrapper Pro docs
- `docs/apps/image-tools/` — image tools docs

## Next steps
- Verify Supabase RLS for `dragon_arena_assets` reads
- Verify OpenRouter quota/model config
- Verify HF tokens in Vercel env
- Run full typecheck + build before pushing
- (Done) Added multiple Dragon Arena opening scenarios with per-session restore (1.4.0)