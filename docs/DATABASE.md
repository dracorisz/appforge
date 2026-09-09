# AppForge database

AppForge uses a single Supabase project for auth, PostgreSQL, and storage. Local-only tools still work without a session; anything synced or shared goes through Supabase with Row Level Security as the data boundary.

The browser client is created once in `src/lib/supabase.ts` (re-exported by `src/lib/db.ts`) using `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. There is no MySQL and no service-role key in the browser.

## Migrations

Every schema change is a timestamped file in `supabase/migrations/`. Do not edit tables from the dashboard — write a migration so the schema stays reproducible.

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

## Schema overview

| Area | Tables | Notes |
|---|---|---|
| Preferences | `user_preferences` | Per-user app state and category overrides, synced by `src/lib/preferences.ts` |
| Identity | `profiles`, `profile_private_info`, `app_roles` | Public profile fields are separated from private personal information; roles drive admin access |
| Media | `user_images`, `profile_images` | Uploaded images and their profile links |
| Dragon Arena | `dragon_arena_sessions`, `dragon_arena_turns`, `dragon_arena_assets`, `dragon_arena_points`, `dragon_arena_daily_usage`, `dragon_arena_image_usage` | Run history, generated scenes, leaderboard points, and per-day quotas |

## Storage buckets

| Bucket | Contents | Limit |
|---|---|---|
| `profile-media` | Avatars and cover photos, keyed by `{userId}/…` | 10 MB, image MIME types only |
| `dragon-arena-assets` | Generated scenes at `{userId}/{uuid}.png` | 10 MB, image MIME types only |

Asset rows keep both `storage_path` and `external_url`; readers should prefer the storage path and fall back to the external URL.

## Access rules

- RLS is enabled on every application table; the default is "owner only" via `auth.uid()`.
- Profiles are readable by authenticated users only when the owner has marked them public.
- Admin surfaces go through `public.is_admin()` / `public.is_admin_aal2()`; sensitive administrative mutations require an AAL2 (TOTP-verified) session.
- Quotas and points are mutated only through `security definer` RPCs (`consume_dragon_arena_daily_request`, `consume_dragon_arena_image_request`, their `refund_*` counterparts, and `award_dragon_arena_points`), so clients cannot write those counters directly.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it to the browser and never prefix it with `VITE_`.

Do not relax a policy to make a feature easier to ship; add a migration that expresses the intended access rule instead.
