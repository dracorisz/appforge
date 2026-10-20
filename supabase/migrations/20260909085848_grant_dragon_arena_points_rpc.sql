revoke all on function public.award_dragon_arena_points(integer, integer, integer) from public, anon;
grant execute on function public.award_dragon_arena_points(integer, integer, integer) to authenticated, service_role;
notify pgrst, 'reload schema';
