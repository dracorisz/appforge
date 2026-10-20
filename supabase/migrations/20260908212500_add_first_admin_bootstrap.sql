create or replace function public.claim_first_admin()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  user_count integer;
begin
  if auth.uid() is null then
    return false;
  end if;

  if exists (select 1 from public.app_roles where role = 'admin') then
    return false;
  end if;

  select count(*) into user_count from auth.users;
  if user_count <> 1 then
    return false;
  end if;

  insert into public.app_roles (user_id, role, updated_at)
  values (auth.uid(), 'admin', now())
  on conflict (user_id) do update
    set role = 'admin', updated_at = now();

  return true;
end;
$$;

grant execute on function public.claim_first_admin() to authenticated;
