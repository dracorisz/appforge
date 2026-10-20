create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  app_state jsonb not null default '{}'::jsonb,
  category_overrides jsonb not null default '{}'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can read own preferences"
on public.user_preferences for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own preferences"
on public.user_preferences for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own preferences"
on public.user_preferences for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own preferences"
on public.user_preferences for delete to authenticated
using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();
