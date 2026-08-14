import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { logActivity } from "../lib/activityLog.js";
import {
  drawChecklist,
  drawFacts,
  drawFooterNote,
  drawHeader,
  drawLineItems,
  drawTotalOnly,
  startPdfResponse,
  rupees as pdfRupees,
} from "../lib/pdf.js";
import { DEPARTMENTS, GST_TYPES, QUOTATION_STATUSES } from "../lib/types.js";

export const quotationsRouter = Router();
quotationsRouter.use(requireAuth);

function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

async function nextQuotationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const countThisYear = await prisma.quotation.count({
    where: { quotationNumber: { startsWith: `QUO-${year}-` } },
  });
  return `QUO-${year}-${String(countThisYear + 1).padStart(3, "0")}`;
}

function serialize(q: any) {
  return {
    ...q,
    lineItems: q.lineItems?.sort((a: any, b: any) => a.sortOrder - b.sortOrder) ?? [],
    deliverables: q.deliverables?.sort((a: any, b: any) => a.sortOrder - b.sortOrder) ?? [],
  };
}

const INCLUDE = { lineItems: true, deliverables: true, package: true } as const;

quotationsRouter.get("/", async (req, res) => {
  const status = req.query.status as string | undefined;
  const quotations = await prisma.quotation.findMany({
    where: status ? { status } : undefined,
    include: INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  res.json(quotations.map(serialize));
});

quotationsRouter.get("/:id", async (req, res) => {
  const quotation = await prisma.quotation.findUnique({ where: { id: req.params.id }, include: INCLUDE });
  if (!quotation) return res.status(404).json({ error: "Quotation not found" });
  res.json(serialize(quotation));
});

const lineItemSchema = z.object({
  description: z.string().min(1),
  amountPaise: z.number().int().positive(),
});

const deliverableInputSchema = z.object({
  deliverableTypeId: z.string(),
  included: z.boolean(),
  quantity: z.number().int().min(0),
});

const createSchema = z
  .object({
    clientName: z.string().min(1),
    department: z.enum(DEPARTMENTS),
    validUntil: z.string().optional(),
    notes: z.string().optional(),
    gstType: z.enum(GST_TYPES).default("Exclusive"),
    gstPercentBps: z.number().int().min(0).max(10000).default(1800),
    lineItems: z.array(lineItemSchema).optional(),
    packageId: z.string().optional(),
    deliverables: z.array(deliverableInputSchema).optional(),
    totalAmountPaise: z.number().int().positive().optional(),
  })
  .refine(
    (d) => (d.lineItems && d.lineItems.length > 0) || (d.deliverables && d.deliverables.length > 0 && d.totalAmountPaise),
    { message: "Provide either line items, or a deliverables checklist with a final price." }
  );

async function snapshotDeliverables(deliverables: z.infer<typeof deliverableInputSchema>[]) {
  const types = await prisma.deliverableType.findMany({
    where: { id: { in: deliverables.map((d) => d.deliverableTypeId) } },
  });
  const byId = Object.fromEntries(types.map((t) => [t.id, t]));
  return deliverables.map((d, i) => ({
    deliverableTypeId: d.deliverableTypeId,
    name: byId[d.deliverableTypeId]?.name ?? "Unknown item",
    unit: byId[d.deliverableTypeId]?.unit ?? "",
    included: d.included,
    quantity: d.quantity,
    sortOrder: byId[d.deliverableTypeId]?.sortOrder ?? i,
  }));
}

quotationsRouter.post("/", requireRole("accountant"), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const usingDeliverables = !!(parsed.data.deliverables && parsed.data.deliverables.length > 0);
  const totalAmountPaise = usingDeliverables
    ? parsed.data.totalAmountPaise!
    : parsed.data.lineItems!.reduce((s, li) => s + li.amountPaise, 0);
  const quotationNumber = await nextQuotationNumber();

  const deliverableRows = usingDeliverables ? await snapshotDeliverables(parsed.data.deliverables!) : [];

  const quotation = await prisma.quotation.create({
    data: {
      quotationNumber,
      clientName: parsed.data.clientName,
      department: parsed.data.department,
      validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
      notes: parsed.data.notes,
      gstType: parsed.data.gstType,
      gstPercentBps: parsed.data.gstPercentBps,
      totalAmountPaise,
      packageId: parsed.data.packageId,
      createdById: req.user!.userId,
      lineItems: usingDeliverables
        ? undefined
        : { create: parsed.data.lineItems!.map((li, i) => ({ description: li.description, amountPaise: li.amountPaise, sortOrder: i })) },
      deliverables: usingDeliverables ? { create: deliverableRows } : undefined,
    },
    include: INCLUDE,
  });

  await logActivity(
    req.user!.userId,
    "quotation.created",
    `Created quotation ${quotation.quotationNumber} for ${quotation.clientName} (${rupees(totalAmountPaise)})`,
    "Quotation",
    quotation.id
  );

  res.status(201).json(serialize(quotation));
});

const updateSchema = z.object({
  clientName: z.string().min(1).optional(),
  department: z.enum(DEPARTMENTS).optional(),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
  gstType: z.enum(GST_TYPES).optional(),
  gstPercentBps: z.number().int().min(0).max(10000).optional(),
  lineItems: z.array(lineItemSchema).optional(),
  packageId: z.string().optional(),
  deliverables: z.array(deliverableInputSchema).optional(),
  totalAmountPaise: z.number().int().positive().optional(),
});

quotationsRouter.put("/:id", requireRole("accountant"), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const existing = await prisma.quotation.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Quotation not found" });
  if (existing.receivableId) {
    return res.status(400).json({ error: "This quotation has already been transferred to Receivables and can't be edited." });
  }

  const usingDeliverables = !!(parsed.data.deliverables && parsed.data.deliverables.length > 0);
  const totalAmountPaise = usingDeliverables
    ? parsed.data.totalAmountPaise
    : parsed.data.lineItems
      ? parsed.data.lineItems.reduce((s, li) => s + li.amountPaise, 0)
      : undefined;

  const deliverableRows = usingDeliverables ? await snapshotDeliverables(parsed.data.deliverables!) : [];

  const quotation = await prisma.$transaction(async (tx) => {
    if (parsed.data.lineItems) {
      await tx.quotationLineItem.deleteMany({ where: { quotationId: req.params.id } });
    }
    if (usingDeliverables) {
      await tx.quotationDeliverable.deleteMany({ where: { quotationId: req.params.id } });
    }
    return tx.quotation.update({
      where: { id: req.params.id },
      data: {
        clientName: parsed.data.clientName,
        department: parsed.data.department,
        validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : undefined,
        notes: parsed.data.notes,
        gstType: parsed.data.gstType,
        gstPercentBps: parsed.data.gstPercentBps,
        totalAmountPaise,
        packageId: parsed.data.packageId,
        lineItems: parsed.data.lineItems
          ? { create: parsed.data.lineItems.map((li, i) => ({ description: li.description, amountPaise: li.amountPaise, sortOrder: i })) }
          : undefined,
        deliverables: usingDeliverables ? { create: deliverableRows } : undefined,
      },
      include: INCLUDE,
    });
  });

  res.json(serialize(quotation));
});

