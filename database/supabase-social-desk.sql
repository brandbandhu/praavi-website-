do $$
begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'social_desk_app_role') then
    create type public.social_desk_app_role as enum ('admin','member');
  end if;
end $$;

create table if not exists public.social_desk_user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.social_desk_app_role not null,
  unique(user_id, role)
);

grant select on public.social_desk_user_roles to authenticated;
grant all on public.social_desk_user_roles to service_role;
alter table public.social_desk_user_roles enable row level security;
drop policy if exists "social desk own roles" on public.social_desk_user_roles;
create policy "social desk own roles" on public.social_desk_user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.social_desk_has_role(_user_id uuid, _role public.social_desk_app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.social_desk_user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.social_desk_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.social_desk_user_roles where user_id = auth.uid())
$$;

create or replace function public.social_desk_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.social_desk_user_roles) then
    insert into public.social_desk_user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;

drop trigger if exists social_desk_on_auth_user_created on auth.users;
create trigger social_desk_on_auth_user_created
after insert on auth.users
for each row execute function public.social_desk_handle_new_user();

create or replace function public.social_desk_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table if not exists public.social_desk_clients (
  id uuid primary key default gen_random_uuid(),
  code serial unique,
  name text not null,
  business_name text,
  contact_person text,
  mobile text,
  email text,
  category text,
  instagram text,
  facebook text,
  other_links text,
  logo_url text,
  contract_start date,
  post_target int not null default 0,
  reel_target int not null default 0,
  group_target int not null default 0,
  ad_budget numeric(12,2) not null default 0,
  assigned_to text,
  status text not null default 'Active' check (status in ('Active','Paused','Archived')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_desk_content_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.social_desk_clients(id) on delete cascade,
  content_type text not null default 'Post',
  title text not null,
  description text,
  platform text default 'Instagram',
  scheduled_date date,
  published_date date,
  assigned_to text,
  status text not null default 'Planned',
  url text,
  group_share_count int not null default 0,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_desk_boosts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.social_desk_clients(id) on delete cascade,
  content_id uuid references public.social_desk_content_items(id) on delete set null,
  campaign_name text not null,
  platform text default 'Instagram',
  objective text,
  post_url text,
  start_date date,
  end_date date,
  status text not null default 'Draft',
  budget numeric(12,2) not null default 0,
  spent numeric(12,2) not null default 0,
  reach int not null default 0,
  impressions int not null default 0,
  engagements int not null default 0,
  profile_visits int not null default 0,
  link_clicks int not null default 0,
  followers_before int,
  followers_after int,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_desk_transactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.social_desk_clients(id) on delete cascade,
  txn_date date not null default current_date,
  txn_type text not null default 'Fund Added',
  amount numeric(12,2) not null check (amount >= 0),
  payment_method text,
  reference text,
  boost_id uuid references public.social_desk_boosts(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_desk_settings (
  id int primary key default 1 check (id = 1),
  agency_name text not null default 'My Agency',
  contact text,
  currency text not null default 'INR',
  timezone text not null default 'Asia/Kolkata',
  default_post_target int not null default 12,
  default_reel_target int not null default 8,
  default_group_target int not null default 20,
  low_balance_threshold numeric(12,2) not null default 1000,
  updated_at timestamptz not null default now()
);

insert into public.social_desk_settings(id) values (1) on conflict (id) do nothing;

create index if not exists social_desk_content_items_client_date_idx on public.social_desk_content_items(client_id, scheduled_date);
create index if not exists social_desk_boosts_client_start_idx on public.social_desk_boosts(client_id, start_date);
create index if not exists social_desk_transactions_client_date_idx on public.social_desk_transactions(client_id, txn_date);

do $$
declare t text;
begin
  foreach t in array array['social_desk_clients','social_desk_content_items','social_desk_boosts','social_desk_transactions','social_desk_settings'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated; grant all on public.%I to service_role;', t, t);
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "social desk staff all" on public.%I;', t);
    execute format('create policy "social desk staff all" on public.%I for all to authenticated using (public.social_desk_is_staff()) with check (public.social_desk_is_staff());', t);
    execute format('drop trigger if exists social_desk_touch on public.%I;', t);
    execute format('create trigger social_desk_touch before update on public.%I for each row execute function public.social_desk_touch_updated_at();', t);
  end loop;
end $$;

grant usage, select on sequence public.social_desk_clients_code_seq to authenticated;
