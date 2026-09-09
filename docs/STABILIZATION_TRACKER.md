# AppForge Stabilization Tracker

Last updated: 2026-09-09

This file is the working source of truth for the consolidation/stabilization and launch-readiness pass. Status meanings:

- **DONE** — implemented in `main`; no known code gap remains for the scoped item.
- **VERIFY** — implemented in `main`, but production behavior still needs a live smoke test after the matching deployment is active.
- **OPEN** — code/product work remains.
- **MANUAL** — requires account/provider administration outside normal repo code.

## Product maturity rule

AppForge mini-apps now follow the target ladder:

**Idea → Building → Beta → Launched → Full → Deprecated**

`Full` is intentionally stronger than `Launched`: it means the app is production-ready inside AppForge and documented/isolated enough to be forked into an independent ready-made PWA. The formal gate lives in `docs/FULL_STATUS.md`.

No app should receive Full status based on feature count alone.

## Current app versions / launch posture

| App | Current posture | Notes |
|---|---|---|
| Story Studio / Dragon Arena evolution | active beta | Novel + Comics direction established; requires further builder mechanics/export/fork packaging before Launched/Full |
| Scrapper Pro | beta | strong public demo candidate; fork packaging/server dependency docs still needed for Full |
| Media Vault | beta | shared authenticated storage surface; requires standalone auth/storage packaging for Full |
| Any to Any Converter | beta / early Full candidate | browser-first and relatively portable; good candidate for first standalone extraction package |
| Weather Now | beta/public | stable demo candidate; server API dependency must be packaged for Full |
| AppForge shell | public beta | launchable as open-development platform; package/global version alignment still open |

## P0 — Story Studio / Dragon Arena / Hugging Face

| Item | Status | Notes |
|---|---|---|
| Story Studio Novel + Comics mode surface | VERIFY | new shared story workspace added; production build path now compiles after Button variant fix. |
| Compact generated-art thumbnail + lightbox | VERIFY | latest scene is now a small story thumbnail; tap/click expands in lightbox. |
| Story toolbar above game window | VERIFY | Generate, Assets, Sessions, Leaderboard, New and provider settings moved into top toolbar. |
| Remove old Dragon hero/badge/support chrome | VERIFY | Story Studio route no longer uses old decorative Dragon Arena header surface. |
| Profile Appearance theme carries into Story Studio | VERIFY | semantic theme tokens retained; visual sweep still useful. |
| Shorter story pacing | VERIFY | GM prompt targets 45–85 words, 2–3 short paragraphs and short action choices. |
| Continue after shared AI quota | VERIFY | funded HF quota no longer hard-stops gameplay; local continuity keeps story playable. |
| HF-first GM token/model rotation | VERIFY | `/api/ai-game` has rotation + local continuity fallback; production still benefits from repeat smoke tests. |
| HF image generation provider routing | VERIFY | `/api/dragon-image` resolves live Hugging Face inference-provider mappings and supports provider-specific calls. |
| Scene generation token/model/provider rotation | VERIFY | requires repeated current-production Generate tests. |
| Generate Scene request telemetry | DONE | responses include request ID + duration; exhausted rotations return sanitized model/provider/status attempts. |
| Server-authoritative scene persistence | DONE | Storage upload + `dragon_arena_assets` ledger insert complete before success response. |
| Scene restore after refresh | VERIFY | code path complete; live UI smoke test required on current deployment. |
| Public first-three showcase | DONE | DB policy/RPC and legacy scene recovery implemented. |
| Scene generation metadata | DONE | model/provider/timestamp/MIME/size/turn metadata persisted and surfaced. |
| Points RPC authenticated access | DONE | production grant repaired after observed 403. |
| Canonical Dragon icon on primary dashboard cards | DONE | PublicDashboard special-cases Dragon and registry uses `DragonArena`. |
| Legacy `/workspace` duplicate renderer | DONE | route redirects to `/apps` and obsolete `AppWorkspace.tsx` was removed. |
| Novel Builder project model | OPEN | chapters/scenes, editable prose, project title/metadata, continuity controls and export remain. |
| Comics Builder project model | OPEN | panel/page composition, captions/dialogue, scene ordering and export remain. |
| Shared character/world/lore memory | OPEN | target feature for both Novel and Comics modes. |
| Builder export/version history | OPEN | target requirement before Launched/Full. |
| Story Studio fork package | OPEN | must document/extract APIs, Supabase schema, provider env and PWA identity before Full. |

