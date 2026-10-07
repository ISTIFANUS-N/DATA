-- Run once in the Supabase SQL editor.
-- Data plans shared by every customer. Admins manage them; the server reads the price and
-- provider plan code from here, so customers can't change what they pay.
-- (New table name on purpose, so it can't clash with any older "data_plans" table.)

create table if not exists public.catalog_data_plans (
  id          text primary key,
  network     text not null,                 -- MTN | GLO | AIRTEL | 9MOBILE
  plan_type   text not null default 'SME',   -- GIFTING | SME | DATA_SHARE | CORPORATE_GIFTING
  api_plan_id text not null,                 -- the provider's plan id/code
  size_value  numeric not null,
  size_unit   text not null default 'GB',    -- MB | GB
  validity    text not null default '30 days',
  price       numeric not null,              -- your selling price in Naira
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.catalog_data_plans enable row level security;

drop policy if exists "signed-in users read data plans" on public.catalog_data_plans;
create policy "signed-in users read data plans" on public.catalog_data_plans
  for select using (auth.role() = 'authenticated');

drop policy if exists "admins write data plans" on public.catalog_data_plans;
create policy "admins write data plans" on public.catalog_data_plans
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Five starter plans, switched OFF until you give each one a real provider plan number
-- (Admin -> Data Plans -> edit -> "Pick from provider"). Or just import your provider's plans and delete these.
insert into public.catalog_data_plans (id, network, plan_type, api_plan_id, size_value, size_unit, validity, price, is_active) values
  ('mtn-sme-1gb-30', 'MTN', 'SME', '',       1,   'GB', '30 days', 270, false),
  ('mtn-sme-2gb-30', 'MTN', 'SME', '',       2,   'GB', '30 days', 540, false),
  ('mtn-gift-1gb-30', 'MTN', 'GIFTING', '',   1,   'GB', '30 days', 650, false),
  ('glo-gift-1.5gb-30', 'GLO', 'GIFTING', '', 1.5, 'GB', '30 days', 600, false),
  ('airtel-gift-1.5gb-30', 'AIRTEL', 'GIFTING', '', 1.5, 'GB', '30 days', 650, false)
on conflict (id) do nothing;

-- If you ran an earlier version of this file: plans with a non-numeric api_plan_id (the old placeholders)
-- cannot be bought with FlowPay, so switch them off until they get a real plan number.
update public.catalog_data_plans set is_active = false, api_plan_id = '' where api_plan_id !~ '^[0-9]+$';
