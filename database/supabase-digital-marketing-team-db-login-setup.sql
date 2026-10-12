-- Proper database-login setup for Digital Marketing Team.
--
-- Run order:
-- 1) Run database/supabase-digital-marketing-team.sql first.
-- 2) Run this file in Supabase SQL Editor.
--
-- App login:
-- Username: digital_marketing_team
-- Password: set from Supabase Dashboard > Authentication > Users.
-- Do not commit real passwords in SQL files.

do $$
declare
  admin_auth_user_id uuid;
begin
  select id into admin_auth_user_id
  from auth.users
  where lower(email) = 'digital_marketing_team@praavi.local'
  limit 1;

  if admin_auth_user_id is null then
    raise exception 'Create and confirm Auth user digital_marketing_team@praavi.local in Supabase Dashboard first, then run this SQL again.';
  else
    update auth.users
    set
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"full_name":"Digital Marketing Team Admin"}'::jsonb,
      updated_at = now()
    where id = admin_auth_user_id;

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      admin_auth_user_id,
      admin_auth_user_id,
      jsonb_build_object(
        'sub', admin_auth_user_id::text,
        'email', 'digital_marketing_team@praavi.local',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      'digital_marketing_team@praavi.local',
      now(),
      now(),
      now()
    )
    on conflict (provider, provider_id) do update
    set
      user_id = excluded.user_id,
      identity_data = excluded.identity_data,
      updated_at = now();
  end if;

  insert into public.digital_marketing_team_members (
    auth_user_id,
    username,
    full_name,
    email,
    role,
    department,
    active
  )
  values (
    admin_auth_user_id,
    'digital_marketing_team',
    'Digital Marketing Team Admin',
    'digital_marketing_team@praavi.local',
    'super_admin',
    null,
    true
  )
  on conflict (username) do update
  set
    auth_user_id = excluded.auth_user_id,
    full_name = excluded.full_name,
    email = excluded.email,
    role = excluded.role,
    department = excluded.department,
    active = true,
    updated_at = now();
end $$;

create table if not exists public.digital_marketing_client_assignments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.social_desk_clients(id) on delete cascade,
  member_id uuid not null references public.digital_marketing_team_members(id) on delete cascade,
  department public.dmt_department not null,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(client_id, member_id, department)
);

create index if not exists dmt_client_assignments_client_idx
on public.digital_marketing_client_assignments(client_id, department, active);

create index if not exists dmt_client_assignments_member_idx
on public.digital_marketing_client_assignments(member_id, active);

alter table public.digital_marketing_client_assignments enable row level security;

grant select, insert, update, delete on public.digital_marketing_client_assignments to authenticated;
grant all on public.digital_marketing_client_assignments to service_role;

drop trigger if exists dmt_touch on public.digital_marketing_client_assignments;
create trigger dmt_touch
before update on public.digital_marketing_client_assignments
for each row execute function public.dmt_touch_updated_at();

drop policy if exists "dmt assignments staff read" on public.digital_marketing_client_assignments;
create policy "dmt assignments staff read"
on public.digital_marketing_client_assignments
for select
to authenticated
using (public.dmt_current_member() is not null);

drop policy if exists "dmt assignments super admin write" on public.digital_marketing_client_assignments;
create policy "dmt assignments super admin write"
on public.digital_marketing_client_assignments
for all
to authenticated
using (public.dmt_is_super_admin())
with check (public.dmt_is_super_admin());

drop policy if exists "dmt can read social desk clients" on public.social_desk_clients;
create policy "dmt can read social desk clients"
on public.social_desk_clients
for select
to authenticated
using (public.dmt_current_member() is not null);

insert into public.digital_marketing_team_members (
  username,
  full_name,
  role,
  department,
  active
)
values
  ('ayush', 'Ayush', 'graphic_designer', 'graphics', true),
  ('vaishnavi', 'Vaishnavi', 'graphic_designer', 'graphics', true),
  ('gayatri', 'Gayatri', 'graphic_designer', 'graphics', true),
  ('shreyash', 'Shreyash', 'video_editor', 'video', true),
  ('pratik', 'Pratik', 'video_editor', 'video', true),
  ('dhiraj', 'Dhiraj', 'video_editor', 'video', true)
on conflict (username) do update
set
  full_name = excluded.full_name,
  role = excluded.role,
  department = excluded.department,
  active = true,
  updated_at = now();

notify pgrst, 'reload schema';
