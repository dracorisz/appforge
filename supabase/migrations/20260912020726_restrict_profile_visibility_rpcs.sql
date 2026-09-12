-- Preserve the version already recorded by the linked Supabase database.
-- Some environments received these RPCs before their committed creation migration.
-- On a fresh database they do not exist yet; the 20260912023000 migration creates
-- them and 20260912024000 unconditionally enforces the final role grants.
do $$
begin
  if to_regprocedure('public.is_public_profile(uuid)') is not null then
    revoke execute on function public.is_public_profile(uuid) from anon;
    grant execute on function public.is_public_profile(uuid) to authenticated;
  end if;

  if to_regprocedure('public.list_visible_profiles()') is not null then
    revoke execute on function public.list_visible_profiles() from anon;
    grant execute on function public.list_visible_profiles() to authenticated;
  end if;
end;
$$;
