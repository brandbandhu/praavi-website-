import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { getSalaryPoolBalancePaise } from "../lib/salaryPoolService.js";
import { logActivity } from "../lib/activityLog.js";
import { drawFacts, drawFooterNote, drawHeader, drawLineItems, startPdfResponse } from "../lib/pdf.js";

function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export const employeesRouter = Router();
employeesRouter.use(requireAuth);

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function withCurrentMonthStatus(employee: {
  id: string;
  name: string;
  active: boolean;
  monthlySalaryPaise: number;
  joinDate: Date;
  createdAt: Date;
}, disb?: { amountDuePaise: number; amountPaidPaise: number } | null) {
  const month = currentMonthStr();
  const amountDuePaise = disb?.amountDuePaise ?? employee.monthlySalaryPaise;
  const amountPaidPaise = disb?.amountPaidPaise ?? 0;
  const pendingPaise = amountDuePaise - amountPaidPaise;
  const percentCovered = amountDuePaise > 0 ? Math.round((amountPaidPaise / amountDuePaise) * 10000) / 100 : 100;
  return {
    ...employee,
    currentMonth: month,
    currentMonthDuePaise: amountDuePaise,
    currentMonthPaidPaise: amountPaidPaise,
    currentMonthPendingPaise: pendingPaise,
    percentCovered,
  };
}

employeesRouter.get("/", async (req, res) => {
  const includeInactive = req.query.includeInactive === "true";
  const employees = await prisma.employee.findMany({
    where: includeInactive ? {} : { active: true },
    orderBy: { name: "asc" },
  });
  const month = currentMonthStr();
  const disbursements = await prisma.salaryDisbursement.findMany({
    where: { employeeId: { in: employees.map((employee) => employee.id) }, month },
  });
  const disbursementByEmployeeId = new Map(disbursements.map((disb) => [disb.employeeId, disb]));
  const withStatus = employees.map((employee) => withCurrentMonthStatus(employee, disbursementByEmployeeId.get(employee.id)));
  withStatus.sort((a, b) => b.currentMonthPendingPaise - a.currentMonthPendingPaise);
  res.json(withStatus);
});

employeesRouter.get("/summary", async (_req, res) => {
  const active = await prisma.employee.findMany({ where: { active: true } });
  const totalRequiredPaise = active.reduce((s, e) => s + e.monthlySalaryPaise, 0);
  const pool = await getSalaryPoolBalancePaise();
  res.json({ totalRequiredPaise, activeCount: active.length, pool });
});

employeesRouter.get("/:id", async (req, res) => {
  const employee = await prisma.employee.findUnique({ where: { id: req.params.id } });
  if (!employee) return res.status(404).json({ error: "Employee not found" });
  res.json(await withCurrentMonthStatus(employee));
});

employeesRouter.get("/:id/history", async (req, res) => {
  const employee = await prisma.employee.findUnique({ where: { id: req.params.id } });
  if (!employee) return res.status(404).json({ error: "Employee not found" });

  const disbursements = await prisma.salaryDisbursement.findMany({
    where: { employeeId: req.params.id },
    orderBy: { month: "desc" },
    include: { payments: { orderBy: { datePaid: "desc" } } },
  });
  res.json({ employee, disbursements });
});

const createSchema = z.object({
  name: z.string().min(1),
  monthlySalaryPaise: z.number().int().positive(),
  joinDate: z.string(),
});

employeesRouter.post("/", requireRole("accountant"), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const employee = await prisma.employee.create({
    data: {
      name: parsed.data.name,
      monthlySalaryPaise: parsed.data.monthlySalaryPaise,
      joinDate: new Date(parsed.data.joinDate),
    },
  });
  res.status(201).json(employee);
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  monthlySalaryPaise: z.number().int().positive().optional(),
  joinDate: z.string().optional(),
  active: z.boolean().optional(),
});

employeesRouter.put("/:id", requireRole("accountant"), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const existing = await prisma.employee.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Employee not found" });

  const employee = await prisma.employee.update({
    where: { id: req.params.id },
    data: {
      name: parsed.data.name,
      monthlySalaryPaise: parsed.data.monthlySalaryPaise,
      joinDate: parsed.data.joinDate ? new Date(parsed.data.joinDate) : undefined,
      active: parsed.data.active,
    },
  });
  res.json(employee);
});

// Deactivate (not delete) — keeps disbursement history intact for reporting.
employeesRouter.delete("/:id", requireRole("accountant"), async (req, res) => {
  const existing = await prisma.employee.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Employee not found" });
  const employee = await prisma.employee.update({ where: { id: req.params.id }, data: { active: false } });
  res.json(employee);
});

const disbursementSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  amountPaise: z.number().int().positive(),
  datePaid: z.string(),
  accountUsed: z.string().optional(),
});

// Log a salary payment for a given month. Upserts the SalaryDisbursement
// summary row (creating it with amountDue snapshotted from the employee's
// CURRENT salary the first time this month is touched) and appends an
// immutable SalaryPaymentLog entry for the full history view.
employeesRouter.post("/:id/disbursements", requireRole("accountant"), async (req, res) => {
  const parsed = disbursementSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const employee = await prisma.employee.findUnique({ where: { id: req.params.id } });
  if (!employee) return res.status(404).json({ error: "Employee not found" });

  const { month, amountPaise, datePaid, accountUsed } = parsed.data;

  const disbursement = await prisma.$transaction(async (tx) => {
    const existing = await tx.salaryDisbursement.findUnique({
      where: { employeeId_month: { employeeId: employee.id, month } },
    });
    const disb =
      existing ??
      (await tx.salaryDisbursement.create({
        data: { employeeId: employee.id, month, amountDuePaise: employee.monthlySalaryPaise },
      }));

    await tx.salaryPaymentLog.create({
      data: {
        disbursementId: disb.id,
        amountPaise,
        datePaid: new Date(datePaid),
        accountUsed,
        createdById: req.user!.userId,
      },
    });

    return tx.salaryDisbursement.update({
      where: { id: disb.id },
      data: {
        amountPaidPaise: disb.amountPaidPaise + amountPaise,
        datePaid: new Date(datePaid),
        accountUsed,
      },
    });
  });

  await logActivity(
    req.user!.userId,
    "salary.paid",
    `Paid ${employee.name} ${rupees(amountPaise)} for ${month}`,
    "SalaryDisbursement",
    disbursement.id
  );

  res.status(201).json(disbursement);
});

const monthParamSchema = z.string().regex(/^\d{4}-\d{2}$/);

// Salary slip is only available once the month is paid in full — no partial
// slips. That's a deliberate business rule, not a technical limitation.
employeesRouter.get("/:id/salary-slip/:month", async (req, res) => {
  const monthParsed = monthParamSchema.safeParse(req.params.month);
  if (!monthParsed.success) return res.status(400).json({ error: "Invalid month" });

  const employee = await prisma.employee.findUnique({ where: { id: req.params.id } });
  if (!employee) return res.status(404).json({ error: "Employee not found" });

  const disbursement = await prisma.salaryDisbursement.findUnique({
    where: { employeeId_month: { employeeId: employee.id, month: req.params.month } },
    include: { payments: { orderBy: { datePaid: "asc" } } },
  });

  if (!disbursement || disbursement.amountPaidPaise < disbursement.amountDuePaise) {
    return res.status(400).json({
      error: "Salary slip isn't available yet — it unlocks once the full salary for this month has been credited.",
    });
  }

  const doc = startPdfResponse(res, `salary-slip-${employee.name.replace(/\s+/g, "-")}-${req.params.month}.pdf`);
  const monthLabel = new Date(`${req.params.month}-01T00:00:00Z`).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  let y = drawHeader(doc, { docType: "Salary Slip", docNumber: `${employee.id.slice(0, 8).toUpperCase()}-${req.params.month}`, date: monthLabel });

  y = drawFacts(doc, y, [
    ["Employee", employee.name],
    ["Month", monthLabel],
    ["Date joined", employee.joinDate.toLocaleDateString("en-IN", { timeZone: "UTC" })],
    ["Paid on", disbursement.datePaid ? disbursement.datePaid.toLocaleDateString("en-IN", { timeZone: "UTC" }) : "—"],
    ["Account used", disbursement.accountUsed || "—"],
  ]);

  y = drawLineItems(
    doc,
    y,
    [{ description: "Monthly Salary", amountPaise: disbursement.amountDuePaise }],
    "Net Pay",
    disbursement.amountPaidPaise
  );

  if (disbursement.payments.length > 1) {
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#666666").text("Paid across multiple transfers:", 50, y);
    y += 16;
    doc.font("Helvetica").fontSize(9).fillColor("#444444");
    for (const p of disbursement.payments) {
      doc.text(
        `${p.datePaid.toLocaleDateString("en-IN", { timeZone: "UTC" })} — Rs. ${(p.amountPaise / 100).toLocaleString("en-IN")} (${p.accountUsed || "—"})`,
        60,
        y
      );
      y += 14;
    }
  }

  drawFooterNote(doc, "This is a system-generated salary slip from the Praavi Consultants finance system.");
  doc.end();
});
