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

  const [payments, config, axisTargetPaise, salaryRequiredPaise, disbursements, receivables] = await Promise.all([
    prisma.payment.findMany({
      where: { dateReceived: { gte: start, lt: end } },
      orderBy: { dateReceived: "desc" },
    }),
    getCurrentBucketConfig(),
    getAxisTargetPaise(),
    getSalaryPoolRequiredPaise(),
    prisma.salaryDisbursement.findMany({ where: { month } }),
    prisma.receivable.findMany(),
  ]);
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

  const computedPayments = await Promise.all(payments.map(async (payment) => ({
    payment,
    computed: await computePaymentAmounts(payment),
  })));

  for (const { payment: p, computed } of computedPayments) {
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

  const kotakEntry = config.entries.find((e) => e.bucketName === "kotak")!;
  const fuelEntry = config.entries.find((e) => e.bucketName === "fuel")!;
  const salaryEntry = config.entries.find((e) => e.bucketName === "salary_pool")!;

  const salaryPaidPaise = disbursements.reduce((s, d) => s + d.amountPaidPaise, 0);

  const kotakTargetPaise = kotakEntry.fixedMonthlyTargetPaise ?? 8000000;
  const fuelTargetMidPaise = Math.round(
    ((fuelEntry.fixedMonthlyTargetMinPaise ?? 600000) + (fuelEntry.fixedMonthlyTargetMaxPaise ?? 800000)) / 2
  );

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

  const currentRequiredPaise = await getSalaryPoolRequiredPaise();

  const series = await Promise.all(Array.from({ length: months }, async (_, index) => {
    const i = months - 1 - index;
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
    const monthStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const { start, end } = monthRange(monthStr);

    const [payments, disbursements] = await Promise.all([
      prisma.payment.findMany({ where: { dateReceived: { gte: start, lt: end } } }),
      prisma.salaryDisbursement.findMany({ where: { month: monthStr } }),
    ]);
    const computedPayments = await Promise.all(payments.map((payment) => computePaymentAmounts(payment)));
    const revenuePaise = computedPayments.reduce((sum, computed) => sum + computed.baseAmountPaise, 0);
    const salaryRequiredPaise =
      disbursements.length > 0
        ? disbursements.reduce((s, d) => s + d.amountDuePaise, 0)
        : currentRequiredPaise;

    return { month: monthStr, revenuePaise, salaryRequiredPaise };
  }));

  res.json(series);
});
