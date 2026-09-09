-- User media vault: per-user private storage with quota and signed upload URLs.
-- Direct-to-Supabase uploads bypass the Vercel 4.5 MB request payload limit.

create table if not exists public.user_media_vault (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('image', 'video', 'document', 'audio', 'other')),
  storage_path text not null,
  file_name text,
  mime_type text,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  width integer,
  height integer,
  duration_seconds integer,
  title text,
  description text,
  is_public boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_media_vault enable row level security;

create policy "Users manage own vault media"
on public.user_media_vault
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create index if not exists user_media_vault_user_kind_idx
  on public.user_media_vault(user_id, kind, created_at desc);

-- Per-user quota ledger (default 200 MB, admin override via user_media_quotas).
create table if not exists public.user_media_quotas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  quota_bytes bigint not null default 209715200 check (quota_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_media_quotas enable row level security;

create policy "Users can read own quota"
on public.user_media_quotas
for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.get_or_create_user_quota()
returns bigint
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  uid uuid := auth.uid();
  existing bigint;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  select quota_bytes into existing from public.user_media_quotas where user_id = uid;
  if existing is not null then return existing; end if;
  insert into public.user_media_quotas(user_id, quota_bytes) values (uid, 209715200)
  on conflict (user_id) do update set user_id = excluded.user_id;
  return 209715200;
end;
$$;

create or replace function public.user_media_usage_bytes()
returns table (user_id uuid, used_bytes bigint)
language sql
security definer
set search_path = 'public'
as $$
  select v.user_id, coalesce(sum(v.size_bytes), 0)::bigint as used_bytes
  from public.user_media_vault v
  where v.user_id = auth.uid()
  group by v.user_id;
$$;

create or replace function public.create_user_media_upload_url(
  kind text,
  file_name text,
  mime_type text,
  size_bytes bigint
)
returns table (path text, allowed boolean, remaining bigint, error text)
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  uid uuid := auth.uid();
  quota bigint;
  used bigint;
  remaining bigint;
  safe_name text;
  media_path text;
begin
  if uid is null then return null, false, 0, 'Authentication required'; end if;
  if kind not in ('image', 'video', 'document', 'audio', 'other') then return null, false, 0, 'Unsupported media kind.'; end if;
  if size_bytes is null or size_bytes <= 0 then return null, false, 0, 'File size is required.'; end if;
  if size_bytes > 104857600 then return null, false, 0, 'Files over 100 MB are not allowed.'; end if;

  quota := public.get_or_create_user_quota();
  select coalesce(sum(v.size_bytes), 0) into used from public.user_media_vault v where v.user_id = uid;
  remaining := quota - used;
  if remaining < size_bytes then return null, false, remaining, 'You have reached your media storage quota.'; end if;

  safe_name := lower(regexp_replace(coalesce(file_name, 'media'), '[^a-zA-Z0-9._-]+', '-', 'g'));
  safe_name := regexp_replace(safe_name, '^-+|-+$', '', 'g');
  if safe_name = '' or length(safe_name) > 80 then safe_name := 'media'; end if;
  media_path := uid || '/' || kind || '/' || gen_random_uuid()::text || '-' || safe_name;

  insert into storage.buckets (id, name, public, file_size_limit)
  values ('user-media-vault', 'user-media-vault', false, 104857600)
  on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

  return media_path, true, remaining - size_bytes, null;
end;
$$;

grant execute on function public.get_or_create_user_quota() to authenticated;
grant execute on function public.user_media_usage_bytes() to authenticated;
grant execute on function public.create_user_media_upload_url(text, text, text, bigint) to authenticated;

-- Storage RLS: only the owner can access files under their user id.
create policy "Users manage own vault storage objects"
on storage.objects
for all
to authenticated
using (bucket_id = 'user-media-vault' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'user-media-vault' and (storage.foldername(name))[1] = auth.uid()::text);