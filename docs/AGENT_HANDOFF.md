# AppForge — Agent Handoff

## Quick start
- **Repo**: `/home/dragoljub/Projects/appforge`
- **Dev**: `npm run dev` starts Vite on `5173` and API server on `5174`
- **Typecheck**: `npm run typecheck` passes
- **Git**: working tree clean, up to date with origin/main
- **Last commit**: `e4d9644` — update: Added user media vault functionality and reorganized documentation
- **Push status**: up to date with origin/main
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
| 🔴 | Asset gallery cross-run leak | `dragonArena.ts`, `PF_AIDragonArena.tsx` | Gallery mixes assets from different runs; needs ownership/query fix |
| 🟡 | Image generation integrity | `api/dragon-image.js` | HF endpoint updated; test real image response in production |
| 🟡 | Video upload support | new API + storage | Direct-to-Supabase uploads; Vercel limit is 4.5 MB request payload |
| 🟡 | User media storage | new component/app | Per-user quota, default 200 MB, admin override |
| 🟡 | Scrapper Pro → Dragon Arena | `PF_ScrapperPro.tsx`, `dragonArena.ts` | Save scrapper assets to DA gallery with integrity checks |
| 🟡 | Profile media & privacy | `Settings.tsx`, `People.tsx` | Cover photo, avatar, gallery; public/private toggle with data breakdown |
| 🟡 | Integrations flyout | `Layout.tsx` or top nav | Front-facing integrations panel; user-based API management in Settings |
| 🟡 | Dragon theme | `Settings.tsx` | Dragon appearance theme in Settings > Appearance |
| 🟡 | Payment/support button | `PF_AIDragonArena.tsx` | Front-page support button linked to PayPal |
| 🟢 | App admin CRUD | `AppAdminPage.tsx` | Search, create, edit, delete apps with cover image |
| 🟢 | Cover images | `AppWorkspace.tsx`, `MiniAppShell.tsx`, `People.tsx` | App cards, favorites, People page |
| 🟢 | Local API dev server | `scripts/dev-api.js`, `vite.config.ts` | `/api/*` proxy to localhost:5174 |

## Environment
| Variable | Purpose | Where |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | Frontend + API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | Frontend + API |
| `OPENROUTER_API_KEY` | Server-side OpenRouter key | API |
| `HF_TOKEN_1/2/3` | Server-side HF pool (round-robin) | API |
| `HF_IMAGE_MODEL` | HF Inference model ID | API, default tested working replacement |

## Known issues & fixes
1. **Asset gallery cross-run leak** — Gallery shows assets from other sessions. Fix query to enforce `user_id` + `session_id` ownership.
2. **Settings.tsx JSX errors** — Cover photo/public preview additions broke syntax/type safety. Needs cleanup.
3. **Video uploads** — Vercel 4.5 MB limit; implement direct-to-Supabase signed uploads.

## Assets & media
- **Dragon Arena cover**: `public/Dragon Arena.png` is used as the app header background.
- **App card backgrounds**: `coverImage` from registry in `AppWorkspace.tsx` and `MiniAppShell.tsx`.
- **People page**: Cover photos above profile cards when uploaded via Settings.
- **Asset storage**: generated scenes upload to Supabase storage bucket `dragon-arena-assets` under `{userId}/{uuid}.png`; DB record stores `storage_path` and `external_url`.
- **User media vault**: planned private storage with short-lived viewing links; 200 MB per user default.

## Dragon Arena gameplay notes
- First scene: *“You enter the Ember Vault...”*
- Story branches through choices + free-text actions
- Persistence: `dragon_arena_sessions` + `dragon_arena_turns`
- Points for turns/scenes; leaderboard public profiles only
- Personal OpenRouter key bypasses daily quota
- HF token rotation for scene generation

## 5-hour production-ready plan
Focus: **IMAGE | VIDEO | STORAGE | SCRAPPERPRO | DRAGONARENA | PROFILE | INTEGRITY**

### Hour 1: Integrity & storage foundation
- Enforce per-user storage quota in API (200 MB default, admin override)
- Add file type/size validation for images/videos before accept
- Fix asset gallery query to prevent cross-run leaks
- Add ownership checks on all Dragon Arena asset routes

### Hour 2: Dragon Arena playability
- End-to-end test: play turn → persist → load session → switch session
- Fix remaining `/api/ai-game` and `/api/dragon-image` errors
- Verify image generation returns real asset in gallery
- Add error boundaries and loading states for GM/scene actions

### Hour 3: Media & Scrapper Pro
- Implement direct-to-Supabase video upload flow (signed URLs)
- Wire Scrapper Pro saved results to Dragon Arena assets with metadata
- Add media integrity checks: hash/verify, dedupe, quarantine bad files

### Hour 4: Profile & integrations UX
- Add Dragon theme to Settings > Appearance
- Move integrations into front-facing flyout modal
- Add user-based API key management in Settings > Integrations
- Polish public profile preview and data breakdown

### Hour 5: Polish, docs, deploy
- Add support/payment button to Dragon Arena header
- Run full typecheck + build
- Update docs site (`docs.sstoken.space`) with current features
- Verify production deploy on `sstoken.space`
- Push branch to GitHub if auth available

## Next steps
- Fix Settings.tsx JSX syntax and null-safety errors
- Complete Notes tab, ideas/timeline docs, messenger in plans
- Build Image Labeler app with Pinterest integration
- Add document readiness checklist for ChatGPT project area
- Verify Supabase RLS for `dragon_arena_assets` reads
- Verify OpenRouter quota/model config
- Verify HF tokens in Vercel env
- Consider adding more opening narratives/branches
