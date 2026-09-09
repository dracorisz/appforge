# Dragon Arena

A persistent, turn-based fantasy adventure powered by a server-side AI game master. Tied to your AppForge account.

## Route

`/apps/ai-dragon-arena` (also redirects from `/pf-ai-dragon-arena`)

## Gameplay loop

1. **Play** — choose a suggested action or type your own.
2. **GM turn** — `POST /api/ai-game` returns narrative + 3 choices.
3. **Persist** — the turn is saved to `dragon_arena_turns` and the session is updated.
4. **Scene** — `POST /api/dragon-image` generates a cinematic scene from the latest narrative.
5. **Points** — turns award 10 points, scenes award 1 point.
6. **Leaderboard** — public profiles only.

## Opening scenes

A run begins from one of several opening scenarios, selected at random on each New Run. The chosen scenario is persisted in `dragon_arena_sessions.metadata.opening` so it is restored exactly after refresh or when switching sessions — sessions created before this feature fall back to the Ember Vault opening.

| Scenario | First line |
|---|---|
| Ember Vault | You enter the Ember Vault beneath WildDragons Keep… |
| Sunken Library | The obsidian library floats on black water… |
| Scale Bridge | Rope bridges sway between the ribs of a petrified dragon… |
| Forgotten Bazaar | The market is frozen in ash; vendors of bone and bronze… |

Each opening ships three suggested first choices. Subsequent GM turns continue from the live OpenRouter narrative.

## Persistence

| Table | Purpose |
|---|---|
| `dragon_arena_sessions` | One row per run; `user_id`, `title`, `summary`, `turn_count`, `metadata` |
| `dragon_arena_turns` | One row per turn; `session_id`, `user_id`, `turn_number`, `player_action`, `narrative`, `choices`, `model` |
| `dragon_arena_assets` | Generated scenes + saved scrapper results; `session_id`, `user_id`, `asset_type`, `storage_path`, `external_url`, `is_public`, `mint_status`, `metadata` |
| `dragon_arena_points` | Per-user points ledger; `points`, `turns_played`, `scenes_created` |
| `dragon_arena_daily_usage` | Daily AI-turn quota (1/day unless personal key) |
| `dragon_arena_image_usage` | Daily image-turn quota (1/day unless personal key) |

## Quota

- **AI turns**: 1 per day (UTC) unless a personal OpenRouter key is supplied.
- **Image turns**: 1 per day (UTC) unless a personal OpenRouter key is supplied.
- Personal keys bypass the quota and are sent only for the active request; they are never stored.

## Providers

- **Game master**: OpenRouter (`openrouter/free` by default; `OPENROUTER_MODEL` env override).
- **Scene generation**: OpenRouter image modality first, then Hugging Face Inference API as a fallback.
- **HF tokens**: `HF_TOKEN_1/2/3` rotate round-robin on the server. A personal HF token (`x-hf-token` header) overrides rotation.

## Asset gallery

`listAssets(userId, { sessionId })` enforces ownership: only the caller's assets for that session are returned. Public assets are only returned when `publicOnly` is set. This prevents cross-run leaks.

## Leaderboard

`dragon_arena_leaderboard(limit)` joins `dragon_arena_points` with `profiles` filtered to `is_public = true`. Only public profiles appear.

## Security

- Every request requires a valid Supabase access token; the user ID is taken from the token, never from the request body.
- Quota is enforced server-side via `security definer` RPCs that check `auth.uid()`.
- Points are awarded via `award_dragon_arena_points`, which clamps deltas to non-negative.
- RLS on all Dragon Arena tables is owner-only.

## Files

| File | Role |
|---|---|
| `api/ai-game.js` | Game master endpoint |
| `api/dragon-image.js` | Scene generation endpoint |
| `src/lib/dragonArena.ts` | Client helpers (sessions, turns, assets, points, leaderboard) |
| `src/components/dashboard/PF_AIDragonArena.tsx` | UI |
| `supabase/migrations/20260908231934_dragon_arena_usage_and_session_logs.sql` | Sessions, turns, assets, daily usage |
| `supabase/migrations/20260909120000_dragon_arena_image_usage.sql` | Image usage + storage bucket |
| `supabase/migrations/20260909133000_dragon_arena_points_gallery.sql` | Points, leaderboard, asset gallery columns |