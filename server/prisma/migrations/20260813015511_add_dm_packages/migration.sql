-- CreateTable
CREATE TABLE "DeliverableType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "QuotationPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultPricePaise" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "QuotationPackageItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageId" TEXT NOT NULL,
    "deliverableTypeId" TEXT NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "QuotationPackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "QuotationPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuotationPackageItem_deliverableTypeId_fkey" FOREIGN KEY ("deliverableTypeId") REFERENCES "DeliverableType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuotationDeliverable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quotationId" TEXT NOT NULL,
    "deliverableTypeId" TEXT,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT false,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "QuotationDeliverable_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuotationDeliverable_deliverableTypeId_fkey" FOREIGN KEY ("deliverableTypeId") REFERENCES "DeliverableType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quotation" (
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
    "packageId" TEXT,
    CONSTRAINT "Quotation_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Quotation_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "QuotationPackage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Quotation" ("clientName", "createdAt", "createdById", "department", "gstPercentBps", "gstType", "id", "notes", "quotationNumber", "receivableId", "status", "totalAmountPaise", "updatedAt", "validUntil") SELECT "clientName", "createdAt", "createdById", "department", "gstPercentBps", "gstType", "id", "notes", "quotationNumber", "receivableId", "status", "totalAmountPaise", "updatedAt", "validUntil" FROM "Quotation";
DROP TABLE "Quotation";
ALTER TABLE "new_Quotation" RENAME TO "Quotation";
CREATE UNIQUE INDEX "Quotation_quotationNumber_key" ON "Quotation"("quotationNumber");
CREATE UNIQUE INDEX "Quotation_receivableId_key" ON "Quotation"("receivableId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "QuotationPackageItem_packageId_deliverableTypeId_key" ON "QuotationPackageItem"("packageId", "deliverableTypeId");
