alter table public.profiles
  add column if not exists github_username text,
  add column if not exists headline text,
  add column if not exists skills text[] not null default '{}'::text[],
  add column if not exists open_to_collaboration boolean not null default true;

create table if not exists public.profile_private_info (
  user_id uuid primary key references auth.users(id) on delete cascade,
  sex text,
  birth_date date,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  region text,
  postal_code text,
  country text,
  organization text,
  job_title text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profile_private_info enable row level security;

drop policy if exists "Users can read own private profile" on public.profile_private_info;
create policy "Users can read own private profile"
on public.profile_private_info for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own private profile" on public.profile_private_info;
create policy "Users can insert own private profile"
on public.profile_private_info for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own private profile" on public.profile_private_info;
create policy "Users can update own private profile"
on public.profile_private_info for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own private profile" on public.profile_private_info;
create policy "Users can delete own private profile"
on public.profile_private_info for delete to authenticated
using (auth.uid() = user_id);

create or replace function public.appforge_touch_updated_at()
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

drop trigger if exists profile_private_info_set_updated_at on public.profile_private_info;
create trigger profile_private_info_set_updated_at
before update on public.profile_private_info
for each row execute function public.appforge_touch_updated_at();