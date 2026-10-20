-- Reproducible record of applied live migration 20261020213531_lamat_user_provider_keys
create table if not exists public.lamat_user_provider_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  user_email   text not null,
  provider     text not null check (provider in ('huggingface', 'openrouter')),
  key_label    text not null,
  api_key      text not null,
  priority     smallint not null default 1,
  active       boolean not null default true,
  last_used_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (user_id, provider, key_label)
);

alter table public.lamat_user_provider_keys enable row level security;

drop policy if exists lamat_user_provider_keys_owner on public.lamat_user_provider_keys;
create policy lamat_user_provider_keys_owner on public.lamat_user_provider_keys
  for all to authenticated
  using (user_id = (select auth.uid()) and (select public.is_maya_owner()))
  with check (user_id = (select auth.uid()) and (select public.is_maya_owner()));

revoke all on public.lamat_user_provider_keys from anon, authenticated, service_role;
grant select, insert, update, delete on public.lamat_user_provider_keys to authenticated;
grant select, insert, update on public.lamat_user_provider_keys to service_role;
