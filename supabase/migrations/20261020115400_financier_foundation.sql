-- Reproducible record of applied live migration 20261020115400_financier_foundation
create or replace function public.fin_touch_updated_at()
returns trigger language plpgsql set search_path = public as $fn$
begin
  new.updated_at := now();
  return new;
end
$fn$;

create table if not exists public.fin_accounts (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name                  text not null check (char_length(btrim(name)) between 1 and 120),
  kind                  text not null default 'bank' check (kind in ('cash','bank','card','wallet','other')),
  currency              char(3) not null check (currency ~ '^[A-Z]{3}$'),
  opening_balance_minor bigint not null default 0,
  archived              boolean not null default false,
  note                  text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (user_id, id)
);

create table if not exists public.fin_categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 120),
  kind       text not null check (kind in ('income','expense','transfer')),
  essential  boolean not null default false,
  archived   boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  unique (user_id, kind, name)
);

create table if not exists public.fin_import_batches (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source     text not null check (char_length(btrim(source)) between 1 and 200),
  status     text not null default 'preview' check (status in ('preview','committed','reverted')),
  row_count  integer not null default 0 check (row_count >= 0),
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create table if not exists public.fin_transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id      uuid not null,
  category_id     uuid,
  occurred_on     date not null,
  amount_minor    bigint not null check (amount_minor <> 0),
  currency        char(3) not null check (currency ~ '^[A-Z]{3}$'),
  payee           text,
  note            text,
  status          text not null default 'cleared' check (status in ('planned','cleared')),
  source          text not null default 'manual' check (source in ('manual','import','maya','lamat')),
  import_batch_id uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  foreign key (user_id, account_id) references public.fin_accounts (user_id, id) on delete restrict,
  foreign key (user_id, category_id) references public.fin_categories (user_id, id) on delete set null (category_id),
  foreign key (user_id, import_batch_id) references public.fin_import_batches (user_id, id) on delete set null (import_batch_id)
);

create table if not exists public.fin_recurring (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 200),
  amount_minor bigint not null check (amount_minor <> 0),
  currency     char(3) not null check (currency ~ '^[A-Z]{3}$'),
  cadence      text not null check (cadence in ('weekly','monthly','yearly')),
  next_due     date not null,
  essential    boolean not null default false,
  active       boolean not null default true,
  account_id   uuid,
  category_id  uuid,
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  foreign key (user_id, account_id) references public.fin_accounts (user_id, id) on delete set null (account_id),
  foreign key (user_id, category_id) references public.fin_categories (user_id, id) on delete set null (category_id)
);

create table if not exists public.fin_debts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  creditor          text not null check (char_length(btrim(creditor)) between 1 and 200),
  kind              text not null default 'other' check (kind in ('loan','card','bill_arrears','personal','tax','other')),
  currency          char(3) not null check (currency ~ '^[A-Z]{3}$'),
  principal_minor   bigint not null default 0 check (principal_minor >= 0),
  balance_minor     bigint not null default 0 check (balance_minor >= 0),
  interest_rate_pct numeric(6,3) check (interest_rate_pct is null or interest_rate_pct >= 0),
  min_payment_minor bigint check (min_payment_minor is null or min_payment_minor >= 0),
  due_date          date,
  status            text not null default 'active' check (status in ('active','negotiating','paid','written_off')),
  consequence_note  text,
  note              text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.fin_income_sources (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name           text not null check (char_length(btrim(name)) between 1 and 200),
  kind           text not null default 'other' check (kind in ('employment','freelance','benefit','other')),
  currency       char(3) not null check (currency ~ '^[A-Z]{3}$'),
  expected_minor bigint not null default 0 check (expected_minor >= 0),
  cadence        text not null default 'monthly' check (cadence in ('once','weekly','monthly','yearly')),
  status         text not null default 'pipeline' check (status in ('pipeline','active','ended')),
  next_expected  date,
  note           text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.fin_budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  month       date not null check (extract(day from month) = 1),
  category_id uuid not null,
  limit_minor bigint not null check (limit_minor >= 0),
  currency    char(3) not null check (currency ~ '^[A-Z]{3}$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  foreign key (user_id, category_id) references public.fin_categories (user_id, id) on delete cascade,
  unique (user_id, month, category_id)
);
