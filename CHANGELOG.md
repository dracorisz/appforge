# AppForge Changelog

This file tracks user-visible AppForge product changes. The canonical source is the `main` branch.

## 1.28.0 — September 13, 2026

### Fixed
- Reverted the global 24px button/input/select cap and the related textarea, upload-target, image and output-area height overrides; shared controls are back to normal accessible sizing.
- Admin now challenges an already-enrolled TOTP factor inline when the current session still needs AAL2 instead of sending users back to Security in a loop.

### Improved
- Changelog release cards now group their sections into compact accordions.
- Advanced all 29 currently visible public apps: richer conversion workflows, image presets/metadata, color eyedropper/shades/contrast, QR density controls, DNS history, labeling shortcuts, background-removal presets, SVG/favicon/icon workflows, crypto market lenses, weather batch actions and Task List sorting.
- Kept the hidden Landing Builder out of the public-app sweep.

### Documentation
- Documented the public-app improvement baseline, control-sizing rollback and admin AAL2 behavior in the docs.

## 1.27.3 — September 13, 2026

### Fixed
- Corrected public authentication modal lifecycle and dismissal, Getter Pro empty-state spacing, Crypto Track/Task List section rhythm, and sidebar account-menu dismissal.
- Reworked Settings Profile/Integrations density, added secure email-password setup, refreshed People, and aligned Admin Console more closely with shared UI components.

### Documentation
- Expanded getting-started, database, UI architecture, GitHub OAuth, and documentation-maintenance guidance, including Supabase migration-preview and security practices.
- Re-ran cleanup with emphasis on stale docs and compact shared input patterns.

## 1.27.2 — September 13, 2026

### Added
- Consolidated account access into a focused sign-in modal with Google, GitHub and email/password sign-in while preserving the stable `/login` entry point.
- Added the sidebar account drop-up with Appearance, Settings, Support and Sign out actions.

### Improved
- Simplified Settings: Security now lives with Profile, Appearance moved to the sidebar account menu, Admin Console is embedded directly in Settings, Integrations cards are more compact with provider-specific icons, and obsolete About/Deployment tabs were removed.
- Reused useful About content on the public landing page instead of keeping a private Settings-only About section.
- Polished Media Vault, Getter Pro, Crypto Track, Task List, People and shared compact textarea/upload/output patterns for more consistent spacing and component use.
- Protected the Desktop Buddies media destination and tightened the Media Vault preview viewport, header and controls while retaining preview functionality.
- Getter Pro now uses filter-aware pagination copy, removes obsolete Candidate JSON/export-contract UI, and uses a more compact empty-results state.
- Crypto Track Refresh and Task List Sync actions now live with their relevant control sections instead of page-heading chrome.

### Maintenance
- Continued shared-component/theme consolidation, removed obsolete Settings/admin code paths, updated route coverage for embedded Admin, and preserved existing PublicHeader/PublicFooter work.
- Updated release documentation and advanced the application version to `1.27.2`.
- Completed registry, UI-style, documentation, TypeScript, unit-test, cloud-worker and production-build validation before deployment handoff.

## 1.27.1 — September 13, 2026

### Added
- One canonical app-page shell for authenticated and public apps, with shared `AppHeading`, width, border, spacing and surface treatment instead of per-app header variants.
- Global top-right themed toast notifications for transient success, error and informational feedback.
- Admin → Content Manager image management for Supabase-backed `gallery_image` records, including upload, preview, placement, ordering, publish state and deletion.
- Public navigation access to the Hugging Face page from the landing/public header.

### Improved
- Background Remover now uses the same full app width as the rest of the workspace instead of its previous narrow standalone wrapper.
- Task List, Crypto Track, Base64 Tool, Getter Pro and every `/apps/*` route now receive the same canonical shell/header regardless of their internal implementation.
- Legacy nested app headings are suppressed by the shared shell so a tool cannot visually introduce a second header family.
- Shared cards and app controls use stationary, subtle border/shadow hover feedback; translate/scale hover motion is removed from the canonical surface system.
- Public Blog preview cards no longer scale or shift their images on hover/focus.
- Admin user-management and image-management actions now report transient outcomes through the shared toast system.
- Public and authenticated app containers now share the same `max-w-7xl` presentation contract.

### Maintenance
- Seek & Destroy audit checked wrapper/alias candidates before deletion; files still exported or routed are retained rather than removed speculatively.
- UI architecture is documented so new apps inherit the shared shell instead of recreating headers, widths and hover styles.
- Global application version advanced to `1.27.1`; use `npm run version:set -- 1.27.1` when regenerating package-manager metadata locally.

### Release note
- This release intentionally does not deploy Vercel production. Production remains a separate deliberate release step after the current `main` validation gate passes.

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
- Desktop Buddy screenshot capture is available from the enabled floating widget, where it can assist across AppForge pages; the redundant in-app Capture tab was removed.
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
