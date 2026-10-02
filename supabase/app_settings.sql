-- Run once in the Supabase SQL editor.
-- Shared, admin-editable settings (dashboard notice, welcome suggestion, airtime charges).

create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.app_settings enable row level security;

drop policy if exists "signed-in users read settings" on public.app_settings;
create policy "signed-in users read settings" on public.app_settings
  for select using (auth.role() = 'authenticated');

drop policy if exists "admins write settings" on public.app_settings;
create policy "admins write settings" on public.app_settings
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
