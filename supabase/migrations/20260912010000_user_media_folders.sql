create table if not exists public.user_media_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  created_at timestamptz not null default now()
);

create unique index if not exists user_media_folders_user_name_unique
  on public.user_media_folders (user_id, lower(name));

alter table public.user_media_folders enable row level security;

drop policy if exists "Users can read own media folders" on public.user_media_folders;
create policy "Users can read own media folders"
  on public.user_media_folders for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create own media folders" on public.user_media_folders;
create policy "Users can create own media folders"
  on public.user_media_folders for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can rename own media folders" on public.user_media_folders;
create policy "Users can rename own media folders"
  on public.user_media_folders for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own media folders" on public.user_media_folders;
create policy "Users can delete own media folders"
  on public.user_media_folders for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.user_media_folders to authenticated;
