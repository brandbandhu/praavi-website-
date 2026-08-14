import { Router } from "express";
import { prisma } from "../lib/db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { computePaymentAmounts } from "../lib/paymentCalc.js";
import { getAxisTargetPaise, getCurrentBucketConfig, getSalaryPoolRequiredPaise } from "../lib/bucketConfigService.js";
import { BUCKET_NAMES, type BucketName } from "../lib/types.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

function monthRange(monthStr: string): { start: Date; end: Date } {
  const [y, m] = monthStr.split("-").map(Number);
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) };
}

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function coverageStatus(percent: number): "green" | "amber" | "red" {
  if (percent >= 100) return "green";
  if (percent >= 80) return "amber";
  return "red";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// How many days until the next occurrence of `dueDay` (day-of-month). 0 = due today.
function daysUntilDue(dueDay: number | null): number | null {
  if (!dueDay) return null;
  const now = new Date();
  let next = new Date(now.getFullYear(), now.getMonth(), dueDay);
  if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    next = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
  }
  return Math.round((next.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400000);
}

const ZERO_BUCKETS = (): Record<BucketName, number> =>
  Object.fromEntries(BUCKET_NAMES.map((b) => [b, 0])) as Record<BucketName, number>;

dashboardRouter.get("/summary", async (req, res) => {
  const month = (req.query.month as string) || currentMonthStr();
  const { start, end } = monthRange(month);

  const payments = await prisma.payment.findMany({
    where: { dateReceived: { gte: start, lt: end } },
    orderBy: { dateReceived: "desc" },
  });
  const transfers = await prisma.bucketTransfer.findMany({
    where: { paymentId: { in: payments.map((p) => p.id) } },
  });
  const transfersByPayment = new Map<string, typeof transfers>();
  for (const t of transfers) {
    const list = transfersByPayment.get(t.paymentId) ?? [];
    list.push(t);
    transfersByPayment.set(t.paymentId, list);
  }

  let revenuePaise = 0;
  const generated = ZERO_BUCKETS();
  const transferredIn = ZERO_BUCKETS();
  const pendingRows: {
    paymentId: string;
    clientName: string;
    dateReceived: string;
    bucketName: BucketName;
    amountPaise: number;
  }[] = [];

  for (const p of payments) {
    const computed = await computePaymentAmounts(p);
    revenuePaise += computed.baseAmountPaise;
    const tList = transfersByPayment.get(p.id) ?? [];
    for (const bucketName of BUCKET_NAMES) {
      const amountPaise = computed.bucketAmountsPaise[bucketName];
      generated[bucketName] += amountPaise;
      const t = tList.find((x) => x.bucketName === bucketName);
      if (t?.status === "Transferred") {
        transferredIn[bucketName] += amountPaise;
      } else {
        pendingRows.push({
          paymentId: p.id,
          clientName: p.clientName,
          dateReceived: p.dateReceived.toISOString(),
          bucketName,
          amountPaise,
        });
      }
    }
  }

  const config = await getCurrentBucketConfig();
  const kotakEntry = config.entries.find((e) => e.bucketName === "kotak")!;
  const fuelEntry = config.entries.find((e) => e.bucketName === "fuel")!;
  const salaryEntry = config.entries.find((e) => e.bucketName === "salary_pool")!;

  const [axisTargetPaise, salaryRequiredPaise] = await Promise.all([
    getAxisTargetPaise(),
    getSalaryPoolRequiredPaise(),
  ]);

  const disbursements = await prisma.salaryDisbursement.findMany({ where: { month } });
  const salaryPaidPaise = disbursements.reduce((s, d) => s + d.amountPaidPaise, 0);

  const kotakTargetPaise = kotakEntry.fixedMonthlyTargetPaise ?? 8000000;
  const fuelTargetMidPaise = Math.round(
    ((fuelEntry.fixedMonthlyTargetMinPaise ?? 600000) + (fuelEntry.fixedMonthlyTargetMaxPaise ?? 800000)) / 2
  );

  const receivables = await prisma.receivable.findMany();
  const totalReceivablesPendingPaise = receivables.reduce((s, r) => s + r.amountPendingPaise, 0);

  const salaryPercent = salaryRequiredPaise > 0 ? (salaryPaidPaise / salaryRequiredPaise) * 100 : 100;
  const kotakPercent = kotakTargetPaise > 0 ? (transferredIn.kotak / kotakTargetPaise) * 100 : 100;
  const fuelPercent = fuelTargetMidPaise > 0 ? (transferredIn.fuel / fuelTargetMidPaise) * 100 : 100;
  const axisPercent = axisTargetPaise > 0 ? (transferredIn.axis / axisTargetPaise) * 100 : 100;

  const totalPendingPaise = pendingRows.reduce((s, r) => s + r.amountPaise, 0);
  pendingRows.sort((a, b) => new Date(b.dateReceived).getTime() - new Date(a.dateReceived).getTime());

  res.json({
    month,
    revenuePaise,
    salaryPool: {
      fundedPaise: salaryPaidPaise,
      requiredPaise: salaryRequiredPaise,
      percent: round2(salaryPercent),
      status: coverageStatus(salaryPercent),
      dueDay: salaryEntry.dueDay,
      daysUntilDue: daysUntilDue(salaryEntry.dueDay),
    },
    kotak: {
      fundedPaise: transferredIn.kotak,
      targetPaise: kotakTargetPaise,
      percent: round2(kotakPercent),
      status: coverageStatus(kotakPercent),
      dueDay: kotakEntry.dueDay,
      daysUntilDue: daysUntilDue(kotakEntry.dueDay),
    },
    fuel: {
      fundedPaise: transferredIn.fuel,
      targetMinPaise: fuelEntry.fixedMonthlyTargetMinPaise ?? 600000,
      targetMaxPaise: fuelEntry.fixedMonthlyTargetMaxPaise ?? 800000,
      percent: round2(fuelPercent),
      status: coverageStatus(fuelPercent),
    },
    axis: {
      fundedPaise: transferredIn.axis,
      targetPaise: axisTargetPaise,
      percent: round2(axisPercent),
      status: coverageStatus(axisPercent),
    },
    marketing: { generatedPaise: generated.marketing },
    profit: { generatedPaise: generated.profit },
    totalReceivablesPendingPaise,
    pendingPayments: {
      count: pendingRows.length,
      totalPaise: totalPendingPaise,
      items: pendingRows.slice(0, 8),
    },
  });
});

// Revenue vs Salary Requirement, month over month (5.5).
dashboardRouter.get("/trend", async (req, res) => {
  const months = Math.min(Number(req.query.months) || 12, 36);
  const now = new Date();
  const series: { month: string; revenuePaise: number; salaryRequiredPaise: number }[] = [];

  const currentRequiredPaise = await getSalaryPoolRequiredPaise();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
    const monthStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const { start, end } = monthRange(monthStr);

    const payments = await prisma.payment.findMany({ where: { dateReceived: { gte: start, lt: end } } });
    let revenuePaise = 0;
    for (const p of payments) revenuePaise += (await computePaymentAmounts(p)).baseAmountPaise;

    const disbursements = await prisma.salaryDisbursement.findMany({ where: { month: monthStr } });
    const salaryRequiredPaise =
      disbursements.length > 0
        ? disbursements.reduce((s, d) => s + d.amountDuePaise, 0)
        : currentRequiredPaise;

    series.push({ month: monthStr, revenuePaise, salaryRequiredPaise });
  }

  res.json(series);
});
