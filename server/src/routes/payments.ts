import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { computePaymentAmounts, type PaymentLike } from "../lib/paymentCalc.js";
import { logActivity } from "../lib/activityLog.js";
import { drawFacts, drawFooterNote, drawHeader, drawLineItems, startPdfResponse } from "../lib/pdf.js";
import { BUCKET_LABELS, BUCKET_NAMES, DEPARTMENTS, GST_TYPES, type BucketName } from "../lib/types.js";

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth);

function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

async function serializePayment(payment: PaymentLike & { [k: string]: any }, preloadedTransfers?: any[]) {
  const computed = await computePaymentAmounts(payment);
  const transfers = preloadedTransfers ?? (await prisma.bucketTransfer.findMany({ where: { paymentId: payment.id } }));
  const transferByBucket = Object.fromEntries(transfers.map((t) => [t.bucketName, t]));

  return {
    ...payment,
    baseAmountPaise: computed.baseAmountPaise,
    buckets: BUCKET_NAMES.map((bucketName) => ({
      bucketName,
      amountPaise: computed.bucketAmountsPaise[bucketName],
      status: transferByBucket[bucketName]?.status ?? "Pending",
      transferredDate: transferByBucket[bucketName]?.transferredDate ?? null,
    })),
  };
}

const querySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  department: z.enum(DEPARTMENTS).optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
});

paymentsRouter.get("/", async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const where: any = {};
  if (parsed.data.department) where.department = parsed.data.department;
  if (parsed.data.month) {
    const [y, m] = parsed.data.month.split("-").map(Number);
    where.dateReceived = { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) };
  }

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { dateReceived: "desc" },
    take: parsed.data.limit ?? 500,
  });
  const transfers = await prisma.bucketTransfer.findMany({ where: { paymentId: { in: payments.map((payment) => payment.id) } } });
  const transfersByPaymentId = new Map<string, any[]>();
  for (const transfer of transfers) {
    const list = transfersByPaymentId.get(transfer.paymentId) ?? [];
    list.push(transfer);
    transfersByPaymentId.set(transfer.paymentId, list);
  }
  res.json(await Promise.all(payments.map((payment) => serializePayment(payment, transfersByPaymentId.get(payment.id) ?? []))));
});

paymentsRouter.get("/:id", async (req, res) => {
  const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
  if (!payment) return res.status(404).json({ error: "Payment not found" });
  res.json(await serializePayment(payment));
});

const paymentInputSchema = z.object({
  dateReceived: z.string(),
  clientName: z.string().min(1),
  department: z.enum(DEPARTMENTS),
  invoiceNumber: z.string().optional(),
  paymentAmountPaise: z.number().int().positive(),
  gstType: z.enum(GST_TYPES),
  gstPercentBps: z.number().int().min(0).max(10000).default(1800),
  landedInAccount: z.string().min(1).optional(),
  notes: z.string().optional(),
});

// Preview the six-bucket split before saving, so the accountant can visually
// confirm the numbers on the form (requirement 4.4).
paymentsRouter.post("/preview", async (req, res) => {
  const parsed = paymentInputSchema.omit({ landedInAccount: true }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const computed = await computePaymentAmounts({
    id: "preview",
    dateReceived: new Date(parsed.data.dateReceived),
    paymentAmountPaise: parsed.data.paymentAmountPaise,
    gstType: parsed.data.gstType,
    gstPercentBps: parsed.data.gstPercentBps,
  });
  res.json({
    baseAmountPaise: computed.baseAmountPaise,
    buckets: BUCKET_NAMES.map((bucketName) => ({
      bucketName,
      amountPaise: computed.bucketAmountsPaise[bucketName],
    })),
  });
});

paymentsRouter.post("/", requireRole("accountant"), async (req, res) => {
  const parsed = paymentInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        dateReceived: new Date(parsed.data.dateReceived),
        clientName: parsed.data.clientName,
        department: parsed.data.department,
        invoiceNumber: parsed.data.invoiceNumber,
        paymentAmountPaise: parsed.data.paymentAmountPaise,
        gstType: parsed.data.gstType,
        gstPercentBps: parsed.data.gstPercentBps,
        landedInAccount: parsed.data.landedInAccount ?? "",
        notes: parsed.data.notes,
        createdById: req.user!.userId,
      },
    });
    await tx.bucketTransfer.createMany({
      data: BUCKET_NAMES.map((bucketName) => ({ paymentId: created.id, bucketName })),
    });
    return created;
  });

  await logActivity(
    req.user!.userId,
    "payment.created",
    `Logged payment from ${payment.clientName} (${rupees(payment.paymentAmountPaise)})`,
    "Payment",
    payment.id
  );

  res.status(201).json(await serializePayment(payment));
});

