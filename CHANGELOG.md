# AppForge Changelog

This file tracks user-visible AppForge product changes. The canonical source is the `main` branch.

## 1.27.0 — September 2026 release candidate

### Added
- Dedicated public **Apps** directory at `/explore`, with registry search, category filtering, public/workspace access labels and direct app routing.
- Public **Blog** at `/blog` with five app-focused launch articles and individual article routes.
- Public **Changelog** at `/changelog`, rendered directly from this canonical `CHANGELOG.md` file.
- TOTP/AAL2-protected admin frontend content manager at `/admin/content` for Blog copy, article images/videos, landing video teaser content and curated Hugging Face gallery images.
- Supabase `frontend_content` model with published-only public reads and AAL2-admin-only mutations enforced by RLS.
- Admin-curated image slider on the Hugging Face page, separate from automatically generated Story Studio scenes.
- Changelog validation and manual GitHub Release synchronization workflow; release notes can be extracted from this file without generated changelog commits.
- Front-header Apps, Blog and Changelog links plus canonical docs link to `docs.sstoken.space`.
- Desktop Buddy **Vertex AI secure bridge** using Vercel OIDC → Google Workload Identity Federation → short-lived service-account credentials → IAM-protected Cloud Run.
- Owner-scoped, idempotent Vertex bridge job ledger in Supabase. Browser/network retries reuse the same request/job rather than silently starting another paid image.
- Desktop Buddy Vertex provider selector, readiness state, explicit generation flow and Recover Vertex job action.
- Desktop Buddy **Transparency Repair** tool that converts model-painted checkerboard/flat edge backgrounds into real PNG alpha locally, with adjustable tolerance and preview before activation.
- Desktop Buddy **Screen Capture** tool using browser display capture where available, plus a screenshot-import fallback for Brave and installed PWA environments that block screen sharing.
- Desktop Buddy screenshots can be downloaded locally or archived privately in Media Vault under `Screenshots`.
- Safe Vertex bridge status card under Settings → Integrations; infrastructure identifiers remain server/deployment configuration rather than profile fields.
- Google bridge setup script with an explicit production `WIF_PRINCIPAL_SET` requirement and no downloadable service-account key.

### Improved
- Shared app metadata now exposes clearer app identity, version, maturity, and latest-change context, while compact mini-app headers use fewer competing actions.
- Shared utility controls have stronger focus treatment and accessible labeling.
- Desktop Buddy settings are grouped into character/behavior, generation/cleanup, and capture/PWA sections.
- Sidebar Weather uses more reliable fallback names and loading behavior when location data is incomplete.
- Weather Now hydrates saved cities before persistence starts, while the sidebar immediately reflects the selected city and ignores stale overlapping responses.
- Markdown Previewer and SVG Tool now have dedicated browser-local route implementations; both remain `Idea` until focused product verification supports maturity promotion.
- Blog content is CMS-backed with bundled fallbacks so public articles continue to render if the content API is temporarily unavailable.
- Blog articles support optional hero images and privacy-enhanced YouTube video embeds, while other video URLs remain explicit external links.
- Landing-page walkthrough title, summary and video can now be overridden by a published `video_teaser` content record while retaining the current bundled walkthrough as a fallback.
- Sitemap and SEO metadata now include Blog, article and Changelog routes with canonical/indexable public metadata; admin content routes remain non-public.
- Story Studio and Desktop Buddy now share one Hugging Face image-provider implementation.
- Desktop Buddy preserves a Vertex idempotency key across browser timeouts and keeps ambiguous worker timeouts recoverable.
- Desktop Buddy provider documentation now describes real HF/Vertex boundaries, keyless identity and recovery behavior.
- Getter Pro media downloads now explicitly reject protected provider page URLs as reference-only while preserving downloads for direct, unprotected image/video resources.
- Getter Pro Media Vault references remain the supported save path for protected YouTube/TikTok/social-media source pages.
- Documentation layout now follows the main AppForge 1152px content width, uses the large SVG profile banner on the docs homepage, and links Project Pulse directly to the live docs portal and GitHub issues.
- Task List now follows the shared full app width and adds inline editing, complete-all, progress feedback and richer task counts while preserving local-first/Supabase sync.
- Mobile/tablet navigation is now a full-screen app-style drawer with an explicit close control.
- New visitors start in dark appearance by default while saved Light/Dark/System preferences continue to take precedence.
- Theme choice now applies before first paint, persists without an initial System-mode overwrite, and tracks operating-system changes while System is selected.
- SEO metadata recognizes the current public app routes and canonical Getter Pro URL.
- `sitemap.xml` now contains canonical public pages only; retired Pariflow, old Scrapper Pro and authenticated-only app URLs were removed.
- Live Supabase schema now includes the owner-RLS Vertex bridge job table.

### Activation still required
- The Google Workload Identity Pool/provider must be created/reviewed against the real production Vercel OIDC claims.
- Apply the least-privilege bridge IAM binding and add the six server-only GCP bridge values to Vercel production.
- Keep the private worker disabled until IAM/budget review, then perform one deliberate Vertex smoke image and recovery check.
- Production Vercel deployment remains a deliberate final release step after the newest `main` passes the complete gate.

## 1.18.x–1.26.x — September 2026

### Added
- Desktop Buddy beta with KDE Konqi starter artwork, local character packs, framing controls, browser voice, response events and a persistent authenticated-workspace companion.
- Desktop Buddy local asset optimizer for 128, 256 and 512 px PNG/WebP variants.
- GitHub sign-in alongside Google OAuth.
- Project documentation and GitHub Pages status surfaces.
- Weather sidebar gadget and richer Weather Now current-condition details.
- Getter Pro media discovery improvements and per-result save/download actions.

### Improved
- Dashboard categories, search, recent apps and registry navigation.
- Getter Pro provider diagnostics and partial-result behavior when individual upstream sources fail.
- AI Integrations / Story Studio provider architecture.
- Landing-page branding, navigation and public-tool presentation.
- App registry consistency checks and CI release validation.

### Changed
- Scrapper Pro product naming is replaced by Getter Pro in current user-facing surfaces.
- Dashboard Recent is intentionally compact; search moves directly into All apps results.
- Theme switching is no longer exposed in the sidebar navigation.

### Release notes
- Production deployments should only use a `main` commit that passes registry audit, lint, TypeScript, unit tests, production build and Cloud Run worker validation.
- Provider credentials remain server-side. Desktop Buddy local optimization does not consume Hugging Face or Google Cloud credits.

## Older history
For earlier implementation history, see the Git commit history and archived project/session documentation in this repository.
