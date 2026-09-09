# AppForge Database Setup

## Current State
AppForge uses Supabase PostgreSQL for authentication and signed-in persistence. Public/browser-local tools can still work without signing in.

## Database stack

- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- SQL migrations in `supabase/migrations/`

## Step 1 — Supabase Setup
1. Open https://supabase.com/dashboard
2. Create a project or use your existing one
3. Copy these values into Vercel environment variables:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` = your service_role key (server-only)

## Step 2 — Schema

Apply the versioned SQL files in `supabase/migrations/` through the Supabase CLI or the project's deployment workflow. Do not adapt the removed legacy MySQL schema: it did not represent the current application model.

## Step 3 — Client integration

`src/lib/supabase.ts` initializes the browser client with the public URL and publishable/anon key. Server routes use `SUPABASE_SERVICE_ROLE_KEY` only where elevated operations are required.

## Step 4 — Browser-local data

Some mini-apps intentionally retain local-only state. Keep their import/export paths as user-controlled backups and document when a feature syncs to Supabase.

## Step 5 — Verify
```bash
bash scripts/verify-deployment.sh
```

## Notes
- Do NOT expose `SUPABASE_SERVICE_ROLE_KEY` to the browser
- Use it only in Vercel serverless functions if you add backend endpoints
- Never expose the service-role key in client code or a `VITE_` variable
