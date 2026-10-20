-- Reproducible record of applied live migration 20261020182117_lamat_operational_core
create or replace function public.is_lamat_owner()
returns boolean
language sql
stable
security invoker
set search_path = public
as $fn$
  select exists (select 1 from public.maya_owner where user_id = (select auth.uid()))
$fn$;

revoke all on function public.is_lamat_owner() from public, anon;
grant execute on function public.is_lamat_owner() to authenticated, service_role;

create table if not exists public.lamat_tasks (
  id                    uuid primary key default gen_random_uuid(),
  goal_id               uuid references public.maya_goals(id) on delete set null,
  project_id            uuid references public.maya_projects(id) on delete set null,
  parent_task_id        uuid references public.lamat_tasks(id) on delete cascade,
  depends_on            uuid[] not null default '{}',
  title                 text not null check (char_length(btrim(title)) between 1 and 300),
  description           text,
  rationale             text,
  kind                  text not null default 'execution'
                        check (kind in ('research','planning','execution','verification','maintenance','financial','opportunity')),
  status                text not null default 'queued'
                        check (status in ('queued','planning','running','verifying','waiting_input','waiting_approval','blocked','paused','completed','failed','cancelled')),
  priority              smallint not null default 3 check (priority between 1 and 5),
  priority_score        numeric(8,3) not null default 50.0,
  expected_outcome      text,
  verification_method   text,
  plan_steps            jsonb not null default '[]'::jsonb,
  current_step_index    integer not null default 0 check (current_step_index >= 0),
  checkpoint_state      jsonb not null default '{}'::jsonb,
  idempotency_key       text unique,
  lease_owner           text,
  lease_expires_at      timestamptz,
  attempt_count         integer not null default 0 check (attempt_count >= 0),
  max_attempts          integer not null default 3 check (max_attempts between 1 and 10),
  estimated_cost_usd    numeric(10,4) not null default 0 check (estimated_cost_usd >= 0),
  actual_cost_usd       numeric(10,4) not null default 0 check (actual_cost_usd >= 0),
  result                jsonb,
  verification_evidence jsonb,
  last_error            text,
  blocker_reason        text,
  scheduled_for         timestamptz not null default now(),
  started_at            timestamptz,
  completed_at          timestamptz,
  created_by            text not null default 'lamat' check (created_by in ('owner','lamat','maya','system')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists lamat_tasks_status_priority on public.lamat_tasks (status, priority_score desc, scheduled_for asc);
create index if not exists lamat_tasks_goal on public.lamat_tasks (goal_id);
create index if not exists lamat_tasks_lease on public.lamat_tasks (lease_expires_at) where status in ('planning','running','verifying');

create table if not exists public.lamat_runs (
  id                 uuid primary key default gen_random_uuid(),
  task_id            uuid references public.lamat_tasks(id) on delete set null,
  conversation_id    uuid references public.maya_conversations(id) on delete set null,
  trigger_source     text not null default 'manual'
                     check (trigger_source in ('manual','autonomous_cycle','cron','webhook','answer_resume','approval_resume','chat')),
  agent_role         text not null
                     check (agent_role in ('supervisor','strategist','planner','researcher','executor','evaluator','memory_processor','chat')),
  model              text not null,
  provider           text not null default 'vertex-ai',
  status             text not null default 'running'
                     check (status in ('running','succeeded','failed','aborted','budget_halted')),
  input_summary      text,
  output_summary     text,
  structured_output  jsonb,
  tool_calls         jsonb not null default '[]'::jsonb,
  checkpoint_saved   jsonb,
  evaluation         jsonb,
  prompt_tokens      integer not null default 0 check (prompt_tokens >= 0),
  completion_tokens  integer not null default 0 check (completion_tokens >= 0),
  estimated_cost_usd numeric(10,5) not null default 0 check (estimated_cost_usd >= 0),
  actual_cost_usd    numeric(10,5),
  cost_provenance    text not null default 'estimated' check (cost_provenance in ('measured','estimated')),
  duration_ms        integer check (duration_ms is null or duration_ms >= 0),
  error              text,
  started_at         timestamptz not null default now(),
  completed_at       timestamptz
);

create index if not exists lamat_runs_task on public.lamat_runs (task_id, started_at desc);
create index if not exists lamat_runs_started on public.lamat_runs (started_at desc);

create table if not exists public.lamat_questions (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid references public.lamat_tasks(id) on delete set null,
  goal_id      uuid references public.maya_goals(id) on delete set null,
  question     text not null check (char_length(btrim(question)) between 1 and 2000),
  context_why  text not null,
  missing_info text,
  options      jsonb not null default '[]'::jsonb,
  status       text not null default 'pending' check (status in ('pending','answered','dismissed')),
  answer       text,
  answered_by  text,
  answered_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists lamat_questions_status on public.lamat_questions (status, created_at desc);

create table if not exists public.lamat_budget_config (
  id                     text primary key default 'default' check (id = 'default'),
  daily_limit_usd        numeric(10,2) not null default 2.00 check (daily_limit_usd >= 0),
  task_limit_usd         numeric(10,2) not null default 0.50 check (task_limit_usd >= 0),
  cycle_limit_usd        numeric(10,2) not null default 0.25 check (cycle_limit_usd >= 0),
  total_credit_limit_usd numeric(10,2) not null default 300.00 check (total_credit_limit_usd >= 0),
  daily_token_limit      integer not null default 500000 check (daily_token_limit >= 0),
  max_cycles_per_hour    integer not null default 30 check (max_cycles_per_hour between 1 and 120),
  autonomous_enabled     boolean not null default true,
  routine_model          text not null default 'gemini-3.8-flash',
  reasoning_model        text not null default 'gemini-4-argon',
  updated_at             timestamptz not null default now()
);

create table if not exists public.lamat_schedules (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(btrim(name)) between 1 and 120),
  kind        text not null default 'cron' check (kind in ('cron','wakeup','interval')),
  cron_expr   text,
  next_run_at timestamptz not null,
  last_run_at timestamptz,
  last_status text,
  enabled     boolean not null default true,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
