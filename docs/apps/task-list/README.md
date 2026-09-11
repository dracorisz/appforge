# Task List

**Status:** Beta candidate / 75% target

**Route:** `/apps/task-list`

Task List is a local-first TODO application designed to be useful inside AppForge while remaining a strong standalone-PWA candidate.

## Current product boundary

- create tasks;
- mark tasks active/completed;
- delete tasks;
- persist locally in the browser;
- when signed in, optionally synchronize the same task model to Supabase;
- retain local usability when remote sync is unavailable.

## Source files

- `src/components/dashboard/TaskList.tsx`
- route wiring in `src/App.tsx`
- migration: `supabase/migrations/20260910013205_create_appforge_tasks.sql`

## Data model

The browser stores a local task list under the AppForge Task List storage key. Authenticated users can synchronize rows to `public.appforge_tasks`.

Each task contains:

- `id`
- `title`
- `completed`
- `created_at`
- `updated_at`
- server-side `user_id` when synchronized

RLS must restrict users to their own rows.

## Standalone-PWA profile

Task List is intentionally local-first. Supabase sync is an optional adapter, not a requirement for basic task creation and completion.

This gives it a better extraction profile than apps whose primary workflow depends on AppForge server APIs or AI providers.

### Current readiness estimate

Target qualification: **75% or higher before treating it as the second standalone-PWA candidate.**

Already present:

- stable route;
- usable local-first workflow;
- empty state;
- local persistence;
- optional authenticated sync;
- database migration/RLS design;
- responsive AppForge UI primitives;
- explicit error fallback when remote sync fails.

Still required before Full:

- registry metadata/version entry;
- automated route/registry integrity coverage;
- migration applied and RLS verified against the live Supabase project;
- dedicated standalone manifest/icon metadata;
- clean extraction/fork procedure;
- offline install smoke test;
- narrow/mobile keyboard and touch verification;
- import/export or backup strategy decision;
- production smoke test after deliberate deployment.

## Extraction direction

A standalone package should make Supabase optional:

```text
TaskList core state + storage
        |
        +-- localStorage/IndexedDB adapter (required)
        |
        +-- Supabase sync adapter (optional)
```

The independent PWA must continue to function if the sync adapter is omitted.

## Acceptance target for 75%

Task List qualifies for the 75% candidate tier when:

1. route and registry identity agree;
2. local create/toggle/delete survive refresh;
3. authenticated sync passes with RLS;
4. sync failure never destroys local state;
5. narrow-screen interaction is usable;
6. lint/typecheck/tests/build remain green;
7. app documentation and migration references are current.

Full status still requires the stronger fork/independence standard in `docs/FULL_STATUS.md`.
