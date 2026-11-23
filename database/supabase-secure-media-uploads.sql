-- REVIEW AND APPLY ONLY WITH APPROVAL. This file has not been run against production.
-- Keep public media reads and other buckets unchanged. Restrictive policies are
-- ANDed with existing permissive policies, including broadly authenticated ones.
-- Only the backend service_role can bypass these policies; its upload endpoint
-- first verifies Supabase identity, profiles.role = 'admin', and the image bytes.

begin;

drop policy if exists "Media writes require server insert" on storage.objects;
create policy "Media writes require server insert"
on storage.objects as restrictive for insert to anon, authenticated
with check (bucket_id <> 'case-study-images');

drop policy if exists "Media writes require server update" on storage.objects;
create policy "Media writes require server update"
on storage.objects as restrictive for update to anon, authenticated
using (bucket_id <> 'case-study-images')
with check (bucket_id <> 'case-study-images');

drop policy if exists "Media writes require server delete" on storage.objects;
create policy "Media writes require server delete"
on storage.objects as restrictive for delete to anon, authenticated
using (bucket_id <> 'case-study-images');

commit;
