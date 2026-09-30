-- Run once in the Supabase SQL editor.

create table if not exists public.reserved_accounts (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  account_number text not null,
  account_name   text not null,
  bank_name      text not null,
  bank_code      text,
  bvn_verified   boolean not null default false,
  created_at     timestamptz not null default now()
);
alter table public.reserved_accounts add column if not exists bank_code text;
alter table public.reserved_accounts add column if not exists bvn_verified boolean not null default false;

alter table public.reserved_accounts enable row level security;
drop policy if exists "read own reserved account" on public.reserved_accounts;
create policy "read own reserved account" on public.reserved_accounts
  for select using (auth.uid() = user_id);
-- No insert/update policy: rows are written only by the server (service role).

-- Dedupe table so a retried Monnify webhook can never credit twice.
create table if not exists public.monnify_payments (
  transaction_reference text primary key,
  user_id    uuid not null,
  amount     numeric not null,
  created_at timestamptz not null default now()
);
alter table public.monnify_payments enable row level security; -- no policies = service role only
