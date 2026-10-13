-- Fix for SocialDesk follower snapshots when Facebook link is optional.
-- Run this in Supabase SQL Editor if saving a follower snapshot says:
-- "Could not find the 'facebook_url' column of 'social_desk_follower_snapshots'".

alter table public.social_desk_follower_snapshots
add column if not exists facebook_url text;

notify pgrst, 'reload schema';
