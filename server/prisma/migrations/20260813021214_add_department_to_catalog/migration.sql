-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DeliverableType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'Digital Marketing',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_DeliverableType" ("active", "id", "name", "sortOrder", "unit") SELECT "active", "id", "name", "sortOrder", "unit" FROM "DeliverableType";
DROP TABLE "DeliverableType";
ALTER TABLE "new_DeliverableType" RENAME TO "DeliverableType";
CREATE TABLE "new_QuotationPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "department" TEXT NOT NULL DEFAULT 'Digital Marketing',
    "defaultPricePaise" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_QuotationPackage" ("active", "defaultPricePaise", "description", "id", "name", "sortOrder") SELECT "active", "defaultPricePaise", "description", "id", "name", "sortOrder" FROM "QuotationPackage";
DROP TABLE "QuotationPackage";
ALTER TABLE "new_QuotationPackage" RENAME TO "QuotationPackage";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
