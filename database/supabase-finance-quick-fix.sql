-- Praavi Finance quick fix
-- Run this in Supabase SQL Editor if login says "Invalid username or password"
-- or if API seeding fails with row-level security.

create table if not exists public."User" (
  "id" text primary key,
  "email" text not null unique,
  "passwordHash" text not null,
  "name" text not null,
  "role" text not null,
  "createdAt" timestamp(3) not null default current_timestamp
);

create table if not exists public."LoginLog" (
  "id" text primary key,
  "userId" text not null,
  "loginAt" timestamp(3) not null default current_timestamp,
  "ipAddress" text,
  "userAgent" text
);

alter table public."User" enable row level security;
alter table public."LoginLog" enable row level security;

drop policy if exists "finance_api_all_User" on public."User";
create policy "finance_api_all_User" on public."User" for all to anon using (true) with check (true);

drop policy if exists "finance_api_all_LoginLog" on public."LoginLog";
create policy "finance_api_all_LoginLog" on public."LoginLog" for all to anon using (true) with check (true);

insert into public."User" ("id", "email", "passwordHash", "name", "role")
values
  ('user-admin-malhar', 'admin-username', 'REPLACE_WITH_ADMIN_BCRYPT_HASH', 'Malhar Pandey', 'founder'),
  ('user-finance-sakshi', 'finance-username', 'REPLACE_WITH_FINANCE_BCRYPT_HASH', 'Sakshi Finance', 'accountant')
on conflict ("email") do update set
  "passwordHash" = excluded."passwordHash",
  "name" = excluded."name",
  "role" = excluded."role";
