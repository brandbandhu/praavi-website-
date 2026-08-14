-- Praavi Finance Management System - Supabase setup
-- Run this full file in Supabase SQL Editor.
--
-- Admin URL:
-- https://praaviconsultants.in/finance-management-system/fms/praavi-internal/admin
--
-- Finance team URL:
-- https://praaviconsultants.in/finance-management-system/fms/praavi-internal/finance-team

create table if not exists public."User" (
  "id" text primary key,
  "email" text not null unique,
  "passwordHash" text not null,
  "name" text not null,
  "role" text not null,
  "createdAt" timestamp(3) not null default current_timestamp
);

create table if not exists public."LoginLog" (
  "id" text primary key,
  "userId" text not null,
  "loginAt" timestamp(3) not null default current_timestamp,
  "ipAddress" text,
  "userAgent" text
);

create table if not exists public."ActivityLog" (
  "id" text primary key,
  "userId" text not null,
  "action" text not null,
  "entityType" text,
  "entityId" text,
  "summary" text not null,
  "createdAt" timestamp(3) not null default current_timestamp
);

create table if not exists public."BucketConfigVersion" (
  "id" text primary key,
  "effectiveFrom" timestamp(3) not null,
  "createdAt" timestamp(3) not null default current_timestamp,
  "createdById" text
);

create table if not exists public."BucketConfigEntry" (
  "id" text primary key,
  "versionId" text not null,
  "bucketName" text not null,
  "percentageBps" integer not null,
  "fixedMonthlyTargetPaise" integer,
  "fixedMonthlyTargetMinPaise" integer,
  "fixedMonthlyTargetMaxPaise" integer,
  "dueDay" integer
);

create table if not exists public."Payment" (
  "id" text primary key,
  "dateReceived" timestamp(3) not null,
  "clientName" text not null,
  "department" text not null,
  "invoiceNumber" text,
  "paymentAmountPaise" integer not null,
  "gstType" text not null,
  "gstPercentBps" integer not null default 1800,
  "landedInAccount" text not null,
  "notes" text,
  "createdById" text,
  "createdAt" timestamp(3) not null default current_timestamp,
  "receiptNumber" text,
  "receiptGeneratedAt" timestamp(3)
);

create table if not exists public."BucketTransfer" (
  "id" text primary key,
  "paymentId" text not null,
  "bucketName" text not null,
  "status" text not null default 'Pending',
  "transferredDate" timestamp(3),
  "transferredById" text
);

create table if not exists public."Employee" (
  "id" text primary key,
  "name" text not null,
  "active" boolean not null default true,
  "monthlySalaryPaise" integer not null,
  "joinDate" timestamp(3) not null,
  "createdAt" timestamp(3) not null default current_timestamp
);

create table if not exists public."SalaryDisbursement" (
  "id" text primary key,
  "employeeId" text not null,
  "month" text not null,
  "amountDuePaise" integer not null,
  "amountPaidPaise" integer not null default 0,
  "datePaid" timestamp(3),
  "accountUsed" text,
  "createdAt" timestamp(3) not null default current_timestamp
);

create table if not exists public."SalaryPaymentLog" (
  "id" text primary key,
  "disbursementId" text not null,
  "amountPaise" integer not null,
  "datePaid" timestamp(3) not null,
  "accountUsed" text,
  "createdById" text,
  "createdAt" timestamp(3) not null default current_timestamp
);

create table if not exists public."SubscriptionMisc" (
  "id" text primary key,
  "name" text not null,
  "amountPaise" integer not null,
  "active" boolean not null default true,
  "frequency" text not null,
  "createdAt" timestamp(3) not null default current_timestamp
);

create table if not exists public."Receivable" (
  "id" text primary key,
  "clientName" text not null,
  "invoiceNumber" text,
  "invoiceDate" timestamp(3) not null,
  "amountPendingPaise" integer not null,
  "department" text not null,
  "createdAt" timestamp(3) not null default current_timestamp,
  "status" text not null default 'Pending',
  "collectedDate" timestamp(3),
  "collectedAmountPaise" integer,
  "collectedById" text
);

create table if not exists public."FollowUp" (
  "id" text primary key,
  "receivableId" text not null,
  "sequenceNumber" integer not null,
  "date" timestamp(3) not null,
  "method" text,
  "notes" text,
  "createdById" text,
  "createdAt" timestamp(3) not null default current_timestamp
);

