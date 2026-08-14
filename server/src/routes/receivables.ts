import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { logActivity } from "../lib/activityLog.js";
import { DEPARTMENTS, FOLLOW_UP_METHODS, RECEIVABLE_STATUSES } from "../lib/types.js";

export const receivablesRouter = Router();
receivablesRouter.use(requireAuth);

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function withAging<T extends { invoiceDate: Date; amountPendingPaise: number }>(r: T) {
  const daysOverdue = Math.max(0, Math.floor((Date.now() - r.invoiceDate.getTime()) / MS_PER_DAY));
  return { ...r, daysOverdue, isOverdue60: daysOverdue > 60 };
}

const listQuerySchema = z.object({
  status: z.enum(RECEIVABLE_STATUSES).optional(),
});

// Defaults to Pending — that's "Receivables Aging". Pass ?status=Collected
// to pull collection history (used by the report card).
receivablesRouter.get("/", async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const receivables = await prisma.receivable.findMany({
    where: { status: parsed.data.status ?? "Pending" },
    include: {
      _count: { select: { followUps: true } },
      followUps: { orderBy: { sequenceNumber: "desc" }, take: 1 },
    },
  });
  const withAgingData = receivables
    .map(({ _count, followUps, ...r }) => ({
      ...withAging(r),
      followUpCount: _count.followUps,
      lastFollowUp: followUps[0] ?? null,
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
  res.json(withAgingData);
});

receivablesRouter.get("/summary", async (_req, res) => {
  const receivables = await prisma.receivable.findMany({ where: { status: "Pending" } });
  const totalPendingPaise = receivables.reduce((s, r) => s + r.amountPendingPaise, 0);
  const overdue60Count = receivables.filter((r) => withAging(r).isOverdue60).length;
  res.json({ totalPendingPaise, overdue60Count, count: receivables.length });
});

const createSchema = z.object({
  clientName: z.string().min(1),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string(),
  amountPendingPaise: z.number().int().positive(),
  department: z.enum(DEPARTMENTS),
});

receivablesRouter.post("/", requireRole("accountant"), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const receivable = await prisma.receivable.create({
    data: { ...parsed.data, invoiceDate: new Date(parsed.data.invoiceDate) },
  });

  await logActivity(
    req.user!.userId,
    "receivable.created",
    `Added receivable for ${receivable.clientName} (${rupees(receivable.amountPendingPaise)})`,
    "Receivable",
    receivable.id
  );

  res.status(201).json({ ...withAging(receivable), followUpCount: 0, lastFollowUp: null });
});

const updateSchema = z.object({
  clientName: z.string().min(1).optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  amountPendingPaise: z.number().int().min(0).optional(),
  department: z.enum(DEPARTMENTS).optional(),
});

receivablesRouter.put("/:id", requireRole("accountant"), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const existing = await prisma.receivable.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Receivable not found" });
  const receivable = await prisma.receivable.update({
    where: { id: req.params.id },
    data: { ...parsed.data, invoiceDate: parsed.data.invoiceDate ? new Date(parsed.data.invoiceDate) : undefined },
  });

  await logActivity(
    req.user!.userId,
    "receivable.edited",
    `Edited receivable for ${receivable.clientName}`,
    "Receivable",
    receivable.id
  );

  res.json(withAging(receivable));
});

const collectSchema = z.object({
  collectedDate: z.string(),
  collectedAmountPaise: z.number().int().positive().optional(),
});

// The real "money came in" action — keeps the record (with who/when/how much)
// instead of deleting it, so it can be totalled up on the report card.
receivablesRouter.post("/:id/collect", requireRole("accountant"), async (req, res) => {
  const parsed = collectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const existing = await prisma.receivable.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Receivable not found" });
  if (existing.status === "Collected") return res.status(400).json({ error: "Already marked collected" });

  const collectedAmountPaise = parsed.data.collectedAmountPaise ?? existing.amountPendingPaise;
  const receivable = await prisma.receivable.update({
    where: { id: req.params.id },
    data: {
      status: "Collected",
      collectedDate: new Date(parsed.data.collectedDate),
      collectedAmountPaise,
      collectedById: req.user!.userId,
    },
  });

  await logActivity(
    req.user!.userId,
    "receivable.collected",
    `Collected ${rupees(collectedAmountPaise)} from ${receivable.clientName}`,
    "Receivable",
    receivable.id
  );

  res.json(withAging(receivable));
});

// True deletes — for mistakes, not for "the client paid" (use /collect for that).
receivablesRouter.delete("/:id", requireRole("accountant"), async (req, res) => {
  const existing = await prisma.receivable.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Receivable not found" });
  await prisma.receivable.delete({ where: { id: req.params.id } });

  await logActivity(
    req.user!.userId,
    "receivable.deleted",
    `Deleted receivable for ${existing.clientName} (${rupees(existing.amountPendingPaise)})`,
    "Receivable",
    existing.id
  );

  res.status(204).end();
});

receivablesRouter.get("/:id/followups", async (req, res) => {
  const existing = await prisma.receivable.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Receivable not found" });
  const followUps = await prisma.followUp.findMany({
    where: { receivableId: req.params.id },
    orderBy: { sequenceNumber: "asc" },
  });
  res.json(followUps);
});

const followUpSchema = z.object({
  date: z.string(),
  method: z.enum(FOLLOW_UP_METHODS).optional(),
  notes: z.string().optional(),
});

// Auto-numbers each follow-up (Follow-up 1, 2, 3...) per receivable —
// the accountant just logs what happened, the count takes care of itself.
receivablesRouter.post("/:id/followups", requireRole("accountant"), async (req, res) => {
  const parsed = followUpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const existing = await prisma.receivable.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Receivable not found" });

  const followUp = await prisma.$transaction(async (tx) => {
    const last = await tx.followUp.findFirst({
      where: { receivableId: req.params.id },
      orderBy: { sequenceNumber: "desc" },
    });
    return tx.followUp.create({
      data: {
        receivableId: req.params.id,
        sequenceNumber: (last?.sequenceNumber ?? 0) + 1,
        date: new Date(parsed.data.date),
        method: parsed.data.method,
        notes: parsed.data.notes,
        createdById: req.user!.userId,
      },
    });
  });

  await logActivity(
    req.user!.userId,
    "receivable.followup_logged",
    `Logged follow-up ${followUp.sequenceNumber} for ${existing.clientName}${parsed.data.method ? ` (${parsed.data.method})` : ""}`,
    "Receivable",
    existing.id
  );

  res.status(201).json(followUp);
});