paymentsRouter.delete("/:id", requireRole("founder"), async (req, res) => {
  const existing = await prisma.payment.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Payment not found" });
  await prisma.payment.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

const transferUpdateSchema = z.object({
  status: z.enum(["Pending", "Transferred"]),
});

// One-click "Mark Transferred" toggle for a single bucket on a payment,
// timestamped automatically (requirement 4.5).
paymentsRouter.patch("/:id/transfers/:bucketName", requireRole("accountant"), async (req, res) => {
  const parsed = transferUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  if (!BUCKET_NAMES.includes(req.params.bucketName as any)) {
    return res.status(400).json({ error: "Invalid bucket name" });
  }

  const transfer = await prisma.bucketTransfer.findUnique({
    where: { paymentId_bucketName: { paymentId: req.params.id, bucketName: req.params.bucketName } },
  });
  if (!transfer) return res.status(404).json({ error: "Transfer record not found" });

  const updated = await prisma.bucketTransfer.update({
    where: { id: transfer.id },
    data: {
      status: parsed.data.status,
      transferredDate: parsed.data.status === "Transferred" ? new Date() : null,
      transferredById: parsed.data.status === "Transferred" ? req.user!.userId : null,
    },
  });

  const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
  const computed = payment ? await computePaymentAmounts(payment) : null;
  const bucketName = req.params.bucketName as BucketName;
  await logActivity(
    req.user!.userId,
    parsed.data.status === "Transferred" ? "transfer.marked_paid" : "transfer.marked_pending",
    `Marked ${BUCKET_LABELS[bucketName]} ${parsed.data.status === "Transferred" ? "paid" : "not paid"} for ${payment?.clientName ?? "a payment"}${computed ? ` (${rupees(computed.bucketAmountsPaise[bucketName])})` : ""}`,
    "BucketTransfer",
    updated.id
  );

  res.json(updated);
});

async function nextReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.payment.count({ where: { receiptNumber: { startsWith: `RCT-${year}-` } } });
  return `RCT-${year}-${String(count + 1).padStart(3, "0")}`;
}

// Generates (and remembers) a receipt number the first time it's requested,
// so re-downloading the same receipt later always shows the same number.
paymentsRouter.get("/:id/receipt", async (req, res) => {
  let payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
  if (!payment) return res.status(404).json({ error: "Payment not found" });

  if (!payment.receiptNumber) {
    payment = await prisma.payment.update({
      where: { id: payment.id },
      data: { receiptNumber: await nextReceiptNumber(), receiptGeneratedAt: new Date() },
    });
  }

  const computed = await computePaymentAmounts(payment);
  const doc = startPdfResponse(res, `${payment.receiptNumber}.pdf`);
  const dateLabel = payment.dateReceived.toLocaleDateString("en-IN", { timeZone: "UTC" });
  let y = drawHeader(doc, { docType: "Payment Receipt", docNumber: payment.receiptNumber!, date: dateLabel });

  const facts: [string, string][] = [
    ["Received from", payment.clientName],
    ["Department", payment.department],
    ["Landed in", payment.landedInAccount || "—"],
  ];
  if (payment.invoiceNumber) facts.push(["Against invoice", payment.invoiceNumber]);
  y = drawFacts(doc, y, facts);

  const gstNote =
    payment.gstType === "None"
      ? "No GST"
      : `${payment.gstType} of ${(payment.gstPercentBps / 100).toFixed(0)}% GST`;

  y = drawLineItems(
    doc,
    y,
    [{ description: `Payment received (${gstNote})`, amountPaise: payment.paymentAmountPaise }],
    "Amount Received",
    payment.paymentAmountPaise
  );

  doc.font("Helvetica").fontSize(9).fillColor("#666666").text(`Base amount (excl. GST): Rs. ${(computed.baseAmountPaise / 100).toLocaleString("en-IN")}`, 50, y);

  drawFooterNote(doc, "This is a system-generated receipt from the Praavi Consultants finance system.");
  doc.end();
});
