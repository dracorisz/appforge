-- Reproducible record of applied live migration 20261019211221_maya_self_model
create table if not exists public.maya_self_model (
  version    bigint generated always as identity primary key,
  content    jsonb not null check (jsonb_typeof(content) = 'object'),
  rationale  text,
  created_by text not null default 'maya' check (created_by in ('maya','lamat','owner','system')),
  created_at timestamptz not null default now()
);

alter table public.maya_self_model enable row level security;
drop policy if exists maya_self_model_owner on public.maya_self_model;
create policy maya_self_model_owner on public.maya_self_model
  for all to authenticated
  using ((select public.is_maya_owner())) with check ((select public.is_maya_owner()));
revoke all on public.maya_self_model from anon, authenticated, service_role;
grant select, insert on public.maya_self_model to authenticated, service_role;