const statusSchema = z.object({ status: z.enum(QUOTATION_STATUSES) });

quotationsRouter.patch("/:id/status", requireRole("accountant"), async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const existing = await prisma.quotation.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Quotation not found" });

  const quotation = await prisma.quotation.update({
    where: { id: req.params.id },
    data: { status: parsed.data.status },
    include: INCLUDE,
  });

  await logActivity(
    req.user!.userId,
    "quotation.status_changed",
    `Marked quotation ${quotation.quotationNumber} (${quotation.clientName}) as ${parsed.data.status}`,
    "Quotation",
    quotation.id
  );

  res.json(serialize(quotation));
});

// The deliberate, manual step: accepting a quotation does NOT auto-create a
// Receivable. The accountant clicks this once, and it's pre-filled — no
// re-typing the client/amount, but nothing happens without her clicking it.
quotationsRouter.post("/:id/transfer-to-receivable", requireRole("accountant"), async (req, res) => {
  const existing = await prisma.quotation.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Quotation not found" });
  if (existing.status !== "Accepted") {
    return res.status(400).json({ error: "Only an Accepted quotation can be transferred to Receivables." });
  }
  if (existing.receivableId) {
    return res.status(400).json({ error: "Already transferred to Receivables." });
  }

  const { quotation, receivable } = await prisma.$transaction(async (tx) => {
    const receivable = await tx.receivable.create({
      data: {
        clientName: existing.clientName,
        invoiceNumber: existing.quotationNumber,
        invoiceDate: new Date(),
        amountPendingPaise: existing.totalAmountPaise,
        department: existing.department,
      },
    });
    const quotation = await tx.quotation.update({
      where: { id: existing.id },
      data: { receivableId: receivable.id },
      include: INCLUDE,
    });
    return { quotation, receivable };
  });

  await logActivity(
    req.user!.userId,
    "quotation.transferred",
    `Transferred quotation ${quotation.quotationNumber} to Receivables (${rupees(receivable.amountPendingPaise)})`,
    "Quotation",
    quotation.id
  );

  res.json(serialize(quotation));
});

