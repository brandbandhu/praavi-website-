import { Router } from "express";
import { prisma } from "../lib/db.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";

export const reportCardRouter = Router();
reportCardRouter.use(requireAuth);
// Founder-only, deliberately not even cofounder — this is a performance
// review of the accountant's work, not a general dashboard.
reportCardRouter.use(requireRole());

function monthRange(monthStr: string): { start: Date; end: Date } {
  const [y, m] = monthStr.split("-").map(Number);
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) };
}

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function avgDays(diffsMs: number[]): number | null {
  if (diffsMs.length === 0) return null;
  const avgMs = diffsMs.reduce((s, d) => s + d, 0) / diffsMs.length;
  return Math.round((avgMs / 86400000) * 10) / 10;
}

reportCardRouter.get("/", async (req, res) => {
  const month = (req.query.month as string) || currentMonthStr();
  const { start, end } = monthRange(month);

  const accountants = await prisma.user.findMany({ where: { role: "accountant" } });
  const accountantIds = accountants.map((a) => a.id);

  const [pendingReceivables, collected, followUps, payments, transfers, salaryPayments, logins, activity, allUsers] =
    await Promise.all([
      prisma.receivable.findMany({ where: { status: "Pending" } }),
      prisma.receivable.findMany({
        where: { status: "Collected", collectedById: { in: accountantIds }, collectedDate: { gte: start, lt: end } },
      }),
      prisma.followUp.findMany({ where: { createdById: { in: accountantIds }, date: { gte: start, lt: end } } }),
      prisma.payment.findMany({ where: { createdById: { in: accountantIds }, createdAt: { gte: start, lt: end } } }),
      prisma.bucketTransfer.findMany({
        where: { transferredById: { in: accountantIds }, transferredDate: { gte: start, lt: end } },
      }),
      prisma.salaryPaymentLog.findMany({ where: { createdById: { in: accountantIds }, createdAt: { gte: start, lt: end } } }),
      prisma.loginLog.findMany({
        where: { userId: { in: accountantIds }, loginAt: { gte: start, lt: end } },
        orderBy: { loginAt: "asc" },
      }),
      prisma.activityLog.findMany({
        where: { userId: { in: accountantIds }, createdAt: { gte: start, lt: end } },
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.user.findMany(),
    ]);

  const userNameById = Object.fromEntries(allUsers.map((u) => [u.id, u.name]));

  const receivablesPendingPaise = pendingReceivables.reduce((s, r) => s + r.amountPendingPaise, 0);
  const collectionsTotalPaise = collected.reduce((s, r) => s + (r.collectedAmountPaise ?? 0), 0);
  const collectionDelaysMs = collected
    .filter((r) => r.collectedDate)
    .map((r) => r.collectedDate!.getTime() - r.invoiceDate.getTime());

  const loggingDelaysMs = payments.map((p) => p.createdAt.getTime() - p.dateReceived.getTime()).filter((d) => d > 0);

  const firstLoginByDate = new Map<string, Date>();
  for (const l of logins) {
    const dateKey = l.loginAt.toISOString().slice(0, 10);
    if (!firstLoginByDate.has(dateKey)) firstLoginByDate.set(dateKey, l.loginAt);
  }

  res.json({
    month,
    accountants: accountants.map((a) => ({ id: a.id, name: a.name, email: a.email })),
    receivablesPendingPaise,
    collections: {
      count: collected.length,
      totalPaise: collectionsTotalPaise,
      avgDaysToCollect: avgDays(collectionDelaysMs),
    },
    followUps: { count: followUps.length },
    payments: { count: payments.length, avgLoggingDelayDays: avgDays(loggingDelaysMs) },
    transfersMarkedPaid: { count: transfers.length },
    salaryPayments: { count: salaryPayments.length, totalPaise: salaryPayments.reduce((s, p) => s + p.amountPaise, 0) },
    logins: {
      activeDays: firstLoginByDate.size,
      totalLogins: logins.length,
      firstLoginByDate: [...firstLoginByDate.entries()]
        .map(([date, firstLoginAt]) => ({ date, firstLoginAt }))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    },
    activity: activity.map((a) => ({
      id: a.id,
      action: a.action,
      summary: a.summary,
      createdAt: a.createdAt,
      userName: userNameById[a.userId] ?? "Unknown",
    })),
  });
});
