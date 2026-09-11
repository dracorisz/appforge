revoke execute on function public.consume_dragon_arena_image_request() from anon;
revoke execute on function public.refund_dragon_arena_image_request() from anon;
revoke execute on function public.consume_dragon_arena_image_request() from public;
revoke execute on function public.refund_dragon_arena_image_request() from public;
grant execute on function public.consume_dragon_arena_image_request() to authenticated;
grant execute on function public.refund_dragon_arena_image_request() to authenticated;
