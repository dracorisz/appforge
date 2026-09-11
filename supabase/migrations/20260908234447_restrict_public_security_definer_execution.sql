revoke execute on function public.admin_delete_user(uuid) from public, anon;
revoke execute on function public.admin_list_users() from public, anon;
revoke execute on function public.claim_first_admin() from public, anon;
revoke execute on function public.consume_dragon_arena_daily_request() from public, anon;
revoke execute on function public.handle_new_user_profile() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_admin_aal2() from public, anon;
revoke execute on function public.refund_dragon_arena_daily_request() from public, anon;

grant execute on function public.admin_delete_user(uuid) to authenticated, service_role;
grant execute on function public.admin_list_users() to authenticated, service_role;
grant execute on function public.claim_first_admin() to authenticated, service_role;
grant execute on function public.consume_dragon_arena_daily_request() to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.is_admin_aal2() to authenticated, service_role;
grant execute on function public.refund_dragon_arena_daily_request() to authenticated, service_role;
grant execute on function public.handle_new_user_profile() to service_role;

create index if not exists dragon_arena_turns_user_id_idx on public.dragon_arena_turns(user_id);
create index if not exists dragon_arena_assets_user_id_idx on public.dragon_arena_assets(user_id);
