-- Fix SocialDesk RLS insert/update errors for one existing Auth user.
-- Run this in Supabase SQL Editor when you see:
-- "new row violates row-level security policy for table social_desk_follower_snapshots".
--
-- IMPORTANT:
-- Replace the email below with the exact email used to log in to SocialDesk.
-- Example: 'yourname@example.com'

insert into public.social_desk_user_roles (user_id, role)
select u.id, 'admin'::public.social_desk_app_role
from auth.users u
where lower(u.email) = lower('REPLACE_WITH_SOCIAL_DESK_LOGIN_EMAIL')
on conflict (user_id, role) do nothing;

alter table public.social_desk_follower_snapshots
add column if not exists facebook_url text;

notify pgrst, 'reload schema';
