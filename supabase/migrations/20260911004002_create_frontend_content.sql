create table if not exists public.frontend_content (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('blog_article','video_teaser','gallery_image')),
  slug text not null,
  title text not null,
  summary text,
  body text,
  image_url text,
  video_url text,
  app_route text,
  published boolean not null default false,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_type, slug)
);

alter table public.frontend_content enable row level security;

revoke all on table public.frontend_content from anon, authenticated;
grant select on table public.frontend_content to anon, authenticated;
grant insert, update, delete on table public.frontend_content to authenticated;

create policy "public read published frontend content"
on public.frontend_content for select
  to anon, authenticated
  using (published = true or (select public.is_admin_aal2()));

create policy "aal2 admins insert frontend content"
on public.frontend_content for insert
  to authenticated
  with check ((select public.is_admin_aal2()));

create policy "aal2 admins update frontend content"
on public.frontend_content for update
  to authenticated
  using ((select public.is_admin_aal2()))
  with check ((select public.is_admin_aal2()));

create policy "aal2 admins delete frontend content"
on public.frontend_content for delete
  to authenticated
  using ((select public.is_admin_aal2()));

create or replace function public.set_frontend_content_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_frontend_content_updated_at() from public, anon, authenticated;

drop trigger if exists frontend_content_set_updated_at on public.frontend_content;
create trigger frontend_content_set_updated_at
before update on public.frontend_content
for each row execute function public.set_frontend_content_updated_at();

create index if not exists frontend_content_public_feed_idx
  on public.frontend_content (content_type, published, sort_order, updated_at desc);
