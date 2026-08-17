-- Praavi Finance RLS policy repair
-- Run this in Supabase SQL Editor when finance dashboard inserts/updates fail
-- with: "new row violates row-level security policy".
--
-- The finance API currently uses the Supabase anon key from server/.env, so each
-- finance table needs an anon policy. These policies match the main setup file.

alter table public."User" enable row level security;
alter table public."LoginLog" enable row level security;
alter table public."ActivityLog" enable row level security;
alter table public."BucketConfigVersion" enable row level security;
alter table public."BucketConfigEntry" enable row level security;
alter table public."Payment" enable row level security;
alter table public."BucketTransfer" enable row level security;
alter table public."Employee" enable row level security;
alter table public."SalaryDisbursement" enable row level security;
alter table public."SalaryPaymentLog" enable row level security;
alter table public."SubscriptionMisc" enable row level security;
alter table public."Receivable" enable row level security;
alter table public."FollowUp" enable row level security;
alter table public."DeliverableType" enable row level security;
alter table public."QuotationPackage" enable row level security;
alter table public."Quotation" enable row level security;
alter table public."QuotationLineItem" enable row level security;
alter table public."QuotationPackageItem" enable row level security;
alter table public."QuotationDeliverable" enable row level security;

drop policy if exists "finance_api_all_User" on public."User";
create policy "finance_api_all_User" on public."User" for all to anon using (true) with check (true);

drop policy if exists "finance_api_all_LoginLog" on public."LoginLog";
create policy "finance_api_all_LoginLog" on public."LoginLog" for all to anon using (true) with check (true);

drop policy if exists "finance_api_all_ActivityLog" on public."ActivityLog";
create policy "finance_api_all_ActivityLog" on public."ActivityLog" for all to anon using (true) with check (true);

drop policy if exists "finance_api_all_BucketConfigVersion" on public."BucketConfigVersion";
create policy "finance_api_all_BucketConfigVersion" on public."BucketConfigVersion" for all to anon using (true) with check (true);

drop policy if exists "finance_api_all_BucketConfigEntry" on public."BucketConfigEntry";
create policy "finance_api_all_BucketConfigEntry" on public."BucketConfigEntry" for all to anon using (true) with check (true);

drop policy if exists "finance_api_all_Payment" on public."Payment";
create policy "finance_api_all_Payment" on public."Payment" for all to anon using (true) with check (true);

drop policy if exists "finance_api_all_BucketTransfer" on public."BucketTransfer";
create policy "finance_api_all_BucketTransfer" on public."BucketTransfer" for all to anon using (true) with check (true);

drop policy if exists "finance_api_all_Employee" on public."Employee";
create policy "finance_api_all_Employee" on public."Employee" for all to anon using (true) with check (true);

drop policy if exists "finance_api_all_SalaryDisbursement" on public."SalaryDisbursement";
create policy "finance_api_all_SalaryDisbursement" on public."SalaryDisbursement" for all to anon using (true) with check (true);

drop policy if exists "finance_api_all_SalaryPaymentLog" on public."SalaryPaymentLog";
create policy "finance_api_all_SalaryPaymentLog" on public."SalaryPaymentLog" for all to anon using (true) with check (true);

drop policy if exists "finance_api_all_SubscriptionMisc" on public."SubscriptionMisc";
create policy "finance_api_all_SubscriptionMisc" on public."SubscriptionMisc" for all to anon using (true) with check (true);

drop policy if exists "finance_api_all_Receivable" on public."Receivable";
create policy "finance_api_all_Receivable" on public."Receivable" for all to anon using (true) with check (true);

drop policy if exists "finance_api_all_FollowUp" on public."FollowUp";
create policy "finance_api_all_FollowUp" on public."FollowUp" for all to anon using (true) with check (true);

drop policy if exists "finance_api_all_DeliverableType" on public."DeliverableType";
create policy "finance_api_all_DeliverableType" on public."DeliverableType" for all to anon using (true) with check (true);

drop policy if exists "finance_api_all_QuotationPackage" on public."QuotationPackage";
create policy "finance_api_all_QuotationPackage" on public."QuotationPackage" for all to anon using (true) with check (true);

drop policy if exists "finance_api_all_Quotation" on public."Quotation";
create policy "finance_api_all_Quotation" on public."Quotation" for all to anon using (true) with check (true);

drop policy if exists "finance_api_all_QuotationLineItem" on public."QuotationLineItem";
create policy "finance_api_all_QuotationLineItem" on public."QuotationLineItem" for all to anon using (true) with check (true);

drop policy if exists "finance_api_all_QuotationPackageItem" on public."QuotationPackageItem";
create policy "finance_api_all_QuotationPackageItem" on public."QuotationPackageItem" for all to anon using (true) with check (true);

drop policy if exists "finance_api_all_QuotationDeliverable" on public."QuotationDeliverable";
create policy "finance_api_all_QuotationDeliverable" on public."QuotationDeliverable" for all to anon using (true) with check (true);
