-- Supabase Case Studies table for Praavi admin and public /case-studies page.
-- Run this in Supabase SQL Editor after your main project tables are ready.

create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public)
values ('case-study-images', 'case-study-images', true)
on conflict (id) do update set public = excluded.public;

create table if not exists public.case_studies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  client text not null,
  title text not null,
  problem text not null,
  solution text not null,
  technology text[] not null default '{}',
  before_state text not null default '',
  after_state text not null default '',
  traffic_growth text not null default '',
  leads_generated text not null default '',
  testimonial text not null default '',
  screenshot_url text not null default '/placeholder.svg',
  status text not null default 'published' check (status in ('draft', 'published')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists case_studies_status_created_at_idx
  on public.case_studies (status, created_at desc);

create or replace function public.set_case_studies_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_case_studies_updated_at on public.case_studies;

create trigger set_case_studies_updated_at
before update on public.case_studies
for each row
execute function public.set_case_studies_updated_at();

alter table public.case_studies enable row level security;

drop policy if exists "Public can read case study images" on storage.objects;
create policy "Public can read case study images"
on storage.objects for select
using (bucket_id = 'case-study-images');

drop policy if exists "Authenticated admins can upload case study images" on storage.objects;
create policy "Authenticated admins can upload case study images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'case-study-images');

drop policy if exists "Authenticated admins can update case study images" on storage.objects;
create policy "Authenticated admins can update case study images"
on storage.objects for update
to authenticated
using (bucket_id = 'case-study-images')
with check (bucket_id = 'case-study-images');

drop policy if exists "Authenticated admins can delete case study images" on storage.objects;
create policy "Authenticated admins can delete case study images"
on storage.objects for delete
to authenticated
using (bucket_id = 'case-study-images');

drop policy if exists "Public can read published case studies" on public.case_studies;
create policy "Public can read published case studies"
on public.case_studies
for select
using (status = 'published');

drop policy if exists "Authenticated admins can manage case studies" on public.case_studies;
create policy "Authenticated admins can manage case studies"
on public.case_studies
for all
to authenticated
using (true)
with check (true);

delete from public.case_studies
where slug = 'skincity-healthcare-appointment-leads';

insert into public.case_studies (
  slug,
  client,
  title,
  problem,
  solution,
  technology,
  before_state,
  after_state,
  traffic_growth,
  leads_generated,
  testimonial,
  screenshot_url,
  status,
  sort_order
)
values
(
  'kamou-solar-lead-generation',
  'Kamou Solar',
  'Solar Lead Generation & Digital Presence',
  'Kamou Solar had no strong online presence and was missing high-intent customers searching for rooftop and commercial solar solutions.',
  'Praavi created a professional website, SEO-ready service pages, Google Ads landing flow, and analytics setup to capture and measure enquiries.',
  array['React', 'SEO', 'Google Ads', 'Analytics', 'Lead Forms'],
  'Offline enquiries, weak digital trust, and scattered brand visibility.',
  'Professional web presence with campaign-ready pages and clear enquiry paths.',
  '200% engagement increase',
  '45+ qualified monthly enquiries',
  'Praavi helped us move from basic visibility to a serious online lead channel.',
  '/placeholder.svg',
  'published',
  1
),
(
  'vynk-parking-brand-clarity',
  'Vynk Parking',
  'Smart Parking Website & Brand Clarity',
  'The smart parking solution needed a clearer digital product story and stronger trust signals for customers and partners.',
  'Praavi designed a responsive website, simplified the product narrative, improved visual presentation, and created an SEO-friendly structure.',
  array['React', 'Branding', 'SEO', 'Dashboard UI'],
  'Complex offering with low clarity and limited digital credibility.',
  'Clear solution narrative supported by modern design and stronger trust signals.',
  '150% traffic increase',
  '30+ partner enquiries',
  'The new website made our product easier to understand and present.',
  '/placeholder.svg',
  'published',
  2
),
(
  'banquetbee-platform-experience',
  'BanquetBee',
  'Venue Discovery Platform Experience',
  'BanquetBee needed more than a brochure website; users needed a platform-style experience to discover venues and submit enquiries.',
  'Praavi built a listing platform with admin workflows, structured venue pages, SEO foundations, and conversion-focused enquiry paths.',
  array['React', 'Platform UI', 'SEO', 'Admin Dashboard'],
  'Manual venue discovery, poor search reach, and no scalable browsing experience.',
  'Search-friendly platform with structured venue browsing and lead capture.',
  '300% user engagement',
  '80+ venue enquiries',
  'Praavi converted our idea into a usable platform with growth potential.',
  '/placeholder.svg',
  'published',
  3
),
(
  'realtrips-travel-package-enquiries',
  'RealTrips',
  'Travel Package Enquiry Growth',
  'RealTrips needed to present travel packages more clearly online and generate qualified enquiries from customers comparing destinations and itineraries.',
  'Praavi improved the travel offer presentation with destination-led content, campaign-friendly pages, and enquiry flows for WhatsApp and form leads.',
  array['Website Development', 'SEO', 'Social Media', 'WhatsApp Leads'],
  'Package discovery was scattered and interested users had no clear next step.',
  'Destination pages and lead paths made it easier for travellers to enquire quickly.',
  '220% package page engagement',
  '75+ travel enquiries',
  'Praavi helped us present our travel packages professionally and generate more serious enquiries.',
  '/landing/assets/RealTrips-C0YTP2sd.png',
  'published',
  4
)
on conflict (slug) do nothing;
