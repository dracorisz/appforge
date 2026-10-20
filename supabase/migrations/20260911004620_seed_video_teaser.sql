insert into public.frontend_content (
  content_type, slug, title, summary, video_url, published, sort_order, metadata
)
values (
  'video_teaser',
  'landing-walkthrough',
  'See AppForge in action',
  'A concise walkthrough of the current AppForge experience, including the public tools and authenticated workspace.',
  'https://www.youtube.com/watch?v=5dAQXJXbvhI',
  true,
  10,
  '{"placement":"landing"}'::jsonb
)
on conflict (content_type, slug) do update
set title = excluded.title,
    summary = excluded.summary,
    video_url = coalesce(public.frontend_content.video_url, excluded.video_url),
    metadata = public.frontend_content.metadata || excluded.metadata,
    updated_at = now();
