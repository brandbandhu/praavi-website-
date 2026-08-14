import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// One-time cleanup: removes all sample/dummy business data so the app
// starts from a clean slate. Leaves user accounts and bucket_config
// (the split percentages) untouched.
async function main() {
  const counts = await prisma.$transaction(async (tx) => {
    const salaryPaymentLogs = await tx.salaryPaymentLog.deleteMany({});
    const salaryDisbursements = await tx.salaryDisbursement.deleteMany({});
    const employees = await tx.employee.deleteMany({});
    const bucketTransfers = await tx.bucketTransfer.deleteMany({});
    const payments = await tx.payment.deleteMany({});
    const receivables = await tx.receivable.deleteMany({});
    const subscriptions = await tx.subscriptionMisc.deleteMany({});
    return { salaryPaymentLogs, salaryDisbursements, employees, bucketTransfers, payments, receivables, subscriptions };
  });

  console.log("Wiped:", JSON.stringify(Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, v.count])), null, 2));
  console.log("Kept: users, bucket_config (percentages + due days).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