quotationsRouter.delete("/:id", requireRole("accountant"), async (req, res) => {
  const existing = await prisma.quotation.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Quotation not found" });
  await prisma.quotation.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

quotationsRouter.get("/:id/pdf", async (req, res) => {
  const quotation = await prisma.quotation.findUnique({ where: { id: req.params.id }, include: INCLUDE });
  if (!quotation) return res.status(404).json({ error: "Quotation not found" });

  const doc = startPdfResponse(res, `${quotation.quotationNumber}.pdf`);
  const dateLabel = quotation.createdAt.toLocaleDateString("en-IN", { timeZone: "UTC" });
  let y = drawHeader(doc, { docType: "Quotation", docNumber: quotation.quotationNumber, date: dateLabel });

  const facts: [string, string][] = [
    ["Client", quotation.clientName],
    ["Department", quotation.department],
  ];
  if (quotation.validUntil) facts.push(["Valid until", quotation.validUntil.toLocaleDateString("en-IN", { timeZone: "UTC" })]);
  y = drawFacts(doc, y, facts);

  if (quotation.deliverables.length > 0) {
    y = drawChecklist(
      doc,
      y,
      (quotation as any).package?.name ?? null,
      quotation.deliverables
        .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
        .map((d: any) => ({ name: d.name, unit: d.unit, included: d.included, quantity: d.quantity }))
    );
    y = drawTotalOnly(doc, y, `Total${quotation.gstType !== "None" ? ` (${quotation.gstType} of GST)` : ""}`, quotation.totalAmountPaise);
  } else {
    y = drawLineItems(
      doc,
      y,
      quotation.lineItems
        .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
        .map((li: any) => ({ description: li.description, amountPaise: li.amountPaise })),
      `Total${quotation.gstType !== "None" ? ` (${quotation.gstType} of GST)` : ""}`,
      quotation.totalAmountPaise
    );
  }

  if (quotation.notes) {
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#666666").text("Notes", 50, y);
    y += 16;
    doc.font("Helvetica").fontSize(10).fillColor("#111111").text(quotation.notes, 50, y, { width: 495 });
  }

  drawFooterNote(doc, `This quotation (${pdfRupees(quotation.totalAmountPaise)}) is valid as per the terms discussed.`);
  doc.end();
});
