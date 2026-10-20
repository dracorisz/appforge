-- Allow the existing admin content system to manage documentation drafts/pages.
-- Publication to docs.sstoken.space remains part of the VitePress release workflow;
-- this type gives admins a protected source-of-truth record for Docs content.

alter table public.frontend_content
  drop constraint if exists frontend_content_content_type_check;

alter table public.frontend_content
  add constraint frontend_content_content_type_check
  check (content_type in ('blog_article','video_teaser','gallery_image','docs_page'));

create index if not exists frontend_content_docs_slug_idx
  on public.frontend_content (slug, updated_at desc)
  where content_type = 'docs_page';
