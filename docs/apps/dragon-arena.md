# Dragon Arena

A turn-based fantasy adventure with a Hugging Face-powered game master and scene generator. Signed-in runs persist to AppForge; guest mode allows one browser-local turn per UTC day.

## Current app version

**Dragon Arena 1.7.0** — faster choice-driven turns, compact Story artwork, one funded Hugging Face GM turn per day with unlimited local continuity afterward, provider-aware scene generation, atomic asset persistence, public showcase metadata, theme-aware UI, Media Vault linkage, and Generate Scene telemetry.

## Routes

- Game: `/apps/ai-dragon-arena` (legacy `/pf-ai-dragon-arena` redirects here)
- Public Hugging Face integration + generated showcase: `/huggingface`
- Legacy `/workspace` redirects to `/apps`; the duplicate app renderer was retired so Dragon Arena metadata/icon rendering has one canonical dashboard path.

## Gameplay loop

1. Choose a suggested action or type an action.
2. `POST /api/ai-game` returns a short 45–85 word narrative beat plus exactly three concise choices.
3. Each GM beat should introduce one clear consequence, discovery, danger, reward, or twist instead of long exposition.
4. Signed-in turns persist to `dragon_arena_turns` and update the active session.
5. The owner-funded Hugging Face GM allowance is one remote turn per UTC day; after it is consumed, signed-in play continues through the local continuity GM rather than locking the game.
6. `POST /api/dragon-image` generates a cinematic scene from the latest narrative.
7. The image endpoint uploads validated bytes and writes the authoritative `dragon_arena_assets` row before returning success.
8. The latest generated scene restores after refresh and renders as a compact visual beat inside Story; older scenes remain in Assets/Media Vault.
9. The first three generated scene assets for each user are automatically public showcase assets. Later assets remain owner-only unless explicitly published.

## Game-master pacing

Dragon Arena 1.7 changes the response contract to keep turns playable:

- Narrative target: **45–85 words**.
- Structure: **2–3 short paragraphs**.
- Every turn must materially change the situation.
- Choices: exactly **three**, each **2–6 words**, beginning with a strong action verb where practical.
- Recent context sent to the GM is intentionally bounded to the latest six entries to reduce repetition and latency.
- The local continuity fallback follows the same compact pacing instead of producing a long prose block.

## Hugging Face game-master rotation

Normal owner-funded traffic uses the Hugging Face OpenAI-compatible router:

`https://router.huggingface.co/v1/chat/completions`

Server tokens rotate through `HF_TOKEN_1`, `HF_TOKEN_2`, and `HF_TOKEN_3`. For each token the endpoint tries the model list until one succeeds. Multiple tokens belonging to the same Hugging Face account can still share an account-level provider/credit limit, so model/provider policy rotation matters as much as token rotation.

Default order:

1. `openai/gpt-oss-20b:fastest` — primary low-latency conversational model.
2. `Qwen/Qwen2.5-7B-Instruct-1M:fastest` — long-context instruction-following fallback.
3. `google/gemma-2-2b-it:fastest` — compact fallback.
4. `openai/gpt-oss-120b:cheapest` — larger capability fallback.

`HF_TEXT_MODEL` can prepend an environment-selected preferred model.

A signed-in user can supply a personal `sk-or-...` OpenRouter key as a compatibility path. `api/ai-game.js` also accepts `x-hf-token` for a personal Hugging Face token.

### GM quota and failure behavior

- Every Hugging Face request has an 18-second timeout.
- The endpoint exhausts token × model combinations before giving up on HF.
- Provider errors are logged server-side without exposing tokens.
- If the shared daily HF allowance has already been consumed, signed-in play continues immediately through `appforge/local-continuity-fallback` rather than returning HTTP 429.
- If remote providers fail during an otherwise eligible funded request, the same local fallback keeps the game moving.
- The response includes `provider`, `model`, and `degraded` so the UI/telemetry can distinguish a real HF turn from local continuity.

The local fallback is continuity protection, not a replacement for Hugging Face; HF remains the primary funded game-master path.

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

`HF_IMAGE_MODEL` can prepend a preferred model. The retry space is effectively **server token × image model × live provider mapping**, bounded by an overall ~52-second request budget.

Provider-specific adapters currently cover:

- Fal queue submit/status/result flow;
- Replicate prediction flow using `Prefer: wait`;
- Together/Nscale OpenAI-style image-generation responses;
- raw HF Inference image bytes as a compatibility route.

The retired `stabilityai/stable-diffusion-3-medium-diffusers` default remains removed.

## Generate Scene telemetry

Generate Scene responses include sanitized troubleshooting metadata:

- `requestId`
- `durationMs`
- selected model/provider on success
- model/provider/status attempt summaries on provider-rotation failure

No Hugging Face token, Supabase token, or other provider secret is included in client-visible telemetry.

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

`storage_path` has a unique index. Client-side `saveAsset()` remains idempotent for compatibility with older clients.

