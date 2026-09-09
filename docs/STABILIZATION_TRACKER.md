# AppForge Stabilization Tracker

Last updated: 2026-09-09

This file is the working source of truth for the consolidation/stabilization pass. Status meanings:

- **DONE** — implemented in `main`; no known code gap remains for the scoped item.
- **VERIFY** — implemented in `main`, but production behavior still needs a live smoke test after the matching deployment is active.
- **OPEN** — code/product work remains.
- **MANUAL** — requires account/provider administration outside normal repo code.

## Current app versions

| App | Version target | State |
|---|---:|---|
| Scrapper Pro | 1.2.0 | implemented; registry card version still needs sync |
| Media Vault | 1.1.0 | implemented; registry card version still needs sync |
| Dragon Arena | 1.6.x target | implementation has moved beyond registry 1.4.0; metadata/version sync remains open |
| AppForge shell | package 1.18.0 | global package/changelog version alignment remains open |

## P0 — Dragon Arena / Hugging Face

| Item | Status | Notes |
|---|---|---|
| HF-first GM token/model rotation | VERIFY | `/api/ai-game` has rotation + local continuity fallback; production still needs repeat smoke tests. |
| Remove hard game stop on provider quota | VERIFY | local continuity fallback prevents provider-limit dead end. |
| HF image generation provider routing | VERIFY | `/api/dragon-image` now resolves live Hugging Face inference-provider mappings and supports provider-specific calls. |
| Scene generation token/model/provider rotation | VERIFY | requires successful current production deployment + repeated Generate Scene tests. |
| Server-authoritative scene persistence | DONE | Storage upload + `dragon_arena_assets` ledger insert complete before success response. |
| Scene restore after refresh | VERIFY | code path complete; live UI smoke test required on current deployment. |
| Public first-three showcase | DONE | DB policy/RPC and legacy scene recovery implemented. |
| Scene generation metadata | DONE | model/provider/timestamp/MIME/size/turn metadata persisted and surfaced. |
| Compact story scene presentation | VERIFY | implemented; old deployments may still show oversized images. |
| Dragon Arena theme follows Appearance | VERIFY | semantic tokens and theme handling improved; visual sweep still warranted. |
| Points RPC authenticated access | DONE | production grant repaired after observed 403. |
| Consistent Dragon Arena icon everywhere | OPEN | game icon exists, but registry/card/category icon paths still need canonical wiring. |
| Dragon Arena registry metadata/version | OPEN | still contains stale OpenRouter-era copy/version. |

## P1 — Media Vault

| Item | Status | Notes |
|---|---|---|
| Restore production tables/RPCs/bucket | DONE | previous 404 schema drift repaired. |
| General direct uploads | VERIFY | schema/RPC/bucket restored; current deployment upload smoke test still useful. |
| Dragon Arena folder | VERIFY | links authoritative `dragon_arena_assets` scene rows without copying bytes. |
| Scrapper Pro folder | DONE | new saves now use `user_media_vault` directly instead of Dragon Arena. |
| Scrapper legacy backfill | DONE | migration backfills old `scrapper-result` rows when present. |
| Scrapper duplicate prevention | DONE | `(user_id, source_app, source_ref)` unique partial index + client lookup. |
| Source-aware deletion | DONE | Dragon deletion warns that source asset is removed; Scrapper deletion only removes the reference. |
| General-only manual upload UX | DONE | source-backed folders are no longer misleading manual upload targets. |
| Media Vault docs | DONE | `docs/apps/media-vault.md` updated for 1.1.0 architecture. |
| Registry card version/copy | OPEN | sync Media Vault registry metadata to 1.1.0. |

## P1 — Scrapper Pro

| Item | Status | Notes |
|---|---|---|
| Guest/local saved results | DONE | browser `localStorage` path retained. |
| Signed-in save to Media Vault | DONE | direct `saveScrapperVaultResult()` path. |
| Remove new Dragon Arena ledger dependency | DONE | new Scrapper saves no longer create `dragon_arena_assets` rows. |
| Result dedupe | DONE | original URL is stable source reference. |
| Preview/download behavior | DONE | existing media/article/post behavior retained. |
| Local-vs-account save wording | DONE | UI now distinguishes device save from Media Vault archive. |
| Scrapper docs | DONE | `docs/apps/scrapper-pro/README.md` updated for 1.2.0. |
| Small visual/hover polish | OPEN | low priority after functional smoke tests. |
| Registry card version/copy | OPEN | sync Scrapper Pro registry metadata to 1.2.0. |

