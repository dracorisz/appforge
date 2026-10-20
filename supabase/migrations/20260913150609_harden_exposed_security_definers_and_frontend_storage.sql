create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to anon, authenticated, service_role;

do $$
declare
  f record;
  call_args text;
  wrapper_body text;
  volatility text;
begin
  for f in
    select
      p.oid,
      p.proname,
      pg_get_function_identity_arguments(p.oid) as identity_args,
      pg_get_function_arguments(p.oid) as full_args,
      pg_get_function_result(p.oid) as result_type,
      p.pronargs,
      p.proretset,
      p.provolatile,
      has_function_privilege('anon', p.oid, 'EXECUTE') as anon_exec,
      has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_exec,
      has_function_privilege('service_role', p.oid, 'EXECUTE') as service_exec
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any (array[
        'admin_delete_user',
        'admin_list_users',
        'award_dragon_arena_points',
        'claim_first_admin',
        'consume_dragon_arena_daily_request',
        'consume_dragon_arena_image_request',
        'create_user_media_upload_url',
        'dragon_arena_leaderboard',
        'dragon_arena_public_gallery',
        'get_or_create_user_quota',
        'is_admin',
        'is_admin_aal2',
        'is_public_profile',
        'list_visible_profiles',
        'refund_dragon_arena_daily_request',
        'refund_dragon_arena_image_request',
        'user_media_usage_bytes'
      ]::text[])
    order by p.proname
  loop
    call_args := (
      select coalesce(string_agg('$' || i::text, ', ' order by i), '')
      from generate_series(1, f.pronargs) as g(i)
    );
    wrapper_body := case when f.proretset
      then format('select * from app_private.%I(%s)', f.proname, call_args)
      else format('select app_private.%I(%s)', f.proname, call_args)
    end;
    volatility := case f.provolatile when 'i' then 'IMMUTABLE' when 's' then 'STABLE' else 'VOLATILE' end;

    execute format('alter function public.%I(%s) set schema app_private', f.proname, f.identity_args);
    execute format('revoke all on function app_private.%I(%s) from public', f.proname, f.identity_args);
    if f.anon_exec then execute format('grant execute on function app_private.%I(%s) to anon', f.proname, f.identity_args); end if;
    if f.authenticated_exec then execute format('grant execute on function app_private.%I(%s) to authenticated', f.proname, f.identity_args); end if;
    if f.service_exec then execute format('grant execute on function app_private.%I(%s) to service_role', f.proname, f.identity_args); end if;

    execute format(
      'create function public.%I(%s) returns %s language sql %s security invoker set search_path = pg_catalog, public, app_private as %L',
      f.proname, f.full_args, f.result_type, volatility, wrapper_body
    );
    execute format('revoke all on function public.%I(%s) from public', f.proname, f.identity_args);
    if f.anon_exec then execute format('grant execute on function public.%I(%s) to anon', f.proname, f.identity_args); end if;
    if f.authenticated_exec then execute format('grant execute on function public.%I(%s) to authenticated', f.proname, f.identity_args); end if;
    if f.service_exec then execute format('grant execute on function public.%I(%s) to service_role', f.proname, f.identity_args); end if;
  end loop;
end
$$;

drop policy if exists "frontend content media public read" on storage.objects;
drop policy if exists "frontend content media admin select" on storage.objects;
create policy "frontend content media admin select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'frontend-content'
  and (select public.is_admin_aal2())
);
