# AppForge Database Setup

## Current State
AppForge currently runs entirely in the browser using `localStorage`. No database is required for the existing tools to work.

## Why Add a Database?
- Sync favorites/recent apps across devices
- Share app versions and progress with a team
- Persist user-generated content beyond browser storage
- Enable multi-user or auth scenarios later

## Recommended Stack
- **Frontend DB / Backend**: Supabase (PostgreSQL)
- **Optional MySQL**: If you already have MySQL hosting, you can use it instead

## Step 1 — Supabase Setup
1. Open https://supabase.com/dashboard
2. Create a project or use your existing one
3. Copy these values into Vercel environment variables:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` = your service_role key (server-only)

## Step 2 — Schema
Run the SQL from `scripts/setup-mysql.sql` adapted for Postgres, or create tables manually:
- `apps`
- `app_versions`
- `favorites`
- `recent_apps`
- `settings`
- `categories`

## Step 3 — Client Integration
Create `src/lib/supabase.ts`:
- Initialize Supabase client with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- Replace localStorage reads/writes in `App.tsx` with Supabase calls for:
  - favorites
  - recent apps
  - app versions
  - categories CRUD

## Step 4 — Migration Strategy
1. Keep localStorage as fallback
2. Add a `db` abstraction layer in `src/lib/db.ts`
3. Switch features to DB one by one
4. Keep exports/imports for backup

## Step 5 — Verify
```bash
bash scripts/verify-deployment.sh
```

## Notes
- Do NOT expose `SUPABASE_SERVICE_ROLE_KEY` to the browser
- Use it only in Vercel serverless functions if you add backend endpoints
- For now, the app works without any database
