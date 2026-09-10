# AppForge Changelog

This file tracks user-visible AppForge product changes. The canonical source is the `main` branch.

## 1.18.x — September 2026

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
- AI Integrations / Dragon Arena presentation and provider architecture.
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
