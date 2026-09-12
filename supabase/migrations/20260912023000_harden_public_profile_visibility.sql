-- Public profile cards must not rely on client-side hiding for field privacy.
-- Owners keep full access to their own profile row; admins retain their existing read access.

create or replace function public.is_public_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_public from public.profiles p where p.id = target_profile_id), false);
$$;

revoke all on function public.is_public_profile(uuid) from public;
grant execute on function public.is_public_profile(uuid) to authenticated;

create or replace function public.list_visible_profiles()
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  website text,
  location text,
  github_username text,
  headline text,
  skills text[],
  open_to_collaboration boolean,
  is_public boolean,
  show_skills boolean,
  show_website boolean,
  show_github boolean,
  show_email boolean,
  public_email text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.bio,
    case when p.show_website then p.website else null end as website,
    p.location,
    case when p.show_github then p.github_username else null end as github_username,
    p.headline,
    case when p.show_skills then p.skills else '{}'::text[] end as skills,
    p.open_to_collaboration,
    p.is_public,
    p.show_skills,
    p.show_website,
    p.show_github,
    p.show_email,
    case when p.show_email then p.public_email else null end as public_email,
    p.created_at,
    p.updated_at
  from public.profiles p
  where p.is_public = true
  order by p.created_at asc;
$$;

revoke all on function public.list_visible_profiles() from public;
grant execute on function public.list_visible_profiles() to authenticated;

-- A public profile may be discoverable, but its underlying row is no longer directly
-- readable by arbitrary authenticated users. Owner/admin policies remain in force.
drop policy if exists "profiles visible to authenticated users" on public.profiles;

-- Public profile image links stay discoverable without reopening the profile row.
drop policy if exists "authenticated can read public profile image links" on public.profile_images;
create policy "authenticated can read visible profile image links"
on public.profile_images for select to authenticated
using (
  auth.uid() = profile_id
  or public.is_admin()
  or public.is_public_profile(profile_id)
);

-- Keep public-profile image files readable when their profile link is visible.
drop policy if exists "authenticated read images linked to visible profiles" on public.user_images;
create policy "authenticated read images linked to visible profiles"
on public.user_images for select to authenticated
using (
  auth.uid() = owner_id
  or public.is_admin()
  or exists (
    select 1
    from public.profile_images pi
    where pi.image_id = user_images.id
      and public.is_public_profile(pi.profile_id)
  )
);
