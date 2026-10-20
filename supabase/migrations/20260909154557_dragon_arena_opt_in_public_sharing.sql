drop trigger if exists dragon_arena_first_three_scenes_public on public.dragon_arena_assets;

drop function if exists public.dragon_arena_mark_first_three_scenes_public();

comment on column public.dragon_arena_assets.is_public is
  'Creator-controlled public showcase opt-in. New Story Studio scenes are private by default.';

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
  select
    a.id,
    coalesce(p.display_name, 'AppForge creator') as display_name,
    p.avatar_url,
    a.title,
    a.storage_path,
    a.external_url,
    a.prompt,
    nullif(a.metadata->>'model','') as model,
    a.created_at as generated_at,
    a.metadata
  from public.dragon_arena_assets a
  left join public.profiles p on p.id = a.user_id and p.is_public = true
  where a.is_public = true
    and a.asset_type = 'scene'
  order by a.created_at desc
  limit greatest(1, least(limit_count, 120));
$$;

revoke all on function public.dragon_arena_public_gallery(integer) from public;
grant execute on function public.dragon_arena_public_gallery(integer) to anon, authenticated;
