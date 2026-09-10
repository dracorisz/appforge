# AppForge — Agent Handoff

## Quick start

- **Repo**: `dracorisz/appforge`
- **Branch**: `main`
- **Production**: `https://www.sstoken.space/`
- **Docs**: `https://dracorisz.github.io/appforge/`
- **Integrated environment guide**: `docs/ENVIRONMENT.md`
- **Dev**: `npm run dev`
- **Typecheck**: `npm run typecheck`
- **Build**: `npm run build`
- **Stabilization source of truth**: `docs/STABILIZATION_TRACKER.md`

Before acting on feature-specific notes below, read `docs/ENVIRONMENT.md`. It defines the current browser/server secret boundary, integrated services, validation contract, Pages/Vercel release split, and the source-of-truth files a new developer or agent should inspect.

Use the tracker before relying on older chat/session notes. It distinguishes code-complete work from production verification that may still be hidden by deployment lag.

## Current architecture

### Dragon Arena

- Signed-in sessions, turns, assets and points persist in Supabase.
- Guest mode allows one browser-local turn per UTC day and does not expose account persistence or scene generation.
- The primary game master is Hugging Face through `api/ai-game.js` with server token/model rotation.
- If all remote GM attempts fail, a clearly identified AppForge local-continuity response keeps the run playable rather than returning the old API-limit dead end.
- Personal OpenRouter remains a compatibility option; a personal Hugging Face token is also accepted.
- Scene generation is Hugging Face provider-aware through `api/dragon-image.js`.
- Image generation resolves each model's current Hugging Face `inferenceProviderMapping` and can route through `fal-ai`, `replicate`, `together`, `nscale`, or `hf-inference` when available.
- Current preferred image models are FLUX.1-schnell, Hyper-SD, then SDXL, with an optional `HF_IMAGE_MODEL` override prepended.
- Scene persistence is server-authoritative: validate → generate → validate bytes → Storage upload → `dragon_arena_assets` insert → success response.
- Failed persistence removes the new object and refunds an owner-funded image turn.
- The latest scene renders compactly inside Story; older scenes remain in Assets and Media Vault.
- The first three generated scenes per user are public showcase assets exposed through `/huggingface`.
- Scene rows retain generation model/provider/timestamp/MIME/size/turn metadata.

### Media Vault

- `General` stores manual uploads in the private `user-media-vault` bucket with `user_media_vault` rows.
- `Dragon Arena` links authoritative scene rows from `dragon_arena_assets`; scene bytes are not copied.
- `Scrapper Pro` now stores signed-in saves directly in `user_media_vault` as deduplicated zero-byte external references.
- New Scrapper saves no longer create `dragon_arena_assets` records.
- Manual uploads go only to General; Dragon Arena and Scrapper Pro are source-backed folders.
- Production schema/RPC/bucket drift that previously caused Media Vault 404s has been repaired and tracked in migrations.
- Media Vault extended with external references + source identity for Scrapper Pro.

### Scrapper Pro

- Guest/local saves remain in browser `localStorage`.
- Signed-in users can separately archive a result to Media Vault.
- Media Vault archive deduplication uses the original result URL as the stable source reference.
- Existing preview, search, partial-source failure, article PDF, post TXT and supported media-download behavior remains intact.

### Profile / People

- Profile data supports independent `show_skills`, `show_website`, `show_github`, `show_email`, and `public_email` fields.
- People already respects those flags.
- Settings still needs the corresponding field-visibility controls; keep this item OPEN until the controls and preview are updated.

## Current environment

The canonical variable inventory is `.env.example`; the handling rules and service map are in `docs/ENVIRONMENT.md`.

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

HF_TOKEN_1=hf_...
HF_TOKEN_2=hf_...        # optional
HF_TOKEN_3=hf_...        # optional
HF_TEXT_MODEL=openai/gpt-oss-20b:fastest             # optional preferred override
HF_IMAGE_MODEL=black-forest-labs/FLUX.1-schnell     # optional preferred override

OPENROUTER_API_KEY=      # compatibility / personal-owner GM path if retained
OPENROUTER_MODEL=        # optional
```

Do not expose server tokens in `VITE_*` variables. Do not copy real credentials into handoffs.

## Dragon Arena provider behavior

### GM order

Default text-model order:

1. `openai/gpt-oss-20b:fastest`
2. `Qwen/Qwen2.5-7B-Instruct-1M:fastest`
3. `google/gemma-2-2b-it:fastest`
4. `openai/gpt-oss-120b:cheapest`

Server tokens rotate through `HF_TOKEN_1/2/3`. Multiple tokens from the same Hugging Face account may still share provider/account quota.

### Scene order

Default model preference:

1. `black-forest-labs/FLUX.1-schnell`
2. `ByteDance/Hyper-SD`
3. `stabilityai/stable-diffusion-xl-base-1.0`

Supported provider adapters:

- `fal-ai`
- `replicate`
- `together`
- `nscale`
- `hf-inference`

The request has an overall bounded generation budget so provider/model failover cannot run indefinitely.

## Production data repairs already performed

- Dragon Arena asset schema aligned with `scene` rows and `external_url`.
- First-three public gallery policy/RPC added.
- Legacy orphaned Dragon scene files recovered into the asset ledger where identifiable.
- `award_dragon_arena_points` authenticated execution restored after an observed client 403.
- Missing Media Vault tables/RPCs/private bucket/storage policies recreated in production and tracked in repo migrations.
- Media Vault extended with external references + source identity for Scrapper Pro.

## Version state

Registry targets currently are:

- Dragon Arena **1.6.0**
- Scrapper Pro **1.2.0**
- Media Vault **1.1.0**
- AppForge changelog includes **1.21.0**

The root `package.json` is still **1.18.0**. This is intentionally tracked as an OPEN version-alignment task rather than silently changing the package/lockfile during feature stabilization.

## Files to inspect first

1. `docs/ENVIRONMENT.md`
2. `docs/STABILIZATION_TRACKER.md`
3. `api/ai-game.js`
4. `api/dragon-image.js`
5. `src/components/dashboard/PF_AIDragonArena.tsx`
6. `src/lib/mediaVault.ts`
7. `src/components/dashboard/PF_UserMediaVault.tsx`
8. `src/components/dashboard/PF_ScrapperPro.tsx`
9. `src/components/resources/Settings.tsx`
10. `src/components/resources/People.tsx`
11. `src/lib/registry.ts`

## Next practical work

Follow `docs/STABILIZATION_TRACKER.md`. Highest-value remaining code items are:

1. add Settings → Profile field visibility controls and make its preview honor them;
2. finish canonical Dragon Arena icon wiring in any remaining legacy renderer such as `/workspace`;
3. align package/global versioning after the stabilization release boundary is chosen;
4. remove dead MySQL setup and add real linting as separate build-hygiene changes;
5. production-smoke-test the current Hugging Face scene provider routing after the latest deployment is active.
