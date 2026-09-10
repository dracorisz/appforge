# GitHub sign-in for AppForge

AppForge supports GitHub OAuth through the same Supabase Auth session used by Google sign-in.

## Current state

The application-side GitHub OAuth path is implemented, but the public landing button intentionally remains disabled until the GitHub provider is enabled in Supabase with a real OAuth client ID and client secret. This prevents users from entering a known-dead provider flow.

## App-side behavior

- `AuthProvider` calls `supabase.auth.signInWithOAuth({ provider: 'github' })`.
- OAuth returns to `/login`, then AppForge restores the remembered `returnTo` route.
- GitHub OAuth does not request elevated repository scopes; it is identity-only unless the provider configuration is changed later.
- Provider secrets never belong in `VITE_*` variables or the browser bundle.

## Exact provider configuration for AppForge

Current Supabase project ref: `ixqoosixhahrsgwoxyme`.

Use this GitHub OAuth authorization callback URL:

```text
https://ixqoosixhahrsgwoxyme.supabase.co/auth/v1/callback
```

Use this GitHub OAuth App homepage URL:

```text
https://www.sstoken.space/
```

Then:

1. In GitHub Developer Settings, create or open the AppForge OAuth App.
2. Set **Homepage URL** to `https://www.sstoken.space/`.
3. Set **Authorization callback URL** to `https://ixqoosixhahrsgwoxyme.supabase.co/auth/v1/callback`.
4. Leave GitHub Device Flow disabled unless AppForge later adds a device-login use case.
5. Copy the GitHub OAuth **Client ID** and generate/store the **Client secret** securely.
6. In Supabase Dashboard, open **Authentication → Sign In / Providers → GitHub**.
7. Enter the GitHub client ID and client secret, turn **GitHub Enabled** on, and save.
8. In Supabase **Authentication → URL Configuration**, keep the production Site URL aligned with `https://www.sstoken.space/` and allow the app callback destination used by this client:
   `https://www.sstoken.space/login`.
9. Add only the local-development redirect URLs contributors actually use. Prefer exact production URLs over broad production wildcards.
10. Once the provider is enabled, activate the existing **Continue with GitHub** landing action and run the smoke checklist below before the next production release.

## Smoke checklist

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
- Landing/provider availability UI: `src/auth/LoginPage.tsx`
- Return-path normalization: `src/auth/returnPath.ts`
- Public environment example: `.env.example`
- Tracking issue: GitHub issue #32

The Supabase provider dashboard remains the source of truth for whether GitHub login is actually enabled. Do not enable the public GitHub sign-in control based only on repository code being present.
