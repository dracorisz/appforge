-- Admin-managed public media for frontend content and safe runtime app presentation overrides.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'frontend-content',
  'frontend-content',
  true,
  52428800,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "frontend content media public read"
on storage.objects for select
to public
using (bucket_id = 'frontend-content');

create policy "frontend content media admin insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'frontend-content'
  and public.is_admin()
  and (select auth.jwt() ->> 'aal') = 'aal2'
);

create policy "frontend content media admin update"
on storage.objects for update
to authenticated
using (bucket_id = 'frontend-content' and public.is_admin() and (select auth.jwt() ->> 'aal') = 'aal2')
with check (bucket_id = 'frontend-content' and public.is_admin() and (select auth.jwt() ->> 'aal') = 'aal2');

create policy "frontend content media admin delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'frontend-content' and public.is_admin() and (select auth.jwt() ->> 'aal') = 'aal2');

create table if not exists public.app_overrides (
  app_id text primary key,
  name text,
  description text,
  category text,
  status text check (status is null or status in ('idea','building','beta','launched','deprecated')),
  cover_image text,
  tags jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.app_overrides enable row level security;

drop policy if exists "app overrides public read" on public.app_overrides;
create policy "app overrides public read"
on public.app_overrides for select
to public
using (true);

drop policy if exists "app overrides admin insert" on public.app_overrides;
create policy "app overrides admin insert"
on public.app_overrides for insert
to authenticated
with check (public.is_admin() and (select auth.jwt() ->> 'aal') = 'aal2');

drop policy if exists "app overrides admin update" on public.app_overrides;
create policy "app overrides admin update"
on public.app_overrides for update
to authenticated
using (public.is_admin() and (select auth.jwt() ->> 'aal') = 'aal2')
with check (public.is_admin() and (select auth.jwt() ->> 'aal') = 'aal2');

drop policy if exists "app overrides admin delete" on public.app_overrides;
create policy "app overrides admin delete"
on public.app_overrides for delete
to authenticated
using (public.is_admin() and (select auth.jwt() ->> 'aal') = 'aal2');

grant select on public.app_overrides to anon, authenticated;
grant insert, update, delete on public.app_overrides to authenticated;
