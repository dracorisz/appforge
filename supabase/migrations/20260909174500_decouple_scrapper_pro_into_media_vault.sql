alter table public.user_media_vault
  alter column storage_path drop not null;

alter table public.user_media_vault
  add column if not exists external_url text,
  add column if not exists source_app text not null default 'manual',
  add column if not exists source_ref text;

alter table public.user_media_vault
  drop constraint if exists user_media_vault_has_source_check;

alter table public.user_media_vault
  add constraint user_media_vault_has_source_check
  check (storage_path is not null or external_url is not null);

create unique index if not exists user_media_vault_source_ref_unique
  on public.user_media_vault(user_id, source_app, source_ref)
  where source_ref is not null;

insert into public.user_media_vault (
  user_id,
  kind,
  storage_path,
  file_name,
  mime_type,
  size_bytes,
  title,
  description,
  is_public,
  metadata,
  external_url,
  source_app,
  source_ref,
  created_at,
  updated_at
)
select
  a.user_id,
  case coalesce(a.metadata->>'type', '')
    when 'image' then 'image'
    when 'video' then 'video'
    when 'article' then 'document'
    when 'post' then 'document'
    else 'other'
  end,
  null,
  null,
  coalesce(a.mime_type, null),
  0,
  a.title,
  coalesce(a.prompt, a.metadata->>'snippet'),
  false,
  coalesce(a.metadata, '{}'::jsonb) || jsonb_build_object(
    'folder', 'scrapper-pro',
    'source_table', 'legacy_dragon_arena_assets',
    'legacy_asset_id', a.id::text,
    'original_url', coalesce(a.metadata->>'originalUrl', a.external_url),
    'thumbnail', a.metadata->>'thumbnail'
  ),
  coalesce(a.metadata->>'thumbnail', a.external_url, a.metadata->>'originalUrl'),
  'scrapper-pro',
  coalesce(a.metadata->>'originalUrl', a.external_url, a.id::text),
  a.created_at,
  a.created_at
from public.dragon_arena_assets a
where a.asset_type = 'scrapper-result'
on conflict (user_id, source_app, source_ref) where source_ref is not null do nothing;

notify pgrst, 'reload schema';