Production schema fixes are tracked by:

- `20260909083930_dragon_arena_asset_integrity_and_public_gallery.sql`
- `20260909084011_dragon_arena_allow_scene_asset_type.sql`
- `20260909084319_dragon_arena_allow_external_scrapper_assets.sql` — historical compatibility; new Scrapper saves have since moved out of the Dragon ledger.

## Theme-aware Story UI

The signed-in game surface uses AppForge semantic theme tokens controlled by Settings → Appearance:

- `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`
- `border-border`
- `bg-primary` / `text-primary-foreground` for player/action emphasis
- shared themed `Button`, `Card`, `Input`, and `Badge` components

Only the latest generated scene appears inline in Story. In 1.7 it is intentionally rendered as a compact visual beat rather than a gallery-sized image: desktop width is capped around 27rem with an approximately 10.5rem-high crop; mobile uses a shorter full-width crop. Clicking still opens the full asset. Older scenes remain in Assets and Media Vault.

## Quotas

- Guest game: one turn per UTC day using browser localStorage; no account persistence, points, private gallery or scene generation.
- Signed-in shared GM: one owner-funded Hugging Face turn per UTC day, then unlimited local continuity turns so gameplay remains available.
- Signed-in owner-funded scene: one image turn per UTC day.
- Personal OpenRouter key: compatibility path that can power GM turns without the shared allowance.
- Personal Hugging Face token: bypasses the owner-funded image allowance and can also be used for GM requests.
- Failed owner-funded image generation or persistence refunds the image turn.

## Public Hugging Face gallery

`/huggingface` is public and uses AppForge branding. It contains the exact GM/image model rotations, currently supported image-provider set, and a live generated-scene gallery.

The public RPC returns at most the first three public scenes per user and includes model, provider, provider model, generation timestamp, MIME type, byte size, turn number when available, prompt, and creator public-profile information.

Two legacy orphaned scene files were recovered into the ledger. Their exact image model was not persisted by the old flow, so they are labeled `unknown-legacy` rather than guessing a model.

## Media Vault integration

Media Vault uses source-specific ownership:

- **Dragon Arena** reads the signed-in user's `dragon_arena_assets` scene rows; the game ledger remains authoritative.
- **Scrapper Pro** signed-in saves live directly in `user_media_vault` as external source references.
- **General** manual uploads use `user_media_vault` plus the private `user-media-vault` bucket.
- Dragon Arena scenes are not copied into the private vault, and Scrapper references contain zero stored bytes.

Migration `20260909174500_decouple_scrapper_pro_into_media_vault.sql` removes the new-save dependency between Scrapper Pro and Dragon Arena while preserving/backfilling historical `scrapper-result` rows when present.

## Points

`award_dragon_arena_points()` is a security-definer RPC that derives the target user from `auth.uid()`. Authenticated EXECUTE is enabled; the function cannot award points to a caller-supplied user ID.

## Required environment

```text
HF_TOKEN_1=hf_...
HF_TOKEN_2=hf_...        # optional
HF_TOKEN_3=hf_...        # optional
HF_TEXT_MODEL=openai/gpt-oss-20b:fastest             # optional preferred override
HF_IMAGE_MODEL=black-forest-labs/FLUX.1-schnell     # optional preferred override
```

Hugging Face tokens need permission to make calls to Inference Providers. Three tokens do not necessarily provide three independent quotas when they belong to the same HF account.

## Persistence

| Table | Purpose |
|---|---|
| `dragon_arena_sessions` | Persistent signed-in runs |
| `dragon_arena_turns` | Player actions, GM narrative, choices and model |
| `dragon_arena_assets` | Dragon Arena generated scenes and historical compatibility assets |
| `dragon_arena_points` | Points, turns played and scenes created |
| `dragon_arena_daily_usage` | Owner-funded remote GM allowance |
| `dragon_arena_image_usage` | Signed-in daily scene allowance |

## Important files

| File | Role |
|---|---|
| `api/ai-game.js` | Hugging Face-first GM with compact pacing and unlimited local continuity after shared quota |
| `api/dragon-image.js` | Provider-aware Hugging Face scene endpoint with telemetry and atomic persistence |
| `src/components/dashboard/PF_AIDragonArena.tsx` | Theme-aware signed-in Story UI |
| `src/index.css` | Compact inline Dragon Arena scene presentation |
| `src/components/dashboard/PF_GuestDragonArena.tsx` | Guest one-turn UI |
| `src/components/public/HuggingFaceGalleryPage.tsx` | Public HF integration/model/provider/metadata/gallery page |
| `src/lib/dragonArena.ts` | Sessions, turns, assets, points and leaderboard helpers |
| `src/lib/mediaVault.ts` | General uploads, linked Dragon scenes, and Scrapper external references |
| `docs/STABILIZATION_TRACKER.md` | Current implementation/verification/open-task status |