## P1 — Media Vault

| Item | Status | Notes |
|---|---|---|
| Restore production tables/RPCs/bucket | DONE | previous 404 schema drift repaired. |
| General direct uploads | VERIFY | schema/RPC/bucket restored; current deployment upload smoke test still useful. |
| Story/Dragon folder | VERIFY | links authoritative `dragon_arena_assets` scene rows without copying bytes. |
| Scrapper Pro folder | DONE | new saves use `user_media_vault` directly instead of Dragon Arena. |
| Scrapper legacy backfill | DONE | migration backfills old `scrapper-result` rows when present. |
| Scrapper duplicate prevention | DONE | `(user_id, source_app, source_ref)` unique partial index + client lookup. |
| Source-aware deletion | DONE | Dragon deletion warns that source asset is removed; Scrapper deletion only removes the reference. |
| General-only manual upload UX | DONE | source-backed folders are no longer misleading manual upload targets. |
| Media Vault docs | DONE | `docs/apps/media-vault.md` documents current architecture. |
| Standalone fork package | OPEN | auth, private bucket, RLS/RPC, quota and env setup must be isolated/documented for Full. |

## P1 — Scrapper Pro

| Item | Status | Notes |
|---|---|---|
| Guest/local saved results | DONE | browser `localStorage` path retained. |
| Signed-in save to Media Vault | DONE | direct `saveScrapperVaultResult()` path. |
| Remove new Dragon Arena ledger dependency | DONE | new Scrapper saves no longer create `dragon_arena_assets` rows. |
| Result dedupe | DONE | original URL is stable source reference. |
| Preview/download behavior | DONE | existing media/article/post behavior retained. |
| Local-vs-account save wording | DONE | UI distinguishes device save from Media Vault archive. |
| Scrapper docs | DONE | app docs document current architecture. |
| Small visual/hover polish | OPEN | low priority after functional smoke tests. |
| Standalone fork package | OPEN | scrape/media/article API routes, optional account vault path and provider behavior need extraction guide. |

## P2 — Profile / People / Auth

| Item | Status | Notes |
|---|---|---|
| Sidebar uses saved profile avatar | VERIFY | implementation exists; needs production visual confirmation. |
| Profile field visibility data model | DONE | skills, website, GitHub and public email flags supported. |
| Settings → Profile visibility controls | DONE | switches are editable and saved. |
| People respects field visibility | DONE | cards honor visibility flags. |
| Settings public-profile preview respects visibility | DONE | preview mirrors People visibility rules. |
| GitHub authentication integration | OPEN | roadmap/integration work remains. |

## P2 — Public / guest shell

| Item | Status | Notes |
|---|---|---|
| Public landing cleanup | VERIFY | lower feature-row clutter removed; footer keeps platform notes. |
| Hugging Face foregrounded on public landing | VERIFY | replaces Dragon Arena as the featured fourth public entry and uses official HF logo asset URL. |
| Scrapper Pro public route | VERIFY | smoke test before active marketing push. |
| Weather public route | VERIFY | smoke test before active marketing push. |
| Any Converter public route | VERIFY | smoke test before active marketing push. |
| Public `/huggingface` page | DONE | model inventory/provider list/public gallery. |
| Public gallery max first three/user | DONE | enforced in DB/RPC. |
| SEO/public route handling | DONE | public routes recognized. |

## P2 — Full-status / forkability program

| Item | Status | Notes |
|---|---|---|
| Define Full status | DONE | `docs/FULL_STATUS.md` is the canonical quality/fork-readiness gate. |
| Add Full positioning to README | DONE | public README now explains the maturity ladder and forkable-PWA goal. |
| First Full candidate selection | DONE | Any to Any Converter identified as a strong first candidate, pending verification/packaging. |
| Registry/UI `Full` badge implementation | OPEN | add the literal status only when first app reaches the gate or as part of the first extraction pass. |
| Per-app fork guide template | DONE | template included in Full standard. |
| Any Converter fork package | OPEN | likely best first implementation target. |
| Local developer-tool fork package | OPEN | second-wave candidates after Any Converter. |
| Shared standalone-PWA starter/extraction script | OPEN | future leverage: automate manifest, entry route, env, package trimming and deploy docs. |

