do $$
begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'dmt_role') then
    create type public.dmt_role as enum ('super_admin', 'graphic_designer', 'video_editor');
  end if;

  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'dmt_department') then
    create type public.dmt_department as enum ('graphics', 'video');
  end if;
end $$;

create table if not exists public.digital_marketing_team_members (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  username text not null unique,
  password_hash text,
  full_name text not null,
  email text,
  mobile text,
  role public.dmt_role not null,
  department public.dmt_department,
  active boolean not null default true,
  notes text,
  created_by uuid references public.digital_marketing_team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dmt_member_department_role_check check (
    (role = 'super_admin' and department is null)
    or (role = 'graphic_designer' and department = 'graphics')
    or (role = 'video_editor' and department = 'video')
  )
);

create table if not exists public.digital_marketing_monthly_targets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.social_desk_clients(id) on delete cascade,
  target_month date not null,
  graphic_target int not null default 0 check (graphic_target >= 0),
  reel_target int not null default 0 check (reel_target >= 0),
  notes text,
  created_by uuid references public.digital_marketing_team_members(id) on delete set null,
  updated_by uuid references public.digital_marketing_team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(client_id, target_month)
);

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

create table if not exists public.graphic_work_entries (
  id uuid primary key default gen_random_uuid(),
  work_code bigint generated always as identity unique,
  work_date date not null default current_date,
  client_id uuid not null references public.social_desk_clients(id) on delete cascade,
  designer_id uuid references public.digital_marketing_team_members(id) on delete set null,
  creative_title text not null,
  creative_type text not null default 'Static Post' check (creative_type in ('Static Post','Carousel','Story','Banner','Other')),
  creative_description text,
  quantity int not null default 1 check (quantity > 0),
  status text not null default 'Pending' check (status in ('Pending','In Progress','Completed')),
  creative_file_url text,
  creative_preview_url text,
  creative_link text,
  group_shared text not null default 'No' check (group_shared in ('Yes','No')),
  group_shared_date date,
  remarks text,
  created_by uuid references public.digital_marketing_team_members(id) on delete set null,
  updated_by uuid references public.digital_marketing_team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint graphic_group_shared_date_check check (
    (group_shared = 'No' and group_shared_date is null)
    or (group_shared = 'Yes')
  )
);

create table if not exists public.video_shoots (
  id uuid primary key default gen_random_uuid(),
  shoot_code bigint generated always as identity unique,
  client_id uuid not null references public.social_desk_clients(id) on delete cascade,
  shoot_date date not null,
  shoot_time time,
  shoot_location text,
  assigned_videographer_id uuid references public.digital_marketing_team_members(id) on delete set null,
  shoot_type text,
  shoot_description text,
  videos_shot_count int not null default 0 check (videos_shot_count >= 0),
  shoot_status text not null default 'Scheduled' check (shoot_status in ('Scheduled','Completed','Cancelled')),
  shoot_completed_date date,
  raw_video_uploaded text not null default 'No' check (raw_video_uploaded in ('Yes','No')),
  raw_video_upload_date date,
  raw_video_folder_link text,
  remarks text,
  created_by uuid references public.digital_marketing_team_members(id) on delete set null,
  updated_by uuid references public.digital_marketing_team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint video_shoot_completed_date_check check (
    (shoot_status <> 'Completed' and shoot_completed_date is null)
    or (shoot_status = 'Completed')
  ),
  constraint video_raw_upload_date_check check (
    (raw_video_uploaded = 'No' and raw_video_upload_date is null)
    or (raw_video_uploaded = 'Yes')
  )
);

create table if not exists public.video_reel_entries (
  id uuid primary key default gen_random_uuid(),
  reel_code bigint generated always as identity unique,
  client_id uuid not null references public.social_desk_clients(id) on delete cascade,
  linked_shoot_id uuid references public.video_shoots(id) on delete set null,
  reel_title text not null,
  reel_description text,
  assigned_editor_id uuid references public.digital_marketing_team_members(id) on delete set null,
  editing_start_date date,
  reel_completion_date date,
  reel_status text not null default 'Pending' check (reel_status in ('Pending','Editing','Review','Completed')),
  reels_completed_count int not null default 0 check (reels_completed_count >= 0),
  final_reel_uploaded text not null default 'No' check (final_reel_uploaded in ('Yes','No')),
  final_reel_upload_date date,
  final_reel_file_url text,
  final_reel_link text,
  group_shared text not null default 'No' check (group_shared in ('Yes','No')),
  group_shared_date date,
  remarks text,
  created_by uuid references public.digital_marketing_team_members(id) on delete set null,
  updated_by uuid references public.digital_marketing_team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reel_completed_count_check check (
    (reel_status = 'Completed' and reels_completed_count > 0)
    or (reel_status <> 'Completed' and reels_completed_count >= 0)
  ),
  constraint reel_upload_date_check check (
    (final_reel_uploaded = 'No' and final_reel_upload_date is null)
    or (final_reel_uploaded = 'Yes')
  ),
  constraint reel_group_shared_date_check check (
    (group_shared = 'No' and group_shared_date is null)
    or (group_shared = 'Yes')
  )
);

