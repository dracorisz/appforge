create table if not exists public.appforge_tasks (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 500),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appforge_tasks_user_created_idx
  on public.appforge_tasks (user_id, created_at desc);

alter table public.appforge_tasks enable row level security;

create policy "Users read own tasks"
  on public.appforge_tasks for select
  using (auth.uid() = user_id);

create policy "Users insert own tasks"
  on public.appforge_tasks for insert
  with check (auth.uid() = user_id);

create policy "Users update own tasks"
  on public.appforge_tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own tasks"
  on public.appforge_tasks for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.appforge_tasks to authenticated;
