alter table public.profiles
  add column if not exists show_skills boolean not null default true,
  add column if not exists show_website boolean not null default true,
  add column if not exists show_github boolean not null default true,
  add column if not exists show_email boolean not null default false,
  add column if not exists public_email text;

update public.profiles
set public_email = null
where show_email = false;
