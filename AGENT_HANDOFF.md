# AppForge — Agent Handoff

## Quick start
- **Repo**: `/home/dragoljub/Projects/appforge`
- **Dev**: `npm run dev` starts Vite on `5173` and API server on `5174`
- **Typecheck**: `npm run typecheck` passes
- **Git**: uncommitted changes present
- **Last commit**: `d558061` — Add app admin CRUD, cover image backgrounds, Dragon Arena UI polish
- **Push status**: needs GitHub auth setup (SSH key or PAT) to push to `origin/main`

## Indexed roadmap
| Status | Item | Files | Notes |
|---|---|---|---|
| ✅ | Dragon Arena 1.3.0 | `PF_AIDragonArena.tsx`, `dragonArena.ts`, `api/ai-game.js`, `api/dragon-image.js` | Personal keys, HF rotation, gallery, points, leaderboard, cover image, support button, rune icons |
| ✅ | Scrapper Pro → DA save | `PF_ScrapperPro.tsx` | `saveScrapperResult()` wired per result card |
| ✅ | DNS TXT Checker | `PF_DnsTxtChecker.tsx`, `App.tsx`, `registry.ts` | Route + redirect + registry entry |
| ✅ | Local API dev server | `scripts/dev-api.js`, `vite.config.ts` | Proxies `/api` to `localhost:5174` |
| ✅ | App admin CRUD | `AppAdminPage.tsx` | Search, create, edit, delete apps with cover image support |
| ✅ | Cover image backgrounds | `AppWorkspace.tsx`, `MiniAppShell.tsx`, `People.tsx` | Used on app cards, favorites, People page |
| ✅ | Public/private account settings | `Settings.tsx` | Public profile preview with data breakdown |
| ✅ | Cover photo upload | `Settings.tsx` | Upload cover photo to profile media |
| 🔴 | Asset gallery empty | `PF_AIDragonArena.tsx` | Assets saved in DB/storage but UI shows empty |
| 🔴 | AI GM unavailable | `api/ai-game.js` | `/api/ai-game` returns error |
| 🔴 | Scene gen unavailable | `api/dragon-image.js` | `/api/dragon-image` returns error |
| 🟡 | Kilo MCP config | `.kilo/mcp.json`, `kilo.jsonc` | OpenRouter provider config |
| 🟡 | Notes feature | `AppWorkspace.tsx` | Add Notes tab to AppForge workspace |
| 🟡 | Ideas & timeline docs | `docs/` or integrated | Create docs for ideas and timeline workflow |
| 🟡 | Messenger in plans | `AppWorkspace.tsx`, `types/index.ts` | Add messenger/chat to plan timeline |
| 🟡 | Document readiness checklist | `types/index.ts`, `AppWorkspace.tsx` | Add document readiness checklist for ChatGPT project area |
| 🟡 | App admin page | `AppAdminPage.tsx`, `registry.ts` | CRUD for apps with search and cover images |
| 🟡 | Image Labeler + Pinterest integration | new component/app | Pinterest images integration |
| 🟡 | User media storage app | new component/app | Image and video storage up to 500 MB per user |
| 🟡 | Integrations flyout modal | `Layout.tsx` or top nav | Move integrations UI from Settings to a small front-facing flyout modal |
| 🟡 | User-based integrations settings | `Settings.tsx` | Settings > Integrations becomes user-based API/integration management area |

## Environment
| Variable | Purpose | Where |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | Frontend + API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | Frontend + API |
| `OPENROUTER_API_KEY` | Server-side OpenRouter key | API |
| `HF_TOKEN_1/2/3` | Server-side HF pool (round-robin) | API |
| `HF_IMAGE_MODEL` | HF Inference model ID | API, default `stabilityai/stable-diffusion-xl-base-1.0` |

## Known issues & fixes
1. **Asset gallery empty** — `listAssets()` queries succeed but UI shows no images. Likely RLS or query mismatch. Added console logging in `refreshAssets`. Verify `storage_path` vs `external_url` precedence and RLS policies.
2. **AI GM unavailable** — Check OpenRouter quota, model allowlist, and `consume_dragon_arena_daily_request` RPC. Frontend sends `x-openrouter-key` if personal key saved.
3. **Scene gen unavailable** — Check OpenRouter image path first, then HF Inference API fallback and quota RPC `consume_dragon_arena_image_request`. Server now rotates `HF_TOKEN_1/2/3`.
4. **Settings TS errors** — `src/components/resources/Settings.tsx` has JSX syntax errors after cover photo/public preview additions. Needs cleanup.

## Assets & media
- **Dragon Arena cover**: `public/Dragon Arena.png` is used as the app header background in `PF_AIDragonArena.tsx`.
- **App card backgrounds**: `coverImage` from registry is used in `AppWorkspace.tsx` grid cards and `MiniAppShell.tsx`.
- **People page**: Cover photos appear above profile cards when uploaded via Settings.
- **Asset storage**: generated scenes upload to Supabase storage bucket `dragon-arena-assets` under `{userId}/{uuid}.png`; DB record stores `storage_path` and `external_url`.

## Dragon Arena gameplay notes
- First scene is always the same opening: *“You enter the Ember Vault...”*
- Story branches through player choices and free-text actions
- All runs are persisted per user in `dragon_arena_sessions` and `dragon_arena_turns`
- Points are awarded for turns and scenes; leaderboard shows public profiles
- Personal OpenRouter key bypasses daily quota
- HF token support with env rotation for scene generation

## Next steps
- Fix Settings.tsx JSX syntax errors
- Add Notes tab to AppWorkspace with local/remote sync
- Create docs for ideas and timeline workflow
- Add messenger/chat to plan timeline in `AppWorkspace.tsx`
- Add document readiness checklist for ChatGPT project area
- Build Image Labeler app with Pinterest integration
- Build user media storage app with 500 MB quota
- Verify Supabase RLS for `dragon_arena_assets` reads
- Verify OpenRouter quota/model config
- Verify HF tokens in Vercel env
- Consider adding more opening narratives/branches
