-- Use this if login shows: "Database error querying schema".
-- It removes the manually inserted Auth user so you can recreate it safely
-- from Supabase Dashboard > Authentication > Users.

delete from public.digital_marketing_team_members
where username = 'digital_marketing_team'
   or lower(email) = 'digital_marketing_team@praavi.local';

delete from auth.identities
where lower(provider_id) = 'digital_marketing_team@praavi.local'
   or user_id in (
    select id
    from auth.users
    where lower(email) = 'digital_marketing_team@praavi.local'
  );

delete from auth.users
where lower(email) = 'digital_marketing_team@praavi.local';

notify pgrst, 'reload schema';