## P2 — App metadata / shell consistency

| Item | Status | Notes |
|---|---|---|
| Canonical app metadata interface | DONE | registry has name/description/category/icon/route/tags/status/version + optional cover/changelog. |
| Normalize actual metadata values | OPEN | several lower-priority apps still use generic icons or uneven version history. |
| Global version consistency | OPEN | package/global build alignment remains. |
| Real lint configuration | OPEN | current `lint` script is still a no-op. |
| Remove dead MySQL setup/dependency | OPEN | `mysql2` + `scripts/setup-mysql.sql` remain. |
| Remove tracked `*.tsbuildinfo` | DONE | cache removed and ignored. |
| Dependency modernization | OPEN | separate migration; do not mix broad major upgrades into launch stabilization. |

## P3 — Marketing / launch readiness

| Item | Status | Notes |
|---|---|---|
| Marketing handoff document | DONE | `docs/MARKETING_HANDOFF.md`. |
| Safe current claims vs future claims | DONE | documented to avoid overpromising Full/Novel/Comics/provider availability. |
| Patreon positioning draft | DONE | supporter-first open-development framing prepared; pricing intentionally deferred to marketing session. |
| Screenshot shot list | DONE | 12 target captures documented. |
| Marketing deliverables checklist | DONE | tagline, descriptions, Patreon, social posts, screenshots, demo video, FAQ listed. |
| Production launch smoke test | OPEN | perform immediately before advertising today. |
| Patreon account/page creation | MANUAL | user-owned external account action. |
| Social account/post publication | MANUAL | user-owned external account actions. |
| Marketing screenshot capture | MANUAL/VERIFY | capture after confirming latest production UI. |

## P3 — Repository / security / deployment

| Item | Status | Notes |
|---|---|---|
| Dry-audit branches | DONE | stale branches audited; no advanced hidden branch found. |
| Devin collaborator access | DONE | bot had no collaborator permission when checked. |
| Remove Devin GitHub App installation | MANUAL | repository/account GitHub settings action if still installed. |
| Rotate historically exposed credentials | MANUAL | rotate even when files were later cleaned. |
| Retire duplicate JS Vite config | DONE | TypeScript Vite config is authoritative. |
| Current handoff docs | DONE | architecture docs reflect current provider/Media Vault direction. |
| Current code deployment health | DONE | a production deployment containing Story Studio source + Button fix reached READY on 2026-09-09. |
| Latest docs-only deployment | VERIFY | latest main may still be building; no source-code delta from marketing docs should block launch behavior. |
| Public regression pass | OPEN | landing, Hugging Face, Scrapper, Weather, Any Converter. |
| Signed-in regression pass | OPEN | Story Studio turn, graceful generation failure/success, Media Vault schema behavior. |

## Recent launch-readiness commits

- `a3b37f0d` — introduce Novel/Comics Story Studio surface.
- `c38f707a` — route Dragon Arena app to Story Studio.
- `114c0c2e` — foreground Hugging Face on public landing.
- `df81dcf8` — simplify public landing and remove redundant feature row.
- `86e1b11d` — fix Button variant build blocker; subsequent production build reached READY.
- `d1e53a43` — define Full status and fork-readiness standard.
- `14e5d6ea` — prepare marketing/Patreon handoff.
- `f312e40e` — reposition public README around Full forkable-PWA maturity.

## Next logical pass

1. Run the **launch smoke test** against current production before paid/large public promotion.
2. Fix only P0 launch regressions found in that pass; avoid unrelated refactors.
3. Capture marketing screenshots once the production UI is confirmed.
4. Use `docs/MARKETING_HANDOFF.md` for the dedicated Patreon/social-copy session.
5. After today's launch, start the first **Full candidate extraction** with Any to Any Converter and build a repeatable standalone-PWA template from that work.
