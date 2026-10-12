alter table public.social_desk_clients
add column if not exists instagram_business_account_id text,
add column if not exists facebook_page_id text;

alter table public.social_desk_content_items
add column if not exists shared_on_group text not null default 'No';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'social_desk_content_items_shared_on_group_check'
  ) then
    alter table public.social_desk_content_items
    add constraint social_desk_content_items_shared_on_group_check check (shared_on_group in ('Yes','No'));
  end if;
end $$;

create table if not exists public.social_desk_follower_snapshots (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.social_desk_clients(id) on delete cascade,
  snapshot_date date not null default current_date,
  instagram_start_followers int not null default 0 check (instagram_start_followers >= 0),
  instagram_followers int not null default 0 check (instagram_followers >= 0),
  facebook_start_followers int not null default 0 check (facebook_start_followers >= 0),
  facebook_followers int not null default 0 check (facebook_followers >= 0),
  instagram_url text,
  facebook_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(client_id, snapshot_date)
);

alter table public.social_desk_follower_snapshots
add column if not exists instagram_start_followers int not null default 0,
add column if not exists facebook_start_followers int not null default 0,
add column if not exists facebook_url text;

update public.social_desk_follower_snapshots
set instagram_start_followers = instagram_followers
where instagram_start_followers = 0 and instagram_followers > 0;

update public.social_desk_follower_snapshots
set facebook_start_followers = facebook_followers
where facebook_start_followers = 0 and facebook_followers > 0;

create index if not exists social_desk_follower_snapshots_client_date_idx
on public.social_desk_follower_snapshots(client_id, snapshot_date);

grant select, insert, update, delete on public.social_desk_follower_snapshots to authenticated;
grant all on public.social_desk_follower_snapshots to service_role;

alter table public.social_desk_follower_snapshots enable row level security;

drop policy if exists "social desk staff all" on public.social_desk_follower_snapshots;
create policy "social desk staff all"
on public.social_desk_follower_snapshots
for all
to authenticated
using (public.social_desk_is_staff())
with check (public.social_desk_is_staff());

drop trigger if exists social_desk_touch on public.social_desk_follower_snapshots;
create trigger social_desk_touch
before update on public.social_desk_follower_snapshots
for each row execute function public.social_desk_touch_updated_at();

notify pgrst, 'reload schema';
