-- Reproducible record of applied live migration 20261020231321_lamat_v6_library_and_unbounded_free
create table if not exists public.lamat_library_items (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title          text not null check (char_length(btrim(title)) between 1 and 240),
  file_name      text not null,
  mime_type      text not null,
  kind           text not null default 'document' check (kind in ('image', 'document', 'spreadsheet')),
  size_bytes     integer not null default 0 check (size_bytes >= 0),
  thumbnail_data text,
  parsed_text    text,
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists lamat_library_items_created on public.lamat_library_items (created_at desc);

alter table public.lamat_library_items enable row level security;
drop policy if exists lamat_library_items_owner on public.lamat_library_items;
create policy lamat_library_items_owner on public.lamat_library_items
  for all to authenticated
  using ((select public.is_maya_owner()))
  with check ((select public.is_maya_owner()));

revoke all on public.lamat_library_items from anon, authenticated, service_role;
grant select, insert, update, delete on public.lamat_library_items to authenticated;
grant select, insert, update, delete on public.lamat_library_items to service_role;
