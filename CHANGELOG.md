# AppForge Changelog

This file tracks user-visible AppForge product changes. The canonical source is the `main` branch.

## 1.27.0 — September 2026 release candidate

### Added
- Dedicated public **Apps** directory at `/explore`, with registry search, category filtering, public/workspace access labels and direct app routing.
- Front-header Apps link and canonical docs link to `docs.sstoken.space`.
- Desktop Buddy **Vertex AI secure bridge** using Vercel OIDC → Google Workload Identity Federation → short-lived service-account credentials → IAM-protected Cloud Run.
- Owner-scoped, idempotent Vertex bridge job ledger in Supabase. Browser/network retries reuse the same request/job rather than silently starting another paid image.
- Desktop Buddy Vertex provider selector, readiness state, explicit generation flow and Recover Vertex job action.
- Safe Vertex bridge status card under Settings → Integrations; infrastructure identifiers remain server/deployment configuration rather than profile fields.
- Google bridge setup script with an explicit production `WIF_PRINCIPAL_SET` requirement and no downloadable service-account key.

### Improved
- Story Studio and Desktop Buddy now share one Hugging Face image-provider implementation.
- Desktop Buddy preserves a Vertex idempotency key across browser timeouts and keeps ambiguous worker timeouts recoverable.
- Desktop Buddy provider documentation now describes real HF/Vertex boundaries, keyless identity and recovery behavior.
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
