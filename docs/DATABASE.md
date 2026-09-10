# AppForge database setup

Last updated: 2026-09-10

## Current state

AppForge uses Supabase PostgreSQL for authentication and signed-in persistence. Public/browser-local tools can still work without signing in when their product boundary allows it.

## Database stack

- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- versioned SQL migrations in `supabase/migrations/`
- Row Level Security for user-owned application data

## Environment

Client-side configuration uses:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Privileged server-side operations use `SUPABASE_SERVICE_ROLE_KEY` only where elevated access is actually required.

Do not put service-role credentials, provider secrets, or other private keys in `VITE_*` variables.

## Schema workflow

Repository migrations are the schema source of truth. Apply DDL through the migration workflow rather than editing production tables manually without recording the change.

Important current migrations include:

- account/preferences/profile and role setup;
- Dragon Arena usage, sessions, assets, sharing and quota functions;
- Media Vault tables/storage/RPC repairs;
- `20260910011500_create_appforge_tasks.sql` — Task List table + per-user RLS;
- `20260910013500_harden_dragon_arena_function_grants.sql` — removes anonymous/public execution from image quota mutations.

The Task List and Dragon Arena grant-hardening migrations have been applied to the connected project.

## Task List data model

`public.appforge_tasks` stores authenticated sync state for `/apps/task-list` while the app keeps a local-first browser core.

RLS allows users to select, insert, update and delete only rows whose `user_id` matches `auth.uid()`.

This separation is intentional: standalone/local behavior should not depend on Supabase availability, while signed-in AppForge users get optional sync.

## SECURITY DEFINER functions

Some AppForge RPCs intentionally use `SECURITY DEFINER` to perform bounded operations that cannot be expressed as ordinary table access. Every exposed function must have deliberate grants and internal authorization rules.

Current verified grant state for Dragon Arena image quota mutation RPCs:

```text
anon consume: false
anon refund: false
authenticated consume: true
authenticated refund: true
```

The public gallery RPC remains intentionally readable by anonymous users because it is the bounded public-gallery surface.

See [Security advisor triage](./SECURITY_ADVISORS.md) before changing function grants solely to satisfy a linter warning.

## Client integration

`src/lib/supabase.ts` initializes the browser client with the public project URL and publishable key. Server routes should use elevated credentials only when the operation genuinely requires them.

Authorization must rely on server-owned roles/policies/functions, not untrusted client metadata.

## Browser-local data

Some mini-apps intentionally retain local state. Keep import/export or synchronization behavior explicit in each app's documentation. A browser-local app should not gain an auth/database dependency merely for architectural uniformity.

## Verification

For schema changes:

1. add/review the migration in `supabase/migrations/`;
2. apply it to the intended environment;
3. verify RLS/grants directly when security-sensitive;
4. run Supabase security/performance advisors;
5. update the app/database/security docs;
6. run application CI before the next production deployment.

Use `npm run verify:release` for the application pre-release validation path when available in the current package scripts.
