# GitHub sign-in for AppForge

AppForge supports GitHub OAuth through the same Supabase Auth session used by Google sign-in.

## Current state

GitHub OAuth is configured in the GitHub OAuth App and Supabase Auth provider, and the public AppForge landing page now exposes an active **Continue with GitHub** action.

The repository-side implementation is complete. The remaining verification work is a production smoke pass after the next deliberate `vercel deploy --prod` release.

## App-side behavior

- `AuthProvider` calls `supabase.auth.signInWithOAuth({ provider: 'github' })`.
- The landing page calls `signInWithGitHub(returnTo)` using the same provider-aware busy/error state as Google.
- OAuth returns to `/login`, then AppForge restores the remembered `returnTo` route.
- GitHub OAuth is identity-only; AppForge does not request repository access for sign-in.
- Provider secrets never belong in `VITE_*` variables or the browser bundle.

## Exact production configuration

Supabase project ref: `ixqoosixhahrsgwoxyme`.

GitHub OAuth authorization callback URL:

```text
https://ixqoosixhahrsgwoxyme.supabase.co/auth/v1/callback
```

GitHub OAuth App homepage URL:

```text
https://www.sstoken.space/
```

Supabase production Site URL:

```text
https://www.sstoken.space/
```

Allowed production app return URL:

```text
https://www.sstoken.space/login
```

Keep local-development redirects limited to contributor environments that are actually used. Prefer exact production URLs over broad production wildcards.

## Production smoke checklist

Run this after the next intentional production deployment:

- signed-out landing → **Continue with GitHub** → GitHub → `/login` → originally requested protected route;
- refresh preserves the authenticated session;
- logout clears it cleanly;
- return from a nested route restores `returnTo` rather than always landing at `/`;
- mobile/touch OAuth return works;
- denied/cancelled OAuth produces a recoverable sign-in state;
- no GitHub client secret appears in browser source, Vite environment variables, logs, or network payloads;
- confirm same-email behavior between Google and GitHub accounts before treating identities as linked.

## Identity/privacy rules

GitHub name/avatar metadata may be used only as initial profile defaults. AppForge profile visibility remains controlled by AppForge profile settings; provider metadata must not automatically make account fields public.

If Google and GitHub identities need account linking, treat that as an explicit Auth configuration/product decision. Do not infer authorization from `user_metadata`; AppForge authorization continues to rely on its server-owned role/profile model.

## Source of truth

- Client OAuth implementation: `src/auth/AuthProvider.tsx`
- Landing/provider UI: `src/auth/LoginPage.tsx`
- Return-path normalization: `src/auth/returnPath.ts`
- Public environment example: `.env.example`
- Tracking issue: GitHub issue #32

The Supabase provider dashboard remains the operational source of truth for provider credentials. Repository code must never contain the GitHub client secret.
