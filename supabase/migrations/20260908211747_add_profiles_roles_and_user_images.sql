create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  website text,
  location text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_images (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text,
  source_url text,
  storage_path text,
  mime_type text,
  width integer,
  height integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_images (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  image_id uuid not null references public.user_images(id) on delete cascade,
  kind text not null default 'gallery' check (kind in ('avatar','gallery','cover')),
  sort_order integer not null default 0,
  primary key (profile_id, image_id, kind)
);

alter table public.profiles enable row level security;
alter table public.app_roles enable row level security;
alter table public.user_images enable row level security;
alter table public.profile_images enable row level security;

create policy "profiles visible to authenticated users"
on public.profiles for select to authenticated
using (is_public or auth.uid() = id);

create policy "users manage own profile"
on public.profiles for all to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "users can read own role"
on public.app_roles for select to authenticated
using (auth.uid() = user_id);

create policy "users manage own images"
on public.user_images for all to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "authenticated can read public profile image links"
on public.profile_images for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = profile_id and (p.is_public or p.id = auth.uid())
  )
);

create policy "users manage own profile image links"
on public.profile_images for all to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_roles r
    where r.user_id = auth.uid() and r.role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

create policy "admins read roles"
on public.app_roles for select to authenticated
using (public.is_admin());

create policy "admins manage roles"
on public.app_roles for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins read all profiles"
on public.profiles for select to authenticated
using (public.is_admin());

create policy "admins manage all profiles"
on public.profiles for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage all images"
on public.user_images for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage all profile image links"
on public.profile_images for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email,''), '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;

  insert into public.app_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_appforge on auth.users;
create trigger on_auth_user_created_appforge
after insert on auth.users
for each row execute function public.handle_new_user_profile();
