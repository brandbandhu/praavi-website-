insert into public.digital_marketing_team_members (
  auth_user_id,
  username,
  full_name,
  email,
  role,
  department,
  active
)
select
  u.id,
  'digital_marketing_team',
  'Digital Marketing Team Admin',
  'digital_marketing_team@praavi.local',
  'super_admin',
  null,
  true
from auth.users u
where lower(u.email) = 'digital_marketing_team@praavi.local'
on conflict (username) do update
set
  auth_user_id = excluded.auth_user_id,
  full_name = excluded.full_name,
  email = excluded.email,
  role = excluded.role,
  department = excluded.department,
  active = true,
  updated_at = now();

notify pgrst, 'reload schema';
