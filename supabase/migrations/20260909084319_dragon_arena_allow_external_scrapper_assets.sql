alter table public.dragon_arena_assets
  alter column storage_path drop not null;

alter table public.dragon_arena_assets
  drop constraint if exists dragon_arena_assets_asset_type_check;

alter table public.dragon_arena_assets
  add constraint dragon_arena_assets_asset_type_check
  check (asset_type = any (array['image'::text, 'scene'::text, 'scrapper-result'::text, 'file'::text, 'audio'::text, 'video'::text, 'other'::text]));
