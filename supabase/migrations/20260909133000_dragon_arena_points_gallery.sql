alter table public.dragon_arena_assets
  add column if not exists title text,
  add column if not exists is_public boolean not null default false,
  add column if not exists mint_status text not null default 'not_requested',
  add column if not exists wallet_address text,
  add column if not exists token_id text,
  add column if not exists metadata_uri text;

alter table public.dragon_arena_assets
  drop constraint if exists dragon_arena_assets_mint_status_check;
alter table public.dragon_arena_assets
  add constraint dragon_arena_assets_mint_status_check
  check (mint_status in ('not_requested', 'requested', 'queued', 'minted', 'failed'));

create policy "Users can read public Dragon Arena assets"
on public.dragon_arena_assets for select to authenticated
using (is_public = true or (select auth.uid()) = user_id);

create table if not exists public.dragon_arena_points (
  user_id uuid primary key references auth.users(id) on delete cascade,
  points integer not null default 0 check (points >= 0),
  turns_played integer not null default 0,
  scenes_created integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.dragon_arena_points enable row level security;
create policy "Users can read own Dragon Arena points"
on public.dragon_arena_points for select to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.award_dragon_arena_points(point_delta integer, turn_delta integer default 0, scene_delta integer default 0)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.dragon_arena_points(user_id, points, turns_played, scenes_created, updated_at)
  values (auth.uid(), greatest(point_delta, 0), greatest(turn_delta, 0), greatest(scene_delta, 0), now())
  on conflict (user_id) do update set
    points = public.dragon_arena_points.points + greatest(point_delta, 0),
    turns_played = public.dragon_arena_points.turns_played + greatest(turn_delta, 0),
    scenes_created = public.dragon_arena_points.scenes_created + greatest(scene_delta, 0),
    updated_at = now();
end;
$$;

create or replace function public.dragon_arena_leaderboard(limit_count integer default 25)
returns table (user_id uuid, display_name text, avatar_url text, points integer, turns_played integer, scenes_created integer)
language sql security definer set search_path = public
as $$
  select p.user_id, coalesce(pr.display_name, 'AppForge adventurer'), pr.avatar_url, p.points, p.turns_played, p.scenes_created
  from public.dragon_arena_points p
  left join public.profiles pr on pr.id = p.user_id and pr.is_public = true
  order by p.points desc, p.updated_at asc
  limit greatest(1, least(limit_count, 100));
$$;

grant execute on function public.award_dragon_arena_points(integer, integer, integer) to authenticated;
grant execute on function public.dragon_arena_leaderboard(integer) to authenticated;