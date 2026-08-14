-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receivableId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "method" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FollowUp_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FollowUp_receivableId_sequenceNumber_key" ON "FollowUp"("receivableId", "sequenceNumber");