create table if not exists public."DeliverableType" (
  "id" text primary key,
  "name" text not null,
  "unit" text not null,
  "department" text not null default 'Digital Marketing',
  "active" boolean not null default true,
  "sortOrder" integer not null default 0
);

create table if not exists public."QuotationPackage" (
  "id" text primary key,
  "name" text not null,
  "description" text,
  "department" text not null default 'Digital Marketing',
  "defaultPricePaise" integer,
  "active" boolean not null default true,
  "sortOrder" integer not null default 0
);

create table if not exists public."Quotation" (
  "id" text primary key,
  "quotationNumber" text not null unique,
  "clientName" text not null,
  "department" text not null,
  "status" text not null default 'Draft',
  "validUntil" timestamp(3),
  "notes" text,
  "gstType" text not null default 'Exclusive',
  "gstPercentBps" integer not null default 1800,
  "totalAmountPaise" integer not null,
  "receivableId" text unique,
  "createdById" text,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null,
  "packageId" text
);

create table if not exists public."QuotationLineItem" (
  "id" text primary key,
  "quotationId" text not null,
  "description" text not null,
  "amountPaise" integer not null,
  "sortOrder" integer not null default 0
);

create table if not exists public."QuotationPackageItem" (
  "id" text primary key,
  "packageId" text not null,
  "deliverableTypeId" text not null,
  "included" boolean not null default true,
  "quantity" integer not null default 0
);

create table if not exists public."QuotationDeliverable" (
  "id" text primary key,
  "quotationId" text not null,
  "deliverableTypeId" text,
  "name" text not null,
  "unit" text not null,
  "included" boolean not null default false,
  "quantity" integer not null default 0,
  "sortOrder" integer not null default 0
);

create unique index if not exists "BucketConfigEntry_versionId_bucketName_key" on public."BucketConfigEntry"("versionId", "bucketName");
create unique index if not exists "BucketTransfer_paymentId_bucketName_key" on public."BucketTransfer"("paymentId", "bucketName");
create unique index if not exists "SalaryDisbursement_employeeId_month_key" on public."SalaryDisbursement"("employeeId", "month");
create unique index if not exists "FollowUp_receivableId_sequenceNumber_key" on public."FollowUp"("receivableId", "sequenceNumber");
create unique index if not exists "QuotationPackageItem_packageId_deliverableTypeId_key" on public."QuotationPackageItem"("packageId", "deliverableTypeId");

insert into public."User" ("id", "email", "passwordHash", "name", "role")
values
  ('user-admin-malhar', 'admin-username', 'REPLACE_WITH_ADMIN_BCRYPT_HASH', 'Malhar Pandey', 'founder'),
  ('user-finance-sakshi', 'finance-username', 'REPLACE_WITH_FINANCE_BCRYPT_HASH', 'Sakshi Finance', 'accountant')
on conflict ("email") do update set
  "passwordHash" = excluded."passwordHash",
  "name" = excluded."name",
  "role" = excluded."role";

insert into public."BucketConfigVersion" ("id", "effectiveFrom", "createdAt")
values ('default-bucket-config-2020', '2020-01-01 00:00:00', current_timestamp)
on conflict ("id") do nothing;

insert into public."BucketConfigEntry" (
  "id",
  "versionId",
  "bucketName",
  "percentageBps",
  "fixedMonthlyTargetPaise",
  "fixedMonthlyTargetMinPaise",
  "fixedMonthlyTargetMaxPaise",
  "dueDay"
)
values
  ('bucket-salary-pool', 'default-bucket-config-2020', 'salary_pool', 5600, null, null, null, 1),
  ('bucket-kotak', 'default-bucket-config-2020', 'kotak', 1900, 8000000, null, null, 10),
  ('bucket-fuel', 'default-bucket-config-2020', 'fuel', 200, null, 600000, 800000, null),
  ('bucket-axis', 'default-bucket-config-2020', 'axis', 800, null, null, null, null),
  ('bucket-marketing', 'default-bucket-config-2020', 'marketing', 700, null, null, null, null),
  ('bucket-profit', 'default-bucket-config-2020', 'profit', 800, null, null, null, null)
on conflict ("versionId", "bucketName") do update set
  "percentageBps" = excluded."percentageBps",
  "fixedMonthlyTargetPaise" = excluded."fixedMonthlyTargetPaise",
  "fixedMonthlyTargetMinPaise" = excluded."fixedMonthlyTargetMinPaise",
  "fixedMonthlyTargetMaxPaise" = excluded."fixedMonthlyTargetMaxPaise",
  "dueDay" = excluded."dueDay";

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
