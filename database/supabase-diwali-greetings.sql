-- Run once in the same Supabase project's SQL Editor as the main website.
create table if not exists public.diwali_greetings (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 36),
  created_at timestamptz not null default now()
);

create index if not exists diwali_greetings_created_at_idx
  on public.diwali_greetings (created_at desc, id desc);

alter table public.diwali_greetings enable row level security;
revoke all on public.diwali_greetings from anon, authenticated;
grant insert (id, name) on public.diwali_greetings to anon, authenticated;
grant select on public.diwali_greetings to authenticated;

drop policy if exists "Visitors can create Diwali greetings" on public.diwali_greetings;
create policy "Visitors can create Diwali greetings"
  on public.diwali_greetings for insert to anon, authenticated
  with check (char_length(btrim(name)) between 1 and 36);

drop policy if exists "Admins can read Diwali greetings" on public.diwali_greetings;
create policy "Admins can read Diwali greetings"
  on public.diwali_greetings for select to authenticated
  using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));
