create or replace function public.is_admin_aal2()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() and coalesce(auth.jwt()->>'aal','aal1') = 'aal2';
$$;

grant execute on function public.is_admin_aal2() to authenticated;

drop policy if exists "admins manage roles" on public.app_roles;
create policy "admins manage roles"
on public.app_roles for all to authenticated
using (public.is_admin_aal2())
with check (public.is_admin_aal2());

drop policy if exists "admins manage all profiles" on public.profiles;
create policy "admins manage all profiles"
on public.profiles for all to authenticated
using (public.is_admin_aal2())
with check (public.is_admin_aal2());

drop policy if exists "admins manage all images" on public.user_images;
create policy "admins manage all images"
on public.user_images for all to authenticated
using (public.is_admin_aal2())
with check (public.is_admin_aal2());

drop policy if exists "admins manage all profile image links" on public.profile_images;
create policy "admins manage all profile image links"
on public.profile_images for all to authenticated
using (public.is_admin_aal2())
with check (public.is_admin_aal2());

create policy "authenticated read images linked to visible profiles"
on public.user_images for select to authenticated
using (
  auth.uid() = owner_id
  or public.is_admin()
  or exists (
    select 1
    from public.profile_images pi
    join public.profiles p on p.id = pi.profile_id
    where pi.image_id = user_images.id
      and (p.is_public or p.id = auth.uid())
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-media', 'profile-media', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "users upload own profile media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users update own profile media"
on storage.objects for update to authenticated
using (
  bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users delete own profile media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  role text,
  display_name text,
  username text,
  avatar_url text,
  is_public boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin_aal2() then
    raise exception 'Admin AAL2 required';
  end if;

  return query
  select u.id,
         u.email::text,
         u.created_at,
         u.last_sign_in_at,
         coalesce(r.role, 'user')::text,
         p.display_name,
         p.username,
         p.avatar_url,
         coalesce(p.is_public, true)
  from auth.users u
  left join public.app_roles r on r.user_id = u.id
  left join public.profiles p on p.id = u.id
  order by u.created_at desc;
end;
$$;

grant execute on function public.admin_list_users() to authenticated;

create or replace function public.admin_delete_user(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin_aal2() then
    raise exception 'Admin AAL2 required';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'Cannot delete your own admin account';
  end if;
  delete from auth.users where id = target_user_id;
  return found;
end;
$$;

grant execute on function public.admin_delete_user(uuid) to authenticated;
