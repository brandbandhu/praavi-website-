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
