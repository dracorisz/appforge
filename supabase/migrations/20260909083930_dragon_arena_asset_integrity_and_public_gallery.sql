alter table public.dragon_arena_assets add column if not exists external_url text;

create unique index if not exists dragon_arena_assets_storage_path_uidx
  on public.dragon_arena_assets(storage_path);

create or replace function public.dragon_arena_mark_first_three_scenes_public()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_public_count integer;
begin
  if new.asset_type = 'scene' then
    select count(*) into existing_public_count
    from public.dragon_arena_assets
    where user_id = new.user_id
      and asset_type = 'scene'
      and is_public = true;
    if existing_public_count < 3 then
      new.is_public := true;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists dragon_arena_first_three_scenes_public on public.dragon_arena_assets;
create trigger dragon_arena_first_three_scenes_public
before insert on public.dragon_arena_assets
for each row execute function public.dragon_arena_mark_first_three_scenes_public();

with ranked as (
  select id, row_number() over (partition by user_id order by created_at asc, id asc) as rn
  from public.dragon_arena_assets
  where asset_type = 'scene'
)
update public.dragon_arena_assets a
set is_public = true
from ranked r
where a.id = r.id and r.rn <= 3;

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
  generated_at timestamptz,
  metadata jsonb
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
      nullif(a.metadata->>'model','') as model,
      a.created_at as generated_at,
      a.metadata,
      row_number() over (partition by a.user_id order by a.created_at asc, a.id asc) as showcase_rank
    from public.dragon_arena_assets a
    left join public.profiles p on p.id = a.user_id and p.is_public = true
    where a.is_public = true and a.asset_type = 'scene'
  )
  select id, display_name, avatar_url, title, storage_path, external_url, prompt, model, generated_at, metadata
  from ranked
  where showcase_rank <= 3
  order by generated_at desc
  limit greatest(1, least(limit_count, 120));
$$;

revoke all on function public.dragon_arena_public_gallery(integer) from public;
grant execute on function public.dragon_arena_public_gallery(integer) to anon, authenticated;
