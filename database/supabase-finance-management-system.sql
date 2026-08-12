-- Praavi Finance Management System
-- Run this in Supabase SQL Editor before using:
-- https://praaviconsultants.in/finance-management-system/fms/login
-- Replace CHANGE_ME_STRONG_PASSWORD below with the finance login password
-- before running this script in Supabase.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.fms_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  display_name text not null default 'Finance Department',
  role text not null default 'finance',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.fms_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_type text not null check (transaction_type in ('income', 'expense')),
  transaction_date date not null,
  title text not null,
  category text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  payment_method text,
  vendor text,
  invoice_number text,
  notes text,
  created_by text not null default 'finance_dept_member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fms_transactions_date_idx on public.fms_transactions (transaction_date desc);
create index if not exists fms_transactions_type_idx on public.fms_transactions (transaction_type);
create index if not exists fms_transactions_category_idx on public.fms_transactions (category);

create or replace function public.set_fms_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_fms_transactions_updated_at on public.fms_transactions;
create trigger set_fms_transactions_updated_at
before update on public.fms_transactions
for each row execute function public.set_fms_updated_at();

create or replace function public.fms_login(input_username text, input_password text)
returns table (
  ok boolean,
  username text,
  display_name text,
  role text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select
    true as ok,
    u.username,
    u.display_name,
    u.role
  from public.fms_users u
  where u.username = input_username
    and u.active = true
    and u.password_hash = extensions.crypt(input_password, u.password_hash)
  limit 1;
end;
$$;

insert into public.fms_users (username, password_hash, display_name, role)
values (
  'finance_dept_member',
  extensions.crypt('CHANGE_ME_STRONG_PASSWORD', extensions.gen_salt('bf')),
  'Finance Department Member',
  'finance'
)
on conflict (username) do update set
  password_hash = excluded.password_hash,
  display_name = excluded.display_name,
  role = excluded.role,
  active = true;

alter table public.fms_users enable row level security;
alter table public.fms_transactions enable row level security;

revoke all on public.fms_users from anon, authenticated;
grant execute on function public.fms_login(text, text) to anon, authenticated;

-- The website uses the public anon Supabase key. These policies allow the
-- finance screen to read/write after its app login succeeds. For stricter
-- server-side enforcement, move these actions behind Supabase Edge Functions.
drop policy if exists "FMS transactions anon read" on public.fms_transactions;
create policy "FMS transactions anon read"
on public.fms_transactions
for select
to anon
using (true);

drop policy if exists "FMS transactions anon insert" on public.fms_transactions;
create policy "FMS transactions anon insert"
on public.fms_transactions
for insert
to anon
with check (created_by = 'finance_dept_member');

drop policy if exists "FMS transactions anon update" on public.fms_transactions;
create policy "FMS transactions anon update"
on public.fms_transactions
for update
to anon
using (created_by = 'finance_dept_member')
with check (created_by = 'finance_dept_member');

drop policy if exists "FMS transactions anon delete" on public.fms_transactions;
create policy "FMS transactions anon delete"
on public.fms_transactions
for delete
to anon
using (created_by = 'finance_dept_member');
