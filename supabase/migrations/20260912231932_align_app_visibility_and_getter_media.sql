alter table public.app_overrides
  add column if not exists visible boolean not null default true;

update public.user_media_vault
set
  source_app = 'getter-pro',
  metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{folder}', '"getter-pro"'::jsonb, true),
  updated_at = now()
where source_app = 'scrapper-pro';
