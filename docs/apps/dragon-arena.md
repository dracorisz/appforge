# Dragon Arena

A turn-based fantasy adventure with a Hugging Face-powered game master and scene generator. Signed-in runs persist to AppForge; guest mode allows one browser-local turn per UTC day.

## Current app version

**Dragon Arena 1.5.0** — Hugging Face provider-aware scene generation, atomic asset persistence, public showcase metadata, theme-aware story UI, Media Vault linkage, and provider/model rotation.

## Routes

- Game: `/apps/ai-dragon-arena` (legacy `/pf-ai-dragon-arena` redirects here)
- Public Hugging Face integration + generated showcase: `/huggingface`

## Gameplay loop

1. Choose a suggested action or type an action.
2. `POST /api/ai-game` requests a narrative + exactly three choices.
3. Signed-in turns persist to `dragon_arena_turns` and update the active session.
4. `POST /api/dragon-image` generates a cinematic scene from the latest narrative.
5. The image endpoint uploads validated bytes and writes the authoritative `dragon_arena_assets` row before returning success.
6. The latest generated scene restores after refresh and renders as a compact cinematic beat inside Story; older scenes remain in Assets/Media Vault.
7. The first three generated scene assets for each user are automatically public showcase assets. Later assets remain owner-only unless explicitly published.
8. Media Vault links Dragon Arena scenes and Scrapper Pro saved results from their source ledgers instead of duplicating files.

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

A signed-in user can still supply a personal `sk-or-...` OpenRouter key as a compatibility path. `api/ai-game.js` also accepts `x-hf-token` for a personal Hugging Face token.

### GM failure behavior

- Every Hugging Face request has an 18-second timeout.
- The endpoint exhausts token × model combinations before giving up on HF.
- Provider errors are logged server-side without exposing tokens.
- If all remote providers fail, Dragon Arena returns a clearly identified `appforge/local-continuity-fallback` narrative instead of stopping the game with an API-limit error.
- The response includes `provider`, `model`, and `degraded` so the UI/telemetry can distinguish a real HF turn from local continuity fallback.

The local fallback is continuity protection, not a replacement for Hugging Face; HF remains the primary game-master path.

## Hugging Face scene rotation

Scene generation uses the Hugging Face **Inference Providers** ecosystem rather than assuming a model remains available on one fixed backend.

For each preferred image model, `api/dragon-image.js` requests the model's current `inferenceProviderMapping` from Hugging Face, filters to live `text-to-image` providers that AppForge supports, and then tries compatible provider routes within one bounded generation request.

Default image model order:

1. `black-forest-labs/FLUX.1-schnell` — primary fast fantasy scene renderer.
2. `ByteDance/Hyper-SD` — fast diffusion fallback.
3. `stabilityai/stable-diffusion-xl-base-1.0` — established compatibility fallback.

Supported routed image providers:

- `fal-ai`
- `replicate`
- `together`
- `nscale`
- `hf-inference`

`HF_IMAGE_MODEL` can prepend a preferred model. The full retry space is effectively **server token × image model × live provider mapping**, bounded by an overall ~52-second request budget so a scene request cannot hang indefinitely.

Provider-specific adapters currently cover:

- Fal queue submit/status/result flow;
- Replicate prediction flow using `Prefer: wait`;
- Together/Nscale OpenAI-style image-generation responses;
- raw HF Inference image bytes as a compatibility route.

The retired `stabilityai/stable-diffusion-3-medium-diffusers` default remains removed after Hugging Face stopped supporting it on the old route.

## Scene persistence integrity

Scene generation is server-authoritative:

1. Validate the authenticated user and confirm the supplied session belongs to that user.
2. Reserve the shared image allowance unless a personal HF token is used.
3. Rotate Hugging Face token × image model × live provider until valid image bytes are returned.
4. Validate MIME type, payload presence and maximum size.
5. Upload bytes to `dragon-arena-assets/{userId}/{uuid}.{ext}`.
6. Insert the corresponding `dragon_arena_assets` row with `storage_path`, `external_url`, MIME type, prompt, model, Hugging Face provider, provider model, generation timestamp, byte size, turn number and personal-token flag.
7. Only then return success to the browser.
8. If the ledger insert fails, remove the just-uploaded object and refund an owner-funded image turn.