create table if not exists public.digital_marketing_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_member_id uuid references public.digital_marketing_team_members(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.dmt_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end $$;

create or replace function public.dmt_current_member()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.digital_marketing_team_members
  where auth_user_id = auth.uid()
    and active = true
  limit 1
$$;

create or replace function public.dmt_has_role(_role public.dmt_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.digital_marketing_team_members
    where auth_user_id = auth.uid()
      and role = _role
      and active = true
  )
$$;

create or replace function public.dmt_is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.dmt_has_role('super_admin')
$$;

create or replace function public.dmt_can_access_graphics(_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.dmt_is_super_admin()
    or exists(
      select 1
      from public.digital_marketing_team_members
      where id = coalesce(_member_id, public.dmt_current_member())
        and auth_user_id = auth.uid()
        and role = 'graphic_designer'
        and active = true
    )
$$;

create or replace function public.dmt_can_access_video(_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.dmt_is_super_admin()
    or exists(
      select 1
      from public.digital_marketing_team_members
      where id = coalesce(_member_id, public.dmt_current_member())
        and auth_user_id = auth.uid()
        and role = 'video_editor'
        and active = true
    )
$$;

create or replace view public.digital_marketing_client_monthly_summary as
select
  c.id as client_id,
  coalesce(c.business_name, c.name) as client_name,
  t.target_month,
  coalesce(t.graphic_target, 0) as graphic_target,
  coalesce(g.completed_creatives, 0) as completed_creatives,
  greatest(coalesce(t.graphic_target, 0) - coalesce(g.completed_creatives, 0), 0) as remaining_creatives,
  greatest(coalesce(g.completed_creatives, 0) - coalesce(t.graphic_target, 0), 0) as overdelivered_creatives,
  coalesce(g.group_shared_creatives, 0) as group_shared_creatives,
  greatest(coalesce(g.completed_creatives, 0) - coalesce(g.group_shared_creatives, 0), 0) as pending_graphic_group_shares,
  coalesce(t.reel_target, 0) as reel_target,
  coalesce(r.completed_reels, 0) as completed_reels,
  greatest(coalesce(t.reel_target, 0) - coalesce(r.completed_reels, 0), 0) as remaining_reels,
  greatest(coalesce(r.completed_reels, 0) - coalesce(t.reel_target, 0), 0) as overdelivered_reels,
  coalesce(r.final_videos_uploaded, 0) as final_videos_uploaded,
  coalesce(r.group_shared_reels, 0) as group_shared_reels,
  greatest(coalesce(r.completed_reels, 0) - coalesce(r.group_shared_reels, 0), 0) as pending_reel_group_shares,
  coalesce(s.completed_shoots, 0) as completed_shoots,
  coalesce(s.raw_videos_uploaded, 0) as raw_videos_uploaded
from public.social_desk_clients c
left join public.digital_marketing_monthly_targets t on t.client_id = c.id
left join lateral (
  select
    (sum(quantity) filter (where status = 'Completed'))::int as completed_creatives,
    (sum(quantity) filter (where status = 'Completed' and group_shared = 'Yes'))::int as group_shared_creatives
  from public.graphic_work_entries ge
  where ge.client_id = c.id
    and t.target_month is not null
    and date_trunc('month', ge.work_date)::date = t.target_month
) g on true
left join lateral (
  select
    (sum(reels_completed_count) filter (where reel_status = 'Completed'))::int as completed_reels,
    (sum(reels_completed_count) filter (where reel_status = 'Completed' and final_reel_uploaded = 'Yes'))::int as final_videos_uploaded,
    (sum(reels_completed_count) filter (where reel_status = 'Completed' and group_shared = 'Yes'))::int as group_shared_reels
  from public.video_reel_entries re
  where re.client_id = c.id
    and t.target_month is not null
    and date_trunc('month', coalesce(re.reel_completion_date, re.editing_start_date))::date = t.target_month
) r on true
left join lateral (
  select
    (count(*) filter (where shoot_status = 'Completed'))::int as completed_shoots,
    (count(*) filter (where raw_video_uploaded = 'Yes'))::int as raw_videos_uploaded
  from public.video_shoots vs
  where vs.client_id = c.id
    and t.target_month is not null
    and date_trunc('month', vs.shoot_date)::date = t.target_month
) s on true;

create index if not exists dmt_members_role_idx on public.digital_marketing_team_members(role, active);
create index if not exists dmt_targets_client_month_idx on public.digital_marketing_monthly_targets(client_id, target_month);
create index if not exists dmt_client_assignments_client_idx on public.digital_marketing_client_assignments(client_id, department, active);
create index if not exists dmt_client_assignments_member_idx on public.digital_marketing_client_assignments(member_id, active);
create index if not exists graphic_work_client_date_idx on public.graphic_work_entries(client_id, work_date);
create index if not exists graphic_work_designer_date_idx on public.graphic_work_entries(designer_id, work_date);
create index if not exists video_shoots_client_date_idx on public.video_shoots(client_id, shoot_date);
create index if not exists video_reels_client_completion_idx on public.video_reel_entries(client_id, reel_completion_date);
create index if not exists video_reels_editor_date_idx on public.video_reel_entries(assigned_editor_id, reel_completion_date);
create index if not exists dmt_activity_entity_idx on public.digital_marketing_activity_logs(entity_type, entity_id, created_at);

do $$
declare t text;
begin
  foreach t in array array[
    'digital_marketing_team_members',
    'digital_marketing_monthly_targets',
    'digital_marketing_client_assignments',
    'graphic_work_entries',
    'video_shoots',
    'video_reel_entries',
    'digital_marketing_activity_logs'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop trigger if exists dmt_touch on public.%I;', t);
    if t <> 'digital_marketing_activity_logs' then
      execute format('create trigger dmt_touch before update on public.%I for each row execute function public.dmt_touch_updated_at();', t);
    end if;
    execute format('grant select, insert, update, delete on public.%I to authenticated;', t);
    execute format('grant all on public.%I to service_role;', t);
  end loop;
end $$;

drop policy if exists "dmt members select" on public.digital_marketing_team_members;
create policy "dmt members select"
on public.digital_marketing_team_members
for select
to authenticated
using (public.dmt_current_member() is not null);

drop policy if exists "dmt members super admin write" on public.digital_marketing_team_members;
create policy "dmt members super admin write"
on public.digital_marketing_team_members
for all
to authenticated
using (public.dmt_is_super_admin())
with check (public.dmt_is_super_admin());

drop policy if exists "dmt targets staff read" on public.digital_marketing_monthly_targets;
create policy "dmt targets staff read"
on public.digital_marketing_monthly_targets
for select
to authenticated
using (public.dmt_current_member() is not null);

drop policy if exists "dmt targets super admin write" on public.digital_marketing_monthly_targets;
create policy "dmt targets super admin write"
on public.digital_marketing_monthly_targets
for all
to authenticated
using (public.dmt_is_super_admin())
with check (public.dmt_is_super_admin());

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

drop policy if exists "graphic work access" on public.graphic_work_entries;
create policy "graphic work access"
on public.graphic_work_entries
for all
to authenticated
using (public.dmt_can_access_graphics(designer_id))
with check (
  public.dmt_is_super_admin()
  or (
    public.dmt_has_role('graphic_designer')
    and designer_id = public.dmt_current_member()
  )
);

drop policy if exists "video shoots access" on public.video_shoots;
create policy "video shoots access"
on public.video_shoots
for all
to authenticated
using (public.dmt_can_access_video(assigned_videographer_id))
with check (
  public.dmt_is_super_admin()
  or (
    public.dmt_has_role('video_editor')
    and assigned_videographer_id = public.dmt_current_member()
  )
);

drop policy if exists "video reels access" on public.video_reel_entries;
create policy "video reels access"
on public.video_reel_entries
for all
to authenticated
using (public.dmt_can_access_video(assigned_editor_id))
with check (
  public.dmt_is_super_admin()
  or (
    public.dmt_has_role('video_editor')
    and assigned_editor_id = public.dmt_current_member()
  )
);

drop policy if exists "dmt activity logs read" on public.digital_marketing_activity_logs;
create policy "dmt activity logs read"
on public.digital_marketing_activity_logs
for select
to authenticated
using (public.dmt_is_super_admin());

drop policy if exists "dmt activity logs insert" on public.digital_marketing_activity_logs;
create policy "dmt activity logs insert"
on public.digital_marketing_activity_logs
for insert
to authenticated
with check (public.dmt_current_member() is not null);

grant select on public.digital_marketing_client_monthly_summary to authenticated;
grant usage, select on all sequences in schema public to authenticated;

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
