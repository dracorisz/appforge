create table if not exists public.user_media_quotas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  quota_bytes bigint not null default 209715200,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_media_vault (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('image','video','document','audio','other')),
  storage_path text not null unique,
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

alter table public.user_media_quotas enable row level security;
alter table public.user_media_vault enable row level security;

drop policy if exists "Users read own media quota" on public.user_media_quotas;
create policy "Users read own media quota" on public.user_media_quotas for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users manage own media" on public.user_media_vault;
create policy "Users manage own media" on public.user_media_vault for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select on public.user_media_quotas to authenticated;
grant select, insert, update, delete on public.user_media_vault to authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('user-media-vault', 'user-media-vault', false, 104857600)
on conflict (id) do update set public = false, file_size_limit = 104857600;

drop policy if exists "Users upload own media vault objects" on storage.objects;
create policy "Users upload own media vault objects" on storage.objects for insert to authenticated with check (
  bucket_id = 'user-media-vault' and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users read own media vault objects" on storage.objects;
create policy "Users read own media vault objects" on storage.objects for select to authenticated using (
  bucket_id = 'user-media-vault' and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users update own media vault objects" on storage.objects;
create policy "Users update own media vault objects" on storage.objects for update to authenticated using (
  bucket_id = 'user-media-vault' and split_part(name, '/', 1) = auth.uid()::text
) with check (
  bucket_id = 'user-media-vault' and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users delete own media vault objects" on storage.objects;
create policy "Users delete own media vault objects" on storage.objects for delete to authenticated using (
  bucket_id = 'user-media-vault' and split_part(name, '/', 1) = auth.uid()::text
);

create or replace function public.get_or_create_user_quota()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  result bigint;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  insert into public.user_media_quotas(user_id) values (uid) on conflict (user_id) do nothing;
  select quota_bytes into result from public.user_media_quotas where user_id = uid;
  return result;
end;
$$;

create or replace function public.user_media_usage_bytes()
returns table(used_bytes bigint)
language sql
security definer
set search_path = public
as $$
  select coalesce(sum(v.size_bytes),0)::bigint
  from public.user_media_vault v
  where v.user_id = auth.uid();
$$;

create or replace function public.create_user_media_upload_url(kind text, file_name text, mime_type text, size_bytes bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  quota bigint;
  used bigint;
  safe_name text;
  object_path text;
begin
  if uid is null then return jsonb_build_object('allowed', false, 'error', 'Authentication required'); end if;
  if kind not in ('image','video','document','audio','other') then return jsonb_build_object('allowed', false, 'error', 'Unsupported media kind'); end if;
  if size_bytes is null or size_bytes <= 0 then return jsonb_build_object('allowed', false, 'error', 'Invalid file size'); end if;
  if size_bytes > 104857600 then return jsonb_build_object('allowed', false, 'error', 'Files over 100 MB are not allowed'); end if;

  insert into public.user_media_quotas(user_id) values (uid) on conflict (user_id) do nothing;
  select q.quota_bytes into quota from public.user_media_quotas q where q.user_id = uid;
  select coalesce(sum(v.size_bytes),0)::bigint into used from public.user_media_vault v where v.user_id = uid;
  if used + size_bytes > quota then
    return jsonb_build_object('allowed', false, 'error', 'Media Vault quota exceeded', 'remaining', greatest(quota-used,0));
  end if;

  safe_name := regexp_replace(coalesce(nullif(file_name,''),'media'), '[^A-Za-z0-9._-]+', '-', 'g');
  safe_name := trim(both '-' from safe_name);
  if safe_name = '' then safe_name := 'media'; end if;
  object_path := uid::text || '/' || kind || '/' || gen_random_uuid()::text || '-' || left(safe_name,120);
  return jsonb_build_object('allowed', true, 'path', object_path, 'remaining', greatest(quota-used-size_bytes,0));
end;
$$;

revoke all on function public.get_or_create_user_quota() from public, anon;
revoke all on function public.user_media_usage_bytes() from public, anon;
revoke all on function public.create_user_media_upload_url(text,text,text,bigint) from public, anon;
grant execute on function public.get_or_create_user_quota() to authenticated, service_role;
grant execute on function public.user_media_usage_bytes() to authenticated, service_role;
grant execute on function public.create_user_media_upload_url(text,text,text,bigint) to authenticated, service_role;

notify pgrst, 'reload schema';
