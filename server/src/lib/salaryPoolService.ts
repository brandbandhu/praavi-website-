import { prisma } from "./db.js";
import { computePaymentAmounts } from "./paymentCalc.js";

// The Salary Pool is a real account: money flows in (its share of every
// payment, once actually transferred) and flows out (employee disbursements).
// "Available balance" is what's sitting in that account right now —
// everything ever moved in, minus everything ever paid out — not just this
// month's figures, since the account carries a balance across months.
export async function getSalaryPoolBalancePaise(): Promise<{
  fundedInPaise: number;
  paidOutPaise: number;
  balancePaise: number;
}> {
  const transferredIn = await prisma.bucketTransfer.findMany({
    where: { bucketName: "salary_pool", status: "Transferred" },
    include: { payment: true },
  });

  let fundedInPaise = 0;
  for (const t of transferredIn) {
    const computed = await computePaymentAmounts(t.payment);
    fundedInPaise += computed.bucketAmountsPaise.salary_pool;
  }

  const disbursements = await prisma.salaryDisbursement.findMany();
  const paidOutPaise = disbursements.reduce((s, d) => s + d.amountPaidPaise, 0);

  return { fundedInPaise, paidOutPaise, balancePaise: fundedInPaise - paidOutPaise };
}
