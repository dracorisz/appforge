create table if not exists public.vertex_bridge_jobs (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_request_id uuid not null,
  worker_job_id text not null unique,
  kind text not null default 'image' check (kind in ('image')),
  status text not null default 'queued' check (status in ('queued', 'running', 'complete', 'failed')),
  output_uri text,
  model text,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vertex_bridge_worker_job_id_format check (worker_job_id ~ '^[a-zA-Z0-9-]{16,64}$'),
  constraint vertex_bridge_client_request_unique unique (user_id, client_request_id)
);

alter table public.vertex_bridge_jobs enable row level security;

create policy "vertex bridge jobs select own"
  on public.vertex_bridge_jobs for select
  to authenticated
  using (auth.uid() = user_id);

create policy "vertex bridge jobs insert own"
  on public.vertex_bridge_jobs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "vertex bridge jobs update own"
  on public.vertex_bridge_jobs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "vertex bridge jobs delete own"
  on public.vertex_bridge_jobs for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists vertex_bridge_jobs_user_updated_idx
  on public.vertex_bridge_jobs (user_id, updated_at desc);

comment on table public.vertex_bridge_jobs is 'Owner-scoped idempotency mapping between AppForge requests and private Google Cloud worker jobs. Prompts and credentials are intentionally not stored.';
