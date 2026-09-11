# GitHub Marketplace listing preparation

This document is the repository-side source of truth for the AppForge GitHub Marketplace listing. It does not imply that GitHub has approved or published the listing.

## Listing identity

**Product name:** AppForge  
**Short description:** Open-source web tools with secure GitHub sign-in and developer workflows.  
**Tagline:** Focused tools. Clear workflows. Open source.

**Production app:** https://www.sstoken.space/  
**Documentation:** https://docs.sstoken.space/  
**Repository:** https://github.com/dracorisz/appforge  
**Support:** https://github.com/dracorisz/appforge/issues  
**Privacy policy:** https://www.sstoken.space/privacy  
**Terms:** https://www.sstoken.space/terms

Use the canonical AppForge triangle assets documented in `docs/BRANDING.md` and sourced from `public/favicon.svg` / `public/appforge-mark.svg`. Do not introduce a separate Marketplace-only logo identity.

## Short listing copy

AppForge is an open-source workspace of focused developer, media, AI, conversion, productivity, and publishing tools. GitHub integration is used for secure sign-in and, only where explicitly implemented, project-related workflows that require GitHub identity or repository context.

## Detailed listing copy

AppForge brings practical browser tools into one consistent workspace. It includes structured-data conversion, image and media workflows, Story Studio AI creation, task tracking, weather, DNS inspection, SVG/favicon creation, content discovery, publishing preparation, and developer utilities.

The GitHub integration follows a least-privilege model. GitHub identity is used for authentication through Supabase OAuth. Repository/project capabilities must remain explicit user actions and must request only permissions required by implemented features. AppForge separates public tools, authenticated workspace features, and server-side integrations so credentials and privileged operations are not exposed to browser code.

The project is open source and uses CI, registry integrity checks, documentation validation, standalone-app boundary audits, changelog/release tracking, and deliberate production deployment gates.

## Current GitHub authorization boundary

The currently implemented production GitHub flow is **OAuth sign-in**, not broad repository administration.

Canonical OAuth callback:

`https://ixqoosixhahrsgwoxyme.supabase.co/auth/v1/callback`

Canonical homepage / return origin:

`https://www.sstoken.space/`

The GitHub OAuth client secret belongs only in the configured provider/server boundary. It must never be placed in a `VITE_*` variable, committed file, downloadable configuration pack, browser localStorage value, or client-visible network response.

## Marketplace permissions rule

Before Marketplace submission, compare the permissions displayed by GitHub's listing form against implemented AppForge functionality.

- Keep **metadata/read identity** access where GitHub requires it for the integration.
- Request repository/org/write permissions only when a concrete shipped workflow requires them.
- Remove speculative permissions for future features.
- Do not request administration, code-scanning, secrets, Actions write, or repository write access solely for sign-in.
- If a future GitHub App feature needs additional permissions, document the exact user action and data flow before changing the listing.

The live listing form remains authoritative because GitHub may change Marketplace permission labels and requirements.

## Installation and callback flow

1. User starts GitHub sign-in or an explicitly labeled GitHub integration action in AppForge.
2. GitHub displays the authorization/installation boundary controlled by the registered application.
3. OAuth returns through the Supabase callback above.
4. AppForge restores the allowed `returnTo` route after session establishment.
5. Authorization is determined by AppForge/Supabase application roles and policies, never by editable GitHub profile metadata.

If a future GitHub App installation flow is added, document its setup URL and installation callback separately from the OAuth sign-in callback.

## Uninstall, revoke, and data handling

- Revoking GitHub OAuth must prevent future GitHub-token use; AppForge must not silently recreate authorization.
- AppForge session/logout behavior remains separate from GitHub's own authorization revocation control.
- Do not store GitHub client secrets in user profiles or browser storage.
- Do not retain repository content merely because an integration was installed; persistence requires a product-specific documented purpose.
- Existing AppForge account/content retention follows the public Privacy Policy and Terms.
- Any future GitHub App installation tokens must be server-side, short-lived where supported, scoped to the installation, and removed/invalidated when the installation is revoked.

## Submission screenshots

Capture screenshots only from the current deliberate production release. Recommended listing set:

1. public AppForge Apps directory;
2. authenticated workspace/dashboard;
3. one representative developer utility;
4. one media/creator workflow;
5. Settings/Integrations capability surface without secrets.

Use `src/lib/demoManifest.ts` and the screenshot rules in issue #35. Never include tokens, private uploads, email addresses, infrastructure credentials, or unrelated user data.

## Pre-submission checklist

- production, docs, privacy, terms, repository, and support links resolve;
- listing logo matches canonical AppForge branding;
- screenshots come from the current production SHA;
- requested permissions match shipped functionality exactly;
- callback/setup URLs match production configuration;
- OAuth/client/install secrets are absent from browser assets and repository files;
- uninstall/revocation behavior is documented and smoke-tested;
- listing copy describes current capabilities rather than roadmap promises;
- Marketplace review status and requested changes are recorded in issue #51.

Marketplace submission/review itself is an external GitHub action and remains intentionally separate from repository readiness.