`storage_path` has a unique index. Client-side `saveAsset()` is idempotent so older clients that try to save the same generated path do not create duplicates.

Production schema fixes are tracked by:

- `20260909083930_dragon_arena_asset_integrity_and_public_gallery.sql`
- `20260909084011_dragon_arena_allow_scene_asset_type.sql`
- `20260909084319_dragon_arena_allow_external_scrapper_assets.sql`

The first fixes the old client/schema mismatch where the client inserted `external_url` although the production table did not yet contain that column. That mismatch caused valid Storage uploads to become orphaned after the DB insert failed.

## Theme-aware game UI

The signed-in game surface uses AppForge semantic theme tokens controlled by Settings → Appearance:

- `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`
- `border-border`
- `bg-primary` / `text-primary-foreground` for the player bubble, so accent color follows the selected appearance
- shared themed `Button`, `Card`, `Input`, and `Badge` components

The cinematic hero artwork remains an image treatment, but its overlay is theme-aware. Only the latest generated scene is shown in Story; the full scene history remains available from Assets and Media Vault.

## Quotas

- Guest game: one turn per UTC day using browser localStorage; no account persistence, points, private gallery or scene generation.
- Signed-in owner-funded game: one turn per UTC day.
- Signed-in owner-funded scene: one image turn per UTC day.
- Personal OpenRouter key: bypasses the signed-in shared GM allowance for that user.
- Personal Hugging Face token: bypasses the owner-funded image allowance and can also be used for GM requests.
- Failed owner-funded image generation or persistence refunds the image turn.

## Public Hugging Face gallery

`/huggingface` is public and uses AppForge branding. It contains the exact GM/image model rotations, the currently supported image-provider set, and a live generated-scene gallery.

The public RPC returns at most the first three public scenes per user and includes:

- model
- provider
- provider model for new provider-aware generations
- generation timestamp
- MIME type
- byte size
- turn number when available
- prompt and creator public-profile information

Two legacy orphaned scene files were recovered into the ledger. Their exact image model was not persisted by the old flow, so they are labeled `unknown-legacy` rather than guessing a model.

## Media Vault integration

Media Vault treats Dragon Arena and Scrapper Pro as linked source folders:

- `Dragon Arena` reads the signed-in user's `dragon_arena_assets` rows with `asset_type = 'scene'`.
- `Scrapper Pro` reads `asset_type = 'scrapper-result'`.
- General/manual uploads continue to use the private `user-media-vault` bucket/table.
- Linked Dragon Arena/Scrapper assets are not double-counted against the private upload quota.
- Preview/download resolves the correct source bucket or external URL.

Production drift repair restored the missing `user_media_vault` / `user_media_quotas` tables, quota/upload RPCs, private bucket and RLS/storage policies. The repair is committed as a follow-up migration so future environments cannot silently reproduce the drift.

## Points

`award_dragon_arena_points()` is a security-definer RPC that derives the target user from `auth.uid()`. Production originally had EXECUTE restricted to `service_role`, which caused client `403` responses even though gameplay persistence succeeded. Authenticated EXECUTE has been restored; the function still cannot award points to a caller-supplied user ID.

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
| `dragon_arena_assets` | Generated scenes and imported/saved source assets |
| `dragon_arena_points` | Points, turns played and scenes created |
| `dragon_arena_daily_usage` | Signed-in daily GM allowance |
| `dragon_arena_image_usage` | Signed-in daily scene allowance |

## Important files

| File | Role |
|---|---|
| `api/ai-game.js` | Hugging Face-first GM endpoint with token/model/provider rotation + continuity fallback |
| `api/dragon-image.js` | Provider-aware Hugging Face scene endpoint with atomic storage + asset-ledger persistence |
| `src/components/dashboard/PF_AIDragonArena.tsx` | Theme-aware signed-in story UI with compact inline latest scene |
| `src/components/dashboard/PF_GuestDragonArena.tsx` | Guest one-turn UI |
| `src/components/public/HuggingFaceGalleryPage.tsx` | Public HF integration/model/provider/metadata/gallery page |
| `src/lib/dragonArena.ts` | Sessions, turns, assets, points and leaderboard helpers |
| `src/lib/mediaVault.ts` | Private uploads plus linked Dragon Arena/Scrapper source assets |
