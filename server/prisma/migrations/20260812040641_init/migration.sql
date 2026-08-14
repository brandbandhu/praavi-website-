-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BucketConfigVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "effectiveFrom" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT
);

-- CreateTable
CREATE TABLE "BucketConfigEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "bucketName" TEXT NOT NULL,
    "percentageBps" INTEGER NOT NULL,
    "fixedMonthlyTargetPaise" INTEGER,
    "fixedMonthlyTargetMinPaise" INTEGER,
    "fixedMonthlyTargetMaxPaise" INTEGER,
    CONSTRAINT "BucketConfigEntry_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "BucketConfigVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dateReceived" DATETIME NOT NULL,
    "clientName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "paymentAmountPaise" INTEGER NOT NULL,
    "gstType" TEXT NOT NULL,
    "gstPercentBps" INTEGER NOT NULL DEFAULT 1800,
    "landedInAccount" TEXT NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BucketTransfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentId" TEXT NOT NULL,
    "bucketName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "transferredDate" DATETIME,
    "transferredById" TEXT,
    CONSTRAINT "BucketTransfer_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "monthlySalaryPaise" INTEGER NOT NULL,
    "joinDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SalaryDisbursement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "amountDuePaise" INTEGER NOT NULL,
    "amountPaidPaise" INTEGER NOT NULL DEFAULT 0,
    "datePaid" DATETIME,
    "accountUsed" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalaryDisbursement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalaryPaymentLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "disbursementId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "datePaid" DATETIME NOT NULL,
    "accountUsed" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalaryPaymentLog_disbursementId_fkey" FOREIGN KEY ("disbursementId") REFERENCES "SalaryDisbursement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubscriptionMisc" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Receivable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientName" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "invoiceDate" DATETIME NOT NULL,
    "amountPendingPaise" INTEGER NOT NULL,
    "department" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BucketConfigEntry_versionId_bucketName_key" ON "BucketConfigEntry"("versionId", "bucketName");

-- CreateIndex
CREATE UNIQUE INDEX "BucketTransfer_paymentId_bucketName_key" ON "BucketTransfer"("paymentId", "bucketName");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryDisbursement_employeeId_month_key" ON "SalaryDisbursement"("employeeId", "month");
