# Getter Pro standalone / fork checklist

This document complements `README.md` with the provider and deployment steps required when extracting Getter Pro from AppForge.

## Core boundary

Getter Pro should remain usable with only the providers a fork explicitly enables. Provider failures must degrade to partial-source errors instead of breaking the entire search surface.

## YouTube Data API v3

Use the official YouTube Data API. Configure only a server-side key:

```text
YOUTUBE_API_KEY=<restricted server key>
```

Recommended setup:

1. Enable **YouTube Data API v3** in the Google Cloud project used by the fork.
2. Create or reuse an API key and restrict it to the YouTube Data API where practical.
3. Store it in the deployment environment as `YOUTUBE_API_KEY`.
4. Never expose the key through a `VITE_*` variable.
5. Smoke-test text search, video URL/ID, channel URL/ID and `@handle` lookup.
6. Verify missing-key and quota exhaustion are reported as source-specific failures.

The API key is for public Data API reads. It does not authorize uploads, private YouTube data or channel management. Publishing belongs in a separate OAuth-backed workflow.

## TikTok readiness

TikTok stays disabled until the developer application has an approved product and exact scopes that permit the intended reads. Do not treat a client-access token as unrestricted creator/video search permission.

Future server-only variables:

```text
TIKTOK_CLIENT_KEY=<server-only key>
TIKTOK_CLIENT_SECRET=<server-only secret>
```

Before enabling TikTok:

1. Record the approved TikTok product and scopes in project documentation.
2. Implement only endpoints permitted by that approval.
3. Exchange credentials through TikTok's official token endpoint server-side.
4. Cache the bearer token only until shortly before expiry.
5. Return sanitized auth, approval, scope and rate-limit errors to the browser.
6. Do not substitute CAPTCHA bypasses, undocumented scraping or private-data access for missing API approval.
7. Prefer an open-original/embed path for a supplied public URL when the approved API cannot expose the requested data and TikTok terms allow embedding.

## Provenance and rights

A saved external result should retain canonical source URL, provider, remote IDs, creator/channel attribution, thumbnail/asset role, fetch timestamp and the approved API product used to retrieve it.

Public accessibility does not imply ownership or permission to redistribute, mint or tokenize media. Any collectible-prep workflow must keep the user's collectible intent separate from the original source metadata and show a rights reminder before export.

## Production readiness

Before calling a standalone Getter Pro fork production-ready:

- document every required server variable;
- enable only providers the fork actually supports;
- keep secrets out of the browser bundle and repository;
- verify representative provider searches and direct YouTube inputs;
- verify partial-source error handling, quota errors and rate limiting;
- verify local save/export and the chosen persistence replacement for Media Vault;
- retain provenance/attribution fields in exports;
- run lint, typecheck and production build checks;
- smoke-test nested-route reloads and deployed API endpoints;
- confirm the PWA/service-worker update path does not trap users on stale builds.
