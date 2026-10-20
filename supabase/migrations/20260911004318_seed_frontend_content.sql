insert into public.frontend_content (content_type, slug, title, summary, body, app_route, published, sort_order, metadata)
values
  (
    'blog_article',
    'desktop-buddy-your-ai-companion-on-the-desktop',
    'Desktop Buddy: a small AI companion that lives with your workflow',
    'How AppForge combines character assets, local optimization, voice-ready interactions and secure cloud image generation into a lightweight desktop companion.',
    '## A character, not another dashboard\nDesktop Buddy is designed around a persistent visual character that can react to agent responses without taking over the workspace. Character packs stay lightweight and are optimized into practical display sizes for fast PWA use.\n\n## Local first where it matters\nAsset resizing and format conversion can happen locally, while optional Hugging Face and Vertex AI providers are reserved for generation tasks that actually need cloud models. That keeps everyday interaction fast and avoids unnecessary inference cost.\n\n## Built for safer cloud generation\nThe Vertex path is designed around short-lived identity rather than downloadable service-account keys. Requests use an idempotent job model so a browser timeout can be recovered without silently starting a second paid image generation.',
    '/apps/desktop-buddy', true, 10,
    '{"app_name":"Desktop Buddy","read_time":"4 min read","published_label":"September 2026"}'::jsonb
  ),
  (
    'blog_article',
    'getter-pro-capture-web-media-with-a-clear-storage-model',
    'Getter Pro: capture web media without losing track of where it came from',
    'A closer look at AppForge media discovery, the Media Vault handoff and the difference between storing a file and preserving a protected source URL.',
    '## Discovery before download\nGetter Pro focuses on identifying useful media and metadata first. That makes it possible to keep a useful record even when a source cannot or should not be downloaded directly.\n\n## Media Vault as the durable handoff\nSaved items belong in Media Vault with enough source information to understand what was captured later. For downloadable assets, the vault can point to persisted storage. For protected sources, the durable record should be the original URL and metadata rather than a misleading local-file claim.\n\n## Clear feedback matters\nA successful save needs to mean the item can actually be found again. AppForge is tightening that contract so the UI only reports success after the vault write is confirmed.',
    '/apps/getter-pro', true, 20,
    '{"app_name":"Getter Pro","read_time":"4 min read","published_label":"September 2026"}'::jsonb
  ),
  (
    'blog_article',
    'weather-now-fast-local-conditions-without-a-heavy-dashboard',
    'Weather Now: fast local conditions without a heavy dashboard',
    'Why Weather Now keeps the primary forecast compact, supports quick city switching and brings the selected location into the AppForge sidebar.',
    '## Useful at a glance\nWeather Now is built for the common case: open it, understand the current conditions, then get back to work. The interface prioritizes temperature, condition, location and near-term context rather than overwhelming the user with every possible chart.\n\n## Cities as quick presets\nCity presets make regional checking faster, while the selected city can also drive the compact sidebar weather surface. The important detail is that the sidebar should follow the actual selected location rather than a stale label.\n\n## Location is data, not a magic string\nLocation-aware requests should resolve coordinates or a real city before calling the weather provider. Treating a label such as “Your location” as an API location is brittle, so the app is moving toward explicit resolved-location state.',
    '/apps/weather-now', true, 30,
    '{"app_name":"Weather Now","read_time":"3 min read","published_label":"September 2026"}'::jsonb
  ),
  (
    'blog_article',
    'task-list-a-small-workspace-that-stays-out-of-the-way',
    'Task List: a small workspace that stays out of the way',
    'The thinking behind a focused AppForge task surface: quick capture, clearer grouping and a layout that scales properly with the rest of the workspace.',
    '## Fast capture wins\nThe core interaction should make adding and completing work nearly frictionless. Extra organization is useful only when it does not slow down that first capture step.\n\n## Fit the workspace\nA task app should not feel like a narrow widget dropped into a full-width product. AppForge is aligning Task List with the same content width, spacing and responsive behavior used by the rest of the workspace.\n\n## Grow without becoming project-management software\nThe direction is richer filtering, grouping and useful task metadata while keeping the app lightweight. The goal is a dependable everyday list, not a second enterprise suite inside AppForge.',
    '/apps/task-list', true, 40,
    '{"app_name":"Task List","read_time":"3 min read","published_label":"September 2026"}'::jsonb
  ),
  (
    'blog_article',
    'hugging-face-gallery-a-visible-home-for-generated-assets',
    'Hugging Face Gallery: a visible home for generated AppForge assets',
    'How the public gallery can turn generated images into reusable product content, with a curated slider managed separately from generation itself.',
    '## Generation and presentation are different jobs\nA model provider creates an image; the product still needs to decide which images deserve to be shown. The public gallery therefore benefits from a curated content layer instead of automatically exposing every generation.\n\n## One reusable content source\nThe frontend content manager lets an admin choose gallery slider images, blog media and teaser content from one place. Public pages consume only published entries, while editing remains behind authenticated admin controls.\n\n## Ready for richer stories\nEach blog article supports an optional video walkthrough. That gives generated assets context and lets AppForge document an app with both written explanation and a practical demo.',
    '/huggingface', true, 50,
    '{"app_name":"Hugging Face Gallery","read_time":"3 min read","published_label":"September 2026"}'::jsonb
  )
on conflict (content_type, slug) do update
set title = excluded.title,
    summary = excluded.summary,
    body = excluded.body,
    app_route = excluded.app_route,
    metadata = public.frontend_content.metadata || excluded.metadata,
    updated_at = now();
