# Security

## Reporting a vulnerability

Please report security issues privately to the repository owner rather than opening a public issue containing exploit details or credentials.

Include:

- affected route or API endpoint,
- minimal reproduction steps,
- expected vs. actual behavior,
- whether credentials, private-network access, or user data are involved.

## Secrets

Never commit real `.env` files, provider keys, database credentials, access tokens, or cookies.

Use:

- `.env.example` for variable names and safe placeholders,
- `.env.local` for local development,
- Vercel/Supabase environment settings for deployed secrets.

If a secret has ever been committed, removing the file from the current branch is not enough; rotate the credential because Git history may still contain it.

## Server-side fetch endpoints

Endpoints that fetch remote URLs must be narrow and guarded. Preserve SSRF protections, redirect limits, content-type validation, timeouts, and response-size caps.

In particular, `api/media.js` must never become an unrestricted public proxy.

## Client-side safety

- Do not render untrusted HTML with `dangerouslySetInnerHTML` without a deliberate sanitizer.
- Treat external media URLs as untrusted.
- Keep downloadable filenames sanitized.
- Do not expose server-only keys through `VITE_*` variables.
