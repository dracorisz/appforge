# Security advisor triage

Last updated: 2026-09-10

This page records how Supabase advisor warnings are interpreted for AppForge. A warning is not automatically a vulnerability, but it must be classified intentionally.

## Resolved: anonymous Dragon Arena image quota mutations

The Supabase advisor flagged `consume_dragon_arena_image_request()` and `refund_dragon_arena_image_request()` because `SECURITY DEFINER` functions can inherit broad execute privileges.

AppForge now explicitly revokes `PUBLIC` and `anon` execution while retaining `authenticated` execution. The connected project was verified after the migration:

```text
anon consume: false
anon refund: false
authenticated consume: true
authenticated refund: true
```

Repository migration: `supabase/migrations/20260910013500_harden_dragon_arena_function_grants.sql`.

## Intentional public RPC

`dragon_arena_public_gallery(integer)` remains executable by anonymous and authenticated callers because it is the bounded read-only public gallery API. This is intentional and should not be blanket-revoked without replacing the public gallery architecture.

Its implementation should continue to expose only creator-opted-in public scene records and bounded result counts.

## Authenticated SECURITY DEFINER warnings

Several RPCs are intentionally callable by authenticated users. These warnings need function-by-function review, not a blanket conversion to `SECURITY INVOKER`, because some functions use elevated rights to enforce quotas, storage rules, or admin checks.

Higher-risk review order:

1. admin mutation/list RPCs — confirm internal `is_admin`/AAL requirements before privileged actions;
2. points/quota mutation RPCs — confirm caller identity and bounded deltas;
3. media upload/quota RPCs — confirm ownership, MIME/size constraints and user-scoped paths;
4. leaderboard/public gallery reads — confirm output is intentionally public or account-safe;
5. helper RPCs such as `is_admin()` — retain only the minimum grant needed by current clients/policies.

Document each reviewed function as intentional, hardened, or replaced. Avoid changing grants solely to make the advisor count zero.

## Password warning

Supabase may report leaked-password protection as disabled. AppForge currently uses Google and GitHub OAuth as its primary sign-in paths, so this is not a blocker for the current OAuth-only release path. If email/password authentication is enabled, leaked-password protection should become a release requirement.

## Review cadence

Run Supabase security and performance advisors after meaningful DDL/RLS/function changes and before production release checkpoints. Re-check actual database grants when advisor output appears stale.
