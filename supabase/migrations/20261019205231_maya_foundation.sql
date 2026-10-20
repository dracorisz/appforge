-- Reproducible record of applied live migration 20261019205231_maya_foundation
create or replace function public.maya_touch_updated_at()
returns trigger language plpgsql set search_path = public as $fn$
begin
  new.updated_at := now();
  return new;
end
$fn$;

create table if not exists public.maya_owner (
  user_id    uuid primary key references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);
create unique index if not exists maya_owner_single on public.maya_owner ((true));

create or replace function public.is_maya_owner()
returns boolean
language sql stable security invoker
set search_path = public
as $fn$
  select exists (select 1 from public.maya_owner where user_id = (select auth.uid()))
$fn$;
revoke all on function public.is_maya_owner() from public, anon;
grant execute on function public.is_maya_owner() to authenticated, service_role;

create table if not exists public.maya_identity (
  id                uuid primary key default gen_random_uuid(),
  version           integer not null unique check (version > 0),
  name              text not null check (char_length(btrim(name)) between 1 and 80),
  presentation      text,
  summary           text,
  voice             jsonb not null default '{}'::jsonb,
  principles        jsonb not null default '[]'::jsonb,
  portrait_image_id uuid references public.user_images(id) on delete set null,
  is_active         boolean not null default false,
  change_note       text,
  created_by        text not null default 'owner' check (created_by in ('owner','maya','lamat','system')),
  created_at        timestamptz not null default now()
);
create unique index if not exists maya_identity_one_active on public.maya_identity (is_active) where is_active;

create table if not exists public.maya_autonomy_policy (
  category        text primary key check (category ~ '^[a-z_]{3,60}$'),
  tier            text not null check (tier in ('auto','notify','approve','forbidden')),
  spend_limit_usd numeric(10,2) not null default 0 check (spend_limit_usd >= 0),
  description     text not null,
  updated_at      timestamptz not null default now()
);

create table if not exists public.maya_memories (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('fact','preference','decision','lesson','event','hypothesis')),
  content       text not null check (char_length(btrim(content)) between 1 and 4000),
  provenance    text not null default 'stated_by_owner'
                check (provenance in ('stated_by_owner','observed','verified_tool','inferred')),
  confidence    numeric(3,2) not null default 0.80 check (confidence between 0 and 1),
  status        text not null default 'active' check (status in ('active','superseded','retracted','archived')),
  supersedes_id uuid references public.maya_memories(id) on delete set null,
  tags          text[] not null default '{}',
  created_by    text not null default 'maya' check (created_by in ('owner','maya','lamat','system')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists maya_memories_status_kind on public.maya_memories (status, kind);

create table if not exists public.maya_goals (
  id               uuid primary key default gen_random_uuid(),
  parent_id        uuid references public.maya_goals(id) on delete cascade,
  title            text not null check (char_length(btrim(title)) between 1 and 300),
  description      text,
  success_criteria text,
  status           text not null default 'proposed'
                   check (status in ('proposed','active','blocked','done','dropped')),
  priority         smallint not null default 3 check (priority between 1 and 5),
  horizon          text check (horizon in ('now','soon','later')),
  target_date      date,
  created_by       text not null default 'owner' check (created_by in ('owner','maya','lamat','system')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists maya_goals_parent on public.maya_goals (parent_id);

create table if not exists public.maya_projects (
  id         uuid primary key default gen_random_uuid(),
  goal_id    uuid references public.maya_goals(id) on delete set null,
  name       text not null check (char_length(btrim(name)) between 1 and 200),
  status     text not null default 'idea'
             check (status in ('idea','planned','active','paused','done','dropped')),
  summary    text,
  next_step  text,
  links      jsonb not null default '[]'::jsonb,
  rank       integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maya_resources (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('credit','spend','income','device','subscription','domain','other')),
  name       text not null check (char_length(btrim(name)) between 1 and 200),
  amount     numeric(12,2),
  unit       text not null default 'USD',
  as_of      date,
  expires_on date,
  provenance text not null default 'estimate' check (provenance in ('verified','estimate','stated')),
  source     text,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maya_conversations (
  id         uuid primary key default gen_random_uuid(),
  title      text,
  archived   boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maya_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.maya_conversations(id) on delete cascade,
  role             text not null check (role in ('user','assistant','system','tool')),
  content          text not null check (char_length(content) <= 200000),
  model            text,
  identity_version integer,
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);
create index if not exists maya_messages_conv on public.maya_messages (conversation_id, created_at);

create table if not exists public.maya_actions (
  id                 uuid primary key default gen_random_uuid(),
  category           text not null references public.maya_autonomy_policy(category),
  summary            text not null check (char_length(btrim(summary)) between 1 and 500),
  target             text,
  payload            jsonb not null default '{}'::jsonb,
  estimated_cost_usd numeric(10,2) not null default 0 check (estimated_cost_usd >= 0),
  actor              text not null default 'maya' check (actor in ('maya','lamat','owner','system')),
  tier_at_request    text not null default 'approve',
  status             text not null default 'proposed'
                     check (status in ('proposed','approved','rejected','cancelled')),
  approver_note      text,
  approved_at        timestamptz,
  execution_status   text not null default 'pending'
                     check (execution_status in ('pending','running','succeeded','failed','rolled_back')),
  result             jsonb,
  error              text,
  executed_at        timestamptz,
  created_at         timestamptz not null default now()
);
create index if not exists maya_actions_status on public.maya_actions (status, execution_status, created_at desc);

create table if not exists public.maya_snapshots (
  id               uuid primary key default gen_random_uuid(),
  label            text,
  identity_version integer,
  content          jsonb not null,
  checksum         text not null,
  created_by       text not null default 'system' check (created_by in ('owner','maya','lamat','system')),
  created_at       timestamptz not null default now()
);
