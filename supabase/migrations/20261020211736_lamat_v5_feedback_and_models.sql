-- Reproducible record of applied live migration 20261020211736_lamat_v5_feedback_and_models
alter table public.lamat_tasks
  add column if not exists deliverable text,
  add column if not exists user_rating smallint check (user_rating is null or (user_rating between 1 and 5)),
  add column if not exists user_feedback text,
  add column if not exists rated_at timestamptz,
  add column if not exists preferred_model text;

alter table public.lamat_budget_config
  add column if not exists overnight_free_only boolean not null default false,
  add column if not exists preferred_chat_model text not null default 'auto',
  add column if not exists free_model text not null default 'hf:Qwen/Qwen2.5-72B-Instruct';

alter table public.lamat_budget_config
  alter column daily_limit_usd set default 7.00,
  alter column task_limit_usd set default 1.50,
  alter column cycle_limit_usd set default 0.75;

update public.lamat_budget_config
   set daily_limit_usd = 7.00,
       task_limit_usd = 1.50,
       cycle_limit_usd = 0.75,
       updated_at = now()
 where id = 'default';
