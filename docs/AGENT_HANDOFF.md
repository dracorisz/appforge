# AppForge — Agent Handoff

## Quick start
- **Repo**: `dracorisz/appforge`
- **Branch**: `main`
- **Dev**: `npm run dev` starts Vite on `5173` and the local API server on `5174`
- **Typecheck**: `npm run typecheck`
- **Build**: `npm run build`
- **Production**: `https://www.sstoken.space/`
- **Docs**: repository `/docs` is the source of truth for the current handoff

## Current Dragon Arena state
- Multiple opening scenarios with per-session restore are implemented.
- Game Master remains OpenRouter-backed through `api/ai-game.js`.
- Scene generation is Hugging Face-only through `api/dragon-image.js`.
- HF generation uses the current `router.huggingface.co/hf-inference/models/...` route.
- Server-side `HF_TOKEN_1/2/3` tokens rotate; on failure the request can try the remaining configured tokens.
- A personal `x-hf-token` overrides the server pool and bypasses the owner-funded image quota.
- Generated image responses are checked for image content, non-empty bytes, and a 15 MB maximum before storage.
- Failed owner-funded image generation refunds the image quota reservation.
- Generated scenes are stored in the `dragon-arena-assets` Supabase bucket and logged in `dragon_arena_assets` by the client.
- Asset gallery reads are scoped by owner + session to prevent cross-run leakage.
- Points, session switching, public leaderboard, Scrapper Pro asset saves, support link, and personal provider settings are implemented.

## Environment

| Variable | Purpose | Where |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | Frontend + API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable/anon key | Frontend + API |
| `OPENROUTER_API_KEY` | Owner-funded Game Master requests | API |
| `OPENROUTER_MODEL` | Game Master model override | `api/ai-game.js` |
| `HF_TOKEN_1/2/3` | Hugging Face image-generation token pool | `api/dragon-image.js` |
| `HF_IMAGE_MODEL` | HF text-to-image model override | `api/dragon-image.js` |

Current default image model: `stabilityai/stable-diffusion-3-medium-diffusers`.

## Dragon Arena flow

1. New Run selects one of the code-defined opening scenarios.
2. Player submits a choice or free-text action.
3. `POST /api/ai-game` authenticates the user, applies the GM quota, and returns narrative + choices.
4. The client persists the session and turn in Supabase.
5. `POST /api/dragon-image` sends the latest narrative to Hugging Face Inference.
6. The API validates the returned bytes and uploads the scene to `dragon-arena-assets`.
7. The client records the asset, refreshes the current-run gallery, and awards scene points.

## Completed items from the previous production plan
- [x] Dragon Arena session persistence and session switching
- [x] Multiple opening narratives with persisted restore
- [x] Asset gallery scoped to the active run
- [x] Server-side points award path
- [x] Public-profile-only leaderboard
- [x] Hugging Face token rotation
- [x] Hugging Face-only scene generation
- [x] Current Hugging Face router endpoint
- [x] Basic generated-image integrity checks
- [x] Failed-generation quota refund
- [x] Personal HF token override
- [x] Scrapper Pro → Dragon Arena asset save
- [x] Direct-to-Supabase Media Vault uploads
- [x] Media Vault quota foundation
- [x] Dragon theme options in Settings
- [x] Provider key management in Settings / Dragon Arena
- [x] Dragon Arena support/payment link
- [x] App admin CRUD and cover images
- [x] Local `/api/*` development proxy

## Remaining lightweight verification
These are verification items rather than planned code rewrites:

- [ ] Confirm `HF_TOKEN_1` (and optional `HF_TOKEN_2/3`) are present in the production Vercel environment.
- [ ] Generate one real Dragon Arena scene in production and confirm it appears in the active session gallery.
- [ ] Confirm the selected `HF_IMAGE_MODEL` is available to the configured HF tokens; override it in Vercel if needed.
- [ ] Confirm `dragon_arena_assets` storage/RLS reads work for the authenticated owner after a fresh login.
- [ ] Confirm the daily image quota is refunded after a deliberately failed HF request.
- [ ] Run `npm run typecheck` and `npm run build` before a named release.

## Known implementation notes
- Scene generation no longer requires `OPENROUTER_IMAGE_MODEL` or an OpenRouter image-capable model.
- A personal OpenRouter key is for Game Master turns; a personal Hugging Face token is for scene generation.
- The client currently stores optional personal provider credentials in browser `localStorage`; server endpoints receive them only in request headers.
- Route-level code splitting remains a separate build-hygiene improvement.
- `docs/apps/dragon-arena.md` contains the detailed provider, quota, storage, and security behavior.

## Files to inspect first
- `api/ai-game.js`
- `api/dragon-image.js`
- `src/components/dashboard/PF_AIDragonArena.tsx`
- `src/lib/dragonArena.ts`
- `docs/apps/dragon-arena.md`
- `.env.example`

## Next practical step
Do one production scene-generation smoke test after the new deployment is live. If HF returns a provider/model error, change only `HF_IMAGE_MODEL` first; avoid reintroducing the old OpenRouter image fallback unless product requirements change.
