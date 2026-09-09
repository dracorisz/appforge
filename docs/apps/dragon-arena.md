# Dragon Arena

A turn-based fantasy adventure with a Hugging Face-powered game master and scene generator. Signed-in runs persist to AppForge; guest mode allows one browser-local AI turn per UTC day.

## Routes

- Game: `/apps/ai-dragon-arena` (legacy `/pf-ai-dragon-arena` redirects here)
- Public Hugging Face integration + generated showcase: `/huggingface`

## Gameplay loop

1. Choose a suggested action or type an action.
2. `POST /api/ai-game` requests a narrative + exactly three choices.
3. Signed-in turns persist to `dragon_arena_turns` and update the active session.
4. `POST /api/dragon-image` generates a cinematic scene from the latest narrative.
5. Generated scenes persist to `dragon_arena_assets`; turns/scenes contribute to points.
6. The first three generated scene assets for each user are automatically marked public for the `/huggingface` showcase. Later assets remain owner-only unless explicitly published later.

## Hugging Face game-master rotation

Normal AppForge and guest traffic no longer depends on the shared OpenRouter free endpoint. `api/ai-game.js` calls the Hugging Face OpenAI-compatible router:

`https://router.huggingface.co/v1/chat/completions`

Server tokens rotate through `HF_TOKEN_1`, `HF_TOKEN_2`, and `HF_TOKEN_3`. For each token the endpoint tries the model list until one succeeds.

Default order:

1. `Qwen/Qwen2.5-7B-Instruct-1M:cheapest` — primary long-context conversational model.
2. `google/gemma-2-2b-it:cheapest` — compact instruction-following fallback.
3. `openai/gpt-oss-120b:cheapest` — larger capability fallback routed through Hugging Face Inference Providers.

`HF_TEXT_MODEL` can prepend an environment-selected preferred model.

A signed-in user can still supply a personal `sk-or-...` OpenRouter key. That personal request remains isolated from the shared Hugging Face pool and is not persisted server-side.

## Hugging Face scene rotation

`api/dragon-image.js` uses Hugging Face HF Inference:

`https://router.huggingface.co/hf-inference/models/<model>`

Default image order:

1. `stabilityai/stable-diffusion-3-medium-diffusers` — primary Dragon Arena renderer.
2. `stabilityai/stable-diffusion-xl-base-1.0` — compatibility fallback.

`HF_IMAGE_MODEL` can prepend a preferred compatible model. Each scene request rotates across both available server tokens and image models before it fails.

Newer provider-routed image models such as FLUX or Qwen Image are intentionally not mixed into the raw HF Inference request path yet because they may require a different Inference Provider contract. They should be added when the image endpoint moves to the provider SDK or a provider-specific REST implementation.

## Quotas and failure behavior

- Guest game: one AI turn per UTC day using browser localStorage; no account persistence, points, gallery or scene generation.
- Signed-in owner-funded game: one AI turn per UTC day.
- Signed-in owner-funded scene: one image turn per UTC day.
- Personal OpenRouter key: bypasses the signed-in GM allowance for that user.
- Personal Hugging Face token: bypasses the owner-funded image allowance for that scene request.
- Provider/model failures rotate to the remaining model/token combinations.
- If every shared GM provider attempt fails, the signed-in owner-funded turn is refunded and the UI receives a neutral temporary-unavailable message rather than exposing a provider rate-limit message.
- If every image attempt fails, the owner-funded image turn is refunded.

## Public Hugging Face gallery

`/huggingface` is public and uses the AppForge favicon/branding. It contains:

- the exact game-master model rotation;
- the exact image model rotation;
- a live public gallery of generated Dragon Arena scenes;
- creator display name/avatar only when the creator profile is public;
- up to three showcase scenes per user.

Migration `20260909153000_dragon_arena_public_gallery.sql` installs a `before insert` trigger so a user's first three `scene` assets are automatically public, backfills the same rule for existing scenes, and exposes the capped `dragon_arena_public_gallery()` RPC to `anon` and `authenticated`. The RPC deliberately does not expose the creator's Supabase user ID.

The signed-in Dragon Arena gallery remains owner-scoped via existing RLS and `listAssets()` behavior.

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
HF_TEXT_MODEL=Qwen/Qwen2.5-7B-Instruct-1M:cheapest  # optional preferred override
HF_IMAGE_MODEL=stabilityai/stable-diffusion-3-medium-diffusers  # optional preferred override
```

Hugging Face tokens need permission to make calls to Inference Providers.

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
| `api/ai-game.js` | Hugging Face-first GM endpoint with token/model rotation |
| `api/dragon-image.js` | Hugging Face scene endpoint with token/model rotation |
| `src/components/dashboard/PF_AIDragonArena.tsx` | Signed-in Dragon Arena UI |
| `src/components/dashboard/PF_GuestDragonArena.tsx` | Guest one-turn UI |
| `src/components/public/HuggingFaceGalleryPage.tsx` | Public HF integration/model/gallery page |
| `src/lib/dragonArena.ts` | Sessions, turns, assets, points and leaderboard helpers |
| `supabase/migrations/20260909153000_dragon_arena_public_gallery.sql` | First-three public showcase trigger + public RPC |
