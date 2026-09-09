-- Public Dragon Arena showcase: expose at most the first three public scene assets per user.
-- Private/owner assets remain protected by the existing RLS policies.

create or replace function public.dragon_arena_public_gallery(limit_count integer default 60)
returns table (
  id uuid,
  user_id uuid,
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
      a.user_id,
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
  select id, user_id, display_name, avatar_url, title, storage_path, external_url, prompt, model, created_at
  from ranked
  where showcase_rank <= 3
  order by created_at desc
  limit greatest(1, least(limit_count, 120));
$$;

revoke all on function public.dragon_arena_public_gallery(integer) from public;
grant execute on function public.dragon_arena_public_gallery(integer) to anon, authenticated;
