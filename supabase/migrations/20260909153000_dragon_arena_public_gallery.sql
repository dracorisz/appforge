-- Public Dragon Arena showcase policy.
-- The first three generated scene assets per user are automatically public.
-- Later assets remain owner-only unless explicitly published by the owner.

create or replace function public.appforge_mark_first_three_dragon_scenes_public()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  scene_count integer;
begin
  if new.asset_type <> 'scene' then
    return new;
  end if;

  select count(*)::integer
    into scene_count
  from public.dragon_arena_assets
  where user_id = new.user_id
    and asset_type = 'scene';

  if scene_count < 3 then
    new.is_public := true;
  end if;

  return new;
end;
$$;

drop trigger if exists dragon_arena_first_three_public on public.dragon_arena_assets;
create trigger dragon_arena_first_three_public
before insert on public.dragon_arena_assets
for each row execute function public.appforge_mark_first_three_dragon_scenes_public();

-- Backfill existing users so the same first-three rule also applies to scenes
-- generated before this migration.
with ranked as (
  select id,
         row_number() over (partition by user_id order by created_at asc, id asc) as scene_rank
  from public.dragon_arena_assets
  where asset_type = 'scene'
)
update public.dragon_arena_assets a
set is_public = true
from ranked r
where a.id = r.id
  and r.scene_rank <= 3;

create or replace function public.dragon_arena_public_gallery(limit_count integer default 60)
returns table (
  id uuid,
  display_name text,
  avatar_url text,
  title text,
  storage_path text,
  external_url text,
  prompt text,
  model text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with ranked as (
    select
      a.id,
      coalesce(p.display_name, 'AppForge adventurer') as display_name,
      p.avatar_url,
      a.title,
      a.storage_path,
      a.external_url,
      a.prompt,
      nullif(a.metadata->>'model', '') as model,
      a.created_at,
      row_number() over (partition by a.user_id order by a.created_at asc, a.id asc) as showcase_rank
    from public.dragon_arena_assets a
    left join public.profiles p
      on p.id = a.user_id
     and p.is_public = true
    where a.is_public = true
      and a.asset_type = 'scene'
  )
  select id, display_name, avatar_url, title, storage_path, external_url, prompt, model, created_at
  from ranked
  where showcase_rank <= 3
  order by created_at desc
  limit greatest(1, least(limit_count, 120));
$$;

revoke all on function public.dragon_arena_public_gallery(integer) from public;
grant execute on function public.dragon_arena_public_gallery(integer) to anon, authenticated;