## P2 — Profile / People / Auth

| Item | Status | Notes |
|---|---|---|
| Sidebar uses saved profile avatar | VERIFY | implementation exists; needs production visual confirmation. |
| Profile `show_skills` data model | DONE | account model supports it. |
| Profile `show_website` data model | DONE | account model supports it. |
| Profile `show_github` data model | DONE | account model supports it. |
| Profile `show_email` + `public_email` data model | DONE | email remains hidden by default. |
| Settings → Profile visibility controls | OPEN | controls still need to be added to Settings UI. |
| People respects field visibility | VERIFY | helper/model support exists; do a final UI/data check after controls are added. |
| GitHub authentication integration | OPEN | roadmap/integration work remains. |
| GitHub auth branch merge | DONE | no advanced GitHub-auth branch exists to merge; stale branches were audited. |

## P2 — Public / guest shell

| Item | Status | Notes |
|---|---|---|
| Exactly four guest apps | DONE | Dragon Arena, Weather Now, Any to Any Converter, Scrapper Pro. |
| Guest Dragon Arena one turn/day | VERIFY | browser-local UTC-day enforcement implemented. |
| Guest Scrapper persistence | DONE | localStorage save path retained. |
| Landing `Try now` guest entry | DONE | implemented. |
| PayPal support action | DONE | `paypal.me/dracorisz`. |
| Public `/huggingface` page | DONE | model inventory + public Dragon gallery. |
| Public gallery max first three/user | DONE | enforced in DB/RPC. |
| SEO/public route handling | DONE | guest routes + `/huggingface` recognized. |

## P2 — App metadata / shell consistency

| Item | Status | Notes |
|---|---|---|
| Canonical app metadata interface | DONE | registry has name/description/category/icon/route/tags/status/version + optional cover/changelog. |
| Normalize actual metadata values | OPEN | several apps still use generic icons/stale descriptions/uneven version history. |
| Dragon Arena canonical icon | OPEN | needs registry + card renderer/category/search/favorites wiring. |
| AI category copy/icon | OPEN | stale OpenAI-era description remains. |
| Global version consistency | OPEN | package is 1.18.0 while registry changelog already contains newer release entries. |
| Real lint configuration | OPEN | current `lint` script is still a no-op. |
| Remove dead MySQL setup/dependency | OPEN | `mysql2` + `scripts/setup-mysql.sql` remain. |
| Remove tracked `*.tsbuildinfo` | OPEN | verify tracking + `.gitignore`. |
| Dependency modernization | OPEN | separate migration; do not mix React/Router major upgrades into stabilization fixes. |

## P3 — Repository / security / deployment

| Item | Status | Notes |
|---|---|---|
| Dry-audit branches | DONE | non-main branches were either behind or stale/diverged; no more advanced hidden branch found. |
| Avoid stale branch merge | DONE | stale Devin cleanup was not merged wholesale. |
| Devin collaborator access | DONE | bot had no collaborator permission when checked. |
| Close stale Devin PR | DONE | closed without merging old code. |
| Remove Devin GitHub App installation | MANUAL | repository/account GitHub settings action if still installed. |
| Rotate historically exposed credentials | MANUAL | credentials should be rotated even when files were later cleaned. |
| Retire duplicate JS Vite config | DONE | TypeScript Vite config is authoritative. |
| Latest Vercel build active | VERIFY | deployment rate limiting has repeatedly caused production lag. |
| Signed-out four-app regression pass | VERIFY | run after stable deployment. |
| Signed-in Dragon persistence/media pass | VERIFY | run after stable deployment. |

## Current pass commits

- `3c10b656` — database migration: decouple Scrapper Pro into Media Vault.
- `52bd30a4` — Media Vault data layer becomes Scrapper Pro's account ledger.
- `16d68fdf` — Scrapper Pro saves directly to Media Vault.
- `e3c63a3e` — Media Vault source-folder/deletion UX polish.
- `6c7e167b` — Media Vault 1.1.0 documentation.
- `0e223806` — Scrapper Pro 1.2.0 documentation.

## Next automatic pass

1. Sync registry versions/descriptions for Scrapper Pro, Media Vault and Dragon Arena.
2. Wire canonical Dragon Arena icon into every card/search/favorites/category renderer.
3. Add Profile visibility controls in Settings and verify People rendering.
4. Remove obsolete MySQL setup/dependency and configure real linting as separate build-hygiene commits.
5. Re-check Hugging Face scene generation against the newest production deployment and capture provider/model telemetry from one successful generation.
