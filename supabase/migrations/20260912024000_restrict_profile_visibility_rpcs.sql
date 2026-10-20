-- Supabase may retain explicit role grants even after revoking from the PostgreSQL PUBLIC pseudo-role.
-- The People directory is authenticated-only, and this helper is used by authenticated RLS checks.

revoke execute on function public.is_public_profile(uuid) from anon;
revoke execute on function public.list_visible_profiles() from anon;

grant execute on function public.is_public_profile(uuid) to authenticated;
grant execute on function public.list_visible_profiles() to authenticated;
