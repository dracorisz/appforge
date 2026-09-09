# GitHub sign-in for AppForge

AppForge supports GitHub OAuth through the same Supabase Auth session used by Google sign-in.

## App-side behavior

- `AuthProvider` calls `supabase.auth.signInWithOAuth({ provider: 'github' })`.
- OAuth returns to `/login`, then AppForge restores the remembered `returnTo` route.
- GitHub OAuth does not request elevated repository scopes; it is identity-only unless the provider configuration is changed later.
- Provider secrets never belong in `VITE_*` variables or the browser bundle.

## One-time provider configuration

1. In Supabase Dashboard, open **Authentication → Sign In / Providers → GitHub**.
2. Copy the project callback URL shown there. It has the form:
   `https://<project-ref>.supabase.co/auth/v1/callback`
3. Create a GitHub OAuth App and use that Supabase callback URL as the authorization callback URL.
4. Add the GitHub OAuth client ID and client secret to the Supabase GitHub provider configuration and enable the provider.
5. In Supabase Auth URL configuration, keep production `https://www.sstoken.space` as the Site URL and allow the production `/login` redirect plus local development redirects used by contributors.
6. Smoke test: signed-out landing → **Continue with GitHub** → GitHub → `/login` → originally requested protected AppForge route.

## Identity/privacy rules

GitHub name/avatar metadata may be used only as initial profile defaults. AppForge profile visibility remains controlled by AppForge profile settings; provider metadata must not automatically make account fields public.

If Google and GitHub identities need account linking, treat that as an explicit Auth configuration/product decision. Do not infer authorization from `user_metadata`; AppForge authorization continues to rely on its server-owned role/profile model.

## References

- Supabase Auth: Sign in with GitHub
- Supabase JS: `signInWithOAuth`
