-- Tighten SECURITY DEFINER execution grants flagged by the Supabase linter.
-- Image quota mutations are authenticated-only. Explicitly revoke PostgreSQL's
-- default PUBLIC function execute privilege and any direct anon grants before
-- granting the intended authenticated role.

revoke all on function public.consume_dragon_arena_image_request() from public;
revoke all on function public.refund_dragon_arena_image_request() from public;
revoke execute on function public.consume_dragon_arena_image_request() from anon;
revoke execute on function public.refund_dragon_arena_image_request() from anon;

grant execute on function public.consume_dragon_arena_image_request() to authenticated;
grant execute on function public.refund_dragon_arena_image_request() to authenticated;

-- `dragon_arena_public_gallery(integer)` intentionally remains executable by
-- anon + authenticated. It is a read-only public-gallery RPC with bounded output
-- and was explicitly granted in its defining migration.
