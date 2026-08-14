-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "receiptGeneratedAt" DATETIME;
ALTER TABLE "Payment" ADD COLUMN "receiptNumber" TEXT;

-- CreateTable
CREATE TABLE "LoginLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "loginAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quotationNumber" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "validUntil" DATETIME,
    "notes" TEXT,
    "gstType" TEXT NOT NULL DEFAULT 'Exclusive',
    "gstPercentBps" INTEGER NOT NULL DEFAULT 1800,
    "totalAmountPaise" INTEGER NOT NULL,
    "receivableId" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quotation_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuotationLineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quotationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "QuotationLineItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Receivable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientName" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "invoiceDate" DATETIME NOT NULL,
    "amountPendingPaise" INTEGER NOT NULL,
    "department" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "collectedDate" DATETIME,
    "collectedAmountPaise" INTEGER,
    "collectedById" TEXT
);
INSERT INTO "new_Receivable" ("amountPendingPaise", "clientName", "createdAt", "department", "id", "invoiceDate", "invoiceNumber") SELECT "amountPendingPaise", "clientName", "createdAt", "department", "id", "invoiceDate", "invoiceNumber" FROM "Receivable";
DROP TABLE "Receivable";
ALTER TABLE "new_Receivable" RENAME TO "Receivable";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quotationNumber_key" ON "Quotation"("quotationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_receivableId_key" ON "Quotation"("receivableId");
