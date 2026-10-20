create table if not exists public.dragon_arena_image_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  usage_date date not null default (timezone('utc', now()))::date,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.dragon_arena_image_usage enable row level security;

create policy "Users can read own Dragon Arena image usage"
on public.dragon_arena_image_usage
for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.consume_dragon_arena_image_request()
returns boolean
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  uid uuid := auth.uid();
  today_utc date := (timezone('utc', now()))::date;
  current_count integer;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  insert into public.dragon_arena_image_usage(user_id, usage_date, request_count, updated_at)
  values (uid, today_utc, 0, now())
  on conflict (user_id) do update
    set usage_date = case when dragon_arena_image_usage.usage_date = today_utc then dragon_arena_image_usage.usage_date else today_utc end,
        request_count = case when dragon_arena_image_usage.usage_date = today_utc then dragon_arena_image_usage.request_count else 0 end,
        updated_at = now();
  select request_count into current_count from public.dragon_arena_image_usage where user_id = uid for update;
  if current_count >= 1 then return false; end if;
  update public.dragon_arena_image_usage set request_count = request_count + 1, updated_at = now() where user_id = uid;
  return true;
end;
$$;

create or replace function public.refund_dragon_arena_image_request()
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.dragon_arena_image_usage
  set request_count = greatest(request_count - 1, 0), updated_at = now()
  where user_id = auth.uid() and usage_date = (timezone('utc', now()))::date;
end;
$$;

grant execute on function public.consume_dragon_arena_image_request() to authenticated;
grant execute on function public.refund_dragon_arena_image_request() to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dragon-arena-assets', 'dragon-arena-assets', true, 10485760, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Users upload own Dragon Arena assets"
on storage.objects for insert to authenticated
with check (bucket_id = 'dragon-arena-assets' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own Dragon Arena assets"
on storage.objects for delete to authenticated
using (bucket_id = 'dragon-arena-assets' and (storage.foldername(name))[1] = auth.uid()::text);