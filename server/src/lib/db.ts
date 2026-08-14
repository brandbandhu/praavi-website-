import { createClient } from "@supabase/supabase-js";
import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

type AnyRow = Record<string, any>;
type Where = Record<string, any> | undefined;

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase config. Set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const tableByModel: Record<string, string> = {
  user: "User",
  loginLog: "LoginLog",
  activityLog: "ActivityLog",
  bucketConfigVersion: "BucketConfigVersion",
  bucketConfigEntry: "BucketConfigEntry",
  payment: "Payment",
  bucketTransfer: "BucketTransfer",
  employee: "Employee",
  salaryDisbursement: "SalaryDisbursement",
  salaryPaymentLog: "SalaryPaymentLog",
  subscriptionMisc: "SubscriptionMisc",
  receivable: "Receivable",
  followUp: "FollowUp",
  quotation: "Quotation",
  quotationLineItem: "QuotationLineItem",
  deliverableType: "DeliverableType",
  quotationPackage: "QuotationPackage",
  quotationPackageItem: "QuotationPackageItem",
  quotationDeliverable: "QuotationDeliverable",
};

const dateFields: Record<string, string[]> = {
  User: ["createdAt"],
  LoginLog: ["loginAt"],
  ActivityLog: ["createdAt"],
  BucketConfigVersion: ["effectiveFrom", "createdAt"],
  Payment: ["dateReceived", "createdAt", "receiptGeneratedAt"],
  Employee: ["joinDate", "createdAt"],
  SalaryPaymentLog: ["datePaid", "createdAt"],
  SalaryDisbursement: ["datePaid", "createdAt"],
  SubscriptionMisc: ["createdAt"],
  Receivable: ["invoiceDate", "createdAt", "collectedDate"],
  FollowUp: ["date", "createdAt"],
  Quotation: ["validUntil", "createdAt", "updatedAt"],
};

function toDbValue(value: any): any {
  if (value instanceof Date) return value.toISOString();
  return value;
}

function toDbRow(input: AnyRow): AnyRow {
  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, toDbValue(value)])
  );
}

function fromDbRow<T = any>(table: string, row: T): T {
  if (!row || typeof row !== "object") return row;
  const copy: AnyRow = { ...(row as AnyRow) };
  for (const field of dateFields[table] ?? []) {
    if (copy[field]) copy[field] = new Date(copy[field]);
  }
  return copy as T;
}

function throwIfError(error: any): void {
  if (error) throw new Error(error.message || "Supabase database error");
}

function applyWhere(query: any, where: Where): any {
  if (!where || Object.keys(where).length === 0) return query;

  for (const [field, value] of Object.entries(where)) {
    if (value === undefined) continue;
    if (value && typeof value === "object" && !(value instanceof Date) && !Array.isArray(value)) {
      if ("in" in value) query = query.in(field, value.in);
      else if ("gte" in value || "lt" in value || "lte" in value || "gt" in value) {
        if (value.gte !== undefined) query = query.gte(field, toDbValue(value.gte));
        if (value.gt !== undefined) query = query.gt(field, toDbValue(value.gt));
        if (value.lte !== undefined) query = query.lte(field, toDbValue(value.lte));
        if (value.lt !== undefined) query = query.lt(field, toDbValue(value.lt));
      } else if ("startsWith" in value) query = query.like(field, `${value.startsWith}%`);
      else query = query.eq(field, toDbValue(value));
    } else {
      query = query.eq(field, toDbValue(value));
    }
  }

  return query;
}

function compoundWhere(where: AnyRow): AnyRow {
  const [key, value] = Object.entries(where)[0] ?? [];
  if (!key || !value || typeof value !== "object") return where;
  if (key === "paymentId_bucketName") return value as AnyRow;
  if (key === "employeeId_month") return value as AnyRow;
  if (key === "versionId_bucketName") return value as AnyRow;
  return where;
}

async function includeRelations(model: string, row: any, include: any): Promise<any> {
  if (!row || !include) return row;
  const result = { ...row };

  if (model === "bucketConfigVersion" && include.entries) {
    result.entries = await prisma.bucketConfigEntry.findMany({ where: { versionId: row.id } });
  }
  if (model === "bucketTransfer" && include.payment) {
    result.payment = await prisma.payment.findUnique({ where: { id: row.paymentId } });
  }
  if (model === "salaryDisbursement" && include.payments) {
    result.payments = await prisma.salaryPaymentLog.findMany({
      where: { disbursementId: row.id },
      orderBy: include.payments.orderBy,
    });
  }
  if (model === "receivable" && include.followUps) {
    result.followUps = await prisma.followUp.findMany({
      where: { receivableId: row.id },
      orderBy: include.followUps.orderBy,
      take: include.followUps.take,
    });
  }
  if (model === "receivable" && include._count?.select?.followUps) {
    result._count = { followUps: await prisma.followUp.count({ where: { receivableId: row.id } }) };
  }
  if (model === "quotationPackage" && include.items) {
    result.items = await prisma.quotationPackageItem.findMany({
      where: { packageId: row.id },
      include: include.items.include,
    });
  }
  if (model === "quotationPackageItem" && include.deliverableType) {
    result.deliverableType = await prisma.deliverableType.findUnique({ where: { id: row.deliverableTypeId } });
  }
  if (model === "quotation" && include.lineItems) {
    result.lineItems = await prisma.quotationLineItem.findMany({ where: { quotationId: row.id } });
  }
  if (model === "quotation" && include.deliverables) {
    result.deliverables = await prisma.quotationDeliverable.findMany({ where: { quotationId: row.id } });
  }
  if (model === "quotation" && include.package) {
    result.package = row.packageId ? await prisma.quotationPackage.findUnique({ where: { id: row.packageId } }) : null;
  }

  return result;
}

async function createNested(model: string, parent: AnyRow, data: AnyRow): Promise<void> {
  if (model === "bucketConfigVersion" && data.entries?.create) {
    await prisma.bucketConfigEntry.createMany({
      data: data.entries.create.map((entry: AnyRow) => ({ ...entry, versionId: parent.id })),
    });
  }
  if (model === "quotationPackage" && data.items?.create) {
    await prisma.quotationPackageItem.createMany({
      data: data.items.create.map((item: AnyRow) => ({ ...item, packageId: parent.id })),
    });
  }
  if (model === "quotation" && data.lineItems?.create) {
    await prisma.quotationLineItem.createMany({
      data: data.lineItems.create.map((item: AnyRow) => ({ ...item, quotationId: parent.id })),
    });
  }
  if (model === "quotation" && data.deliverables?.create) {
    await prisma.quotationDeliverable.createMany({
      data: data.deliverables.create.map((item: AnyRow) => ({ ...item, quotationId: parent.id })),
    });
  }
}

function stripNested(data: AnyRow): AnyRow {
  const copy = { ...data };
  delete copy.entries;
  delete copy.items;
  delete copy.lineItems;
  delete copy.deliverables;
  return copy;
}

function delegate(model: string) {
  const table = tableByModel[model];
  if (!table) throw new Error(`Unknown model ${model}`);

  return {
    async findMany(args: any = {}) {
      let query = supabase.from(table).select("*");
      query = applyWhere(query, args.where);
      if (args.orderBy) {
        const [field, direction] = Object.entries(args.orderBy)[0] as [string, string];
        query = query.order(field, { ascending: direction !== "desc" });
      }
      if (args.take) query = query.limit(args.take);
      const { data, error } = await query;
      throwIfError(error);
      const rows = (data ?? []).map((row) => fromDbRow(table, row));
      return Promise.all(rows.map((row) => includeRelations(model, row, args.include)));
    },

    async findFirst(args: any = {}) {
      const rows = await this.findMany({ ...args, take: 1 });
      return rows[0] ?? null;
    },

    async findUnique(args: any) {
      const where = compoundWhere(args.where);
      let query = supabase.from(table).select("*");
      query = applyWhere(query, where);
      const { data, error } = await query.maybeSingle();
      throwIfError(error);
      return includeRelations(model, fromDbRow(table, data), args.include);
    },

    async count(args: any = {}) {
      let query = supabase.from(table).select("*", { count: "exact", head: true });
      query = applyWhere(query, args.where);
      const { count, error } = await query;
      throwIfError(error);
      return count ?? 0;
    },

    async create(args: any) {
      const data: AnyRow = { id: randomUUID(), ...stripNested(args.data) };
      if (model === "quotation" && !data.updatedAt) data.updatedAt = new Date();
      const { data: row, error } = await supabase.from(table).insert(toDbRow(data)).select("*").single();
      throwIfError(error);
      const parsed = fromDbRow(table, row);
      await createNested(model, parsed, args.data);
      return includeRelations(model, parsed, args.include);
    },

    async createMany(args: any) {
      const rows = (args.data ?? []).map((row: AnyRow) => toDbRow({ id: randomUUID(), ...row }));
      if (rows.length === 0) return { count: 0 };
      const { error } = await supabase.from(table).insert(rows);
      throwIfError(error);
      return { count: rows.length };
    },

    async update(args: any) {
      const where = compoundWhere(args.where);
      const updateData = stripNested(args.data);
      if (model === "quotation" && !("updatedAt" in updateData)) updateData.updatedAt = new Date();
      let query = supabase.from(table).update(toDbRow(updateData)).select("*");
      query = applyWhere(query, where);
      const { data, error } = await query.single();
      throwIfError(error);
      const parsed = fromDbRow(table, data);
      await createNested(model, parsed, args.data);
      return includeRelations(model, parsed, args.include);
    },

    async delete(args: any) {
      const existing = await this.findUnique(args);
      let query = supabase.from(table).delete();
      query = applyWhere(query, compoundWhere(args.where));
      const { error } = await query;
      throwIfError(error);
      return existing;
    },

    async deleteMany(args: any = {}) {
      let query = supabase.from(table).delete();
      query = applyWhere(query, args.where);
      const { error } = await query;
      throwIfError(error);
      return { count: 0 };
    },

    async upsert(args: any) {
      const existing = await this.findUnique({ where: args.where });
      if (existing) return this.update({ where: args.where, data: args.update });
      return this.create({ data: args.create });
    },
  };
}

const supabasePrisma = {
  user: delegate("user"),
  loginLog: delegate("loginLog"),
  activityLog: delegate("activityLog"),
  bucketConfigVersion: delegate("bucketConfigVersion"),
  bucketConfigEntry: delegate("bucketConfigEntry"),
  payment: delegate("payment"),
  bucketTransfer: delegate("bucketTransfer"),
  employee: delegate("employee"),
  salaryDisbursement: delegate("salaryDisbursement"),
  salaryPaymentLog: delegate("salaryPaymentLog"),
  subscriptionMisc: delegate("subscriptionMisc"),
  receivable: delegate("receivable"),
  followUp: delegate("followUp"),
  quotation: delegate("quotation"),
  quotationLineItem: delegate("quotationLineItem"),
  deliverableType: delegate("deliverableType"),
  quotationPackage: delegate("quotationPackage"),
  quotationPackageItem: delegate("quotationPackageItem"),
  quotationDeliverable: delegate("quotationDeliverable"),
  $transaction: async (callback: any) => callback(prisma),
};

export const prisma = supabasePrisma as unknown as PrismaClient;
