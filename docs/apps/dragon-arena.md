# Dragon Arena

A turn-based fantasy adventure with a Hugging Face-powered game master and scene generator. Signed-in runs persist to AppForge; guest mode allows one browser-local turn per UTC day.

## Routes

- Game: `/apps/ai-dragon-arena` (legacy `/pf-ai-dragon-arena` redirects here)
- Public Hugging Face integration + generated showcase: `/huggingface`

## Gameplay loop

1. Choose a suggested action or type an action.
2. `POST /api/ai-game` requests a narrative + exactly three choices.
3. Signed-in turns persist to `dragon_arena_turns` and update the active session.
4. `POST /api/dragon-image` generates a cinematic scene from the latest narrative.
5. Generated scenes persist to `dragon_arena_assets`; turns/scenes contribute to points.
6. The first three generated scene assets for each user are automatically public showcase assets. Later assets remain owner-only unless explicitly published.

## Hugging Face game-master rotation

Normal AppForge and guest traffic uses the Hugging Face OpenAI-compatible router:

`https://router.huggingface.co/v1/chat/completions`

Server tokens rotate through `HF_TOKEN_1`, `HF_TOKEN_2`, and `HF_TOKEN_3`. For each token the endpoint tries the model list until one succeeds. Multiple tokens belonging to the same Hugging Face account can still share an account-level provider/credit limit, so model/provider policy rotation matters as much as token rotation.

Default order:

1. `openai/gpt-oss-20b:fastest` — primary low-latency conversational model.
2. `Qwen/Qwen2.5-7B-Instruct-1M:fastest` — long-context instruction-following fallback.
3. `google/gemma-2-2b-it:fastest` — compact fallback.
4. `openai/gpt-oss-120b:cheapest` — larger capability fallback.

`HF_TEXT_MODEL` can prepend an environment-selected preferred model.

A signed-in user can still supply a personal `sk-or-...` OpenRouter key. `api/ai-game.js` also accepts `x-hf-token` when a personal Hugging Face token is wired from the UI.

### GM failure behavior

- Every Hugging Face request has an 18-second timeout.
- The endpoint exhausts token × model combinations before giving up on HF.
- Provider errors are logged server-side without exposing tokens.
- If all remote providers fail, Dragon Arena returns a clearly identified `appforge/local-continuity-fallback` narrative instead of stopping the game with an API-limit error.
- The response includes `provider`, `model`, and `degraded` so the UI/telemetry can distinguish a real HF turn from local continuity fallback.

The local fallback is continuity protection, not a replacement for Hugging Face; HF remains the primary game-master path.

## Hugging Face scene rotation

`api/dragon-image.js` uses Hugging Face HF Inference:

`https://router.huggingface.co/hf-inference/models/<model>`

Default image order:

1. `black-forest-labs/FLUX.1-schnell` — primary fast fantasy scene renderer.
2. `stabilityai/stable-diffusion-xl-base-1.0` — compatibility fallback.

The retired `stabilityai/stable-diffusion-3-medium-diffusers` default was removed after Hugging Face reported it unavailable/deprecated on this route.

`HF_IMAGE_MODEL` can prepend a preferred compatible model. Each scene request rotates across available server tokens and image models before failing. Image calls use a 45-second timeout.

## Quotas

- Guest game: one turn per UTC day using browser localStorage; no account persistence, points, private gallery or scene generation.
- Signed-in owner-funded game: one turn per UTC day.
- Signed-in owner-funded scene: one image turn per UTC day.
- Personal OpenRouter key: bypasses the signed-in shared GM allowance for that user.
- Personal Hugging Face token: bypasses the owner-funded image allowance; the API also supports it for GM requests when the UI sends it.
- Failed owner-funded image generation refunds the image turn.

## Public Hugging Face gallery

`/huggingface` is public and uses AppForge branding. It contains the exact GM/image model rotations and a live generated-scene gallery.

Migration `20260909153000_dragon_arena_public_gallery.sql` installs the first-three-public showcase policy and exposes the capped `dragon_arena_public_gallery()` RPC to `anon` and `authenticated`. The signed-in Dragon Arena gallery remains owner-scoped via RLS and `listAssets()`.

## Image integrity

Generated image responses are validated before upload:

- response content type must be image-compatible;
- empty responses are rejected;
- payloads over 15 MB are rejected;
- stored extension follows JPEG/WebP/PNG MIME type;
- only validated bytes are uploaded to `dragon-arena-assets`.

## Required environment

```text
HF_TOKEN_1=hf_...
HF_TOKEN_2=hf_...        # optional
HF_TOKEN_3=hf_...        # optional
HF_TEXT_MODEL=openai/gpt-oss-20b:fastest              # optional preferred override
HF_IMAGE_MODEL=black-forest-labs/FLUX.1-schnell      # optional preferred override
```

Hugging Face tokens need permission to make calls to Inference Providers. Three tokens do not necessarily provide three independent quotas when they belong to the same HF account.

## Persistence

| Table | Purpose |
|---|---|
| `dragon_arena_sessions` | Persistent signed-in runs |
| `dragon_arena_turns` | Player actions, GM narrative, choices and model |
| `dragon_arena_assets` | Generated scenes and imported Dragon Arena assets |
| `dragon_arena_points` | Points, turns played and scenes created |
| `dragon_arena_daily_usage` | Signed-in daily GM allowance |
| `dragon_arena_image_usage` | Signed-in daily scene allowance |

## Important files

| File | Role |
|---|---|
| `api/ai-game.js` | Hugging Face-first GM endpoint with token/model/provider rotation + continuity fallback |
| `api/dragon-image.js` | Hugging Face scene endpoint with token/model rotation |
| `src/components/dashboard/PF_AIDragonArena.tsx` | Signed-in Dragon Arena UI |
| `src/components/dashboard/PF_GuestDragonArena.tsx` | Guest one-turn UI |
| `src/components/public/HuggingFaceGalleryPage.tsx` | Public HF integration/model/gallery page |
| `src/lib/dragonArena.ts` | Sessions, turns, assets, points and leaderboard helpers |
| `supabase/migrations/20260909153000_dragon_arena_public_gallery.sql` | First-three public showcase trigger + public RPC |
