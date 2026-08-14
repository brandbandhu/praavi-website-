import Decimal from "decimal.js";
import { prisma } from "./db.js";
import { assertAllBucketsPresent, validatePercentagesSumTo100 } from "./bucketCalc.js";
import { BUCKET_NAMES, type BucketName } from "./types.js";

export interface ResolvedBucketConfig {
  versionId: string;
  effectiveFrom: Date;
  entries: {
    bucketName: BucketName;
    percentageBps: number;
    fixedMonthlyTargetPaise: number | null;
    fixedMonthlyTargetMinPaise: number | null;
    fixedMonthlyTargetMaxPaise: number | null;
    dueDay: number | null;
  }[];
}

const DEFAULT_BUCKET_CONFIG: ResolvedBucketConfig = {
  versionId: "default-bucket-config-2020",
  effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
  entries: [
    { bucketName: "salary_pool", percentageBps: 5600, fixedMonthlyTargetPaise: null, fixedMonthlyTargetMinPaise: null, fixedMonthlyTargetMaxPaise: null, dueDay: 1 },
    { bucketName: "kotak", percentageBps: 1900, fixedMonthlyTargetPaise: 8000000, fixedMonthlyTargetMinPaise: null, fixedMonthlyTargetMaxPaise: null, dueDay: 10 },
    { bucketName: "fuel", percentageBps: 200, fixedMonthlyTargetPaise: null, fixedMonthlyTargetMinPaise: 600000, fixedMonthlyTargetMaxPaise: 800000, dueDay: null },
    { bucketName: "axis", percentageBps: 800, fixedMonthlyTargetPaise: null, fixedMonthlyTargetMinPaise: null, fixedMonthlyTargetMaxPaise: null, dueDay: null },
    { bucketName: "marketing", percentageBps: 700, fixedMonthlyTargetPaise: null, fixedMonthlyTargetMinPaise: null, fixedMonthlyTargetMaxPaise: null, dueDay: null },
    { bucketName: "profit", percentageBps: 800, fixedMonthlyTargetPaise: null, fixedMonthlyTargetMinPaise: null, fixedMonthlyTargetMaxPaise: null, dueDay: null },
  ],
};

// Returns whichever bucket_config version was effective on `asOf` (defaults to now),
// i.e. the latest version with effectiveFrom <= asOf. This is what makes historical
// payments immune to later percentage edits.
export async function getBucketConfigAsOf(asOf: Date = new Date()): Promise<ResolvedBucketConfig> {
  const version = await prisma.bucketConfigVersion.findFirst({
    where: { effectiveFrom: { lte: asOf } },
    orderBy: { effectiveFrom: "desc" },
    include: { entries: true },
  });

  if (!version) {
    // Fall back to the earliest version ever created (covers dates before
    // the very first configured version, e.g. bad clock skew on seed data).
    const earliest = await prisma.bucketConfigVersion.findFirst({
      orderBy: { effectiveFrom: "asc" },
      include: { entries: true },
    });
    if (!earliest) return DEFAULT_BUCKET_CONFIG;
    return toResolved(earliest);
  }

  return toResolved(version);
}

export async function getCurrentBucketConfig(): Promise<ResolvedBucketConfig> {
  return getBucketConfigAsOf(new Date());
}

function toResolved(version: {
  id: string;
  effectiveFrom: Date;
  entries: {
    bucketName: string;
    percentageBps: number;
    fixedMonthlyTargetPaise: number | null;
    fixedMonthlyTargetMinPaise: number | null;
    fixedMonthlyTargetMaxPaise: number | null;
    dueDay: number | null;
  }[];
}): ResolvedBucketConfig {
  return {
    versionId: version.id,
    effectiveFrom: version.effectiveFrom,
    entries: version.entries.map((e) => ({
      bucketName: e.bucketName as BucketName,
      percentageBps: e.percentageBps,
      fixedMonthlyTargetPaise: e.fixedMonthlyTargetPaise,
      fixedMonthlyTargetMinPaise: e.fixedMonthlyTargetMinPaise,
      fixedMonthlyTargetMaxPaise: e.fixedMonthlyTargetMaxPaise,
      dueDay: e.dueDay,
    })),
  };
}

export interface NewBucketConfigEntryInput {
  bucketName: BucketName;
  percentageBps: number;
  fixedMonthlyTargetPaise?: number | null;
  fixedMonthlyTargetMinPaise?: number | null;
  fixedMonthlyTargetMaxPaise?: number | null;
  dueDay?: number | null;
}

// Creates a brand new effective-dated version. Percentages must sum to
// exactly 100% (10000 bps) — enforced here so no partially-valid config can
// ever be persisted.
export async function createBucketConfigVersion(
  entries: NewBucketConfigEntryInput[],
  effectiveFrom: Date,
  createdById?: string
): Promise<ResolvedBucketConfig> {
  assertAllBucketsPresent(entries);
  const { valid, totalBps } = validatePercentagesSumTo100(entries);
  if (!valid) {
    throw new Error(
      `Bucket percentages must sum to exactly 100%. Currently ${(totalBps / 100).toFixed(2)}% (${
        totalBps > 10000 ? "over" : "under"
      } by ${(Math.abs(10000 - totalBps) / 100).toFixed(2)}%).`
    );
  }
  if (BUCKET_NAMES.length !== entries.length) {
    throw new Error(`Expected exactly ${BUCKET_NAMES.length} bucket entries, got ${entries.length}`);
  }

  const version = await prisma.bucketConfigVersion.create({
    data: {
      effectiveFrom,
      createdById,
      entries: {
        create: entries.map((e) => ({
          bucketName: e.bucketName,
          percentageBps: e.percentageBps,
          fixedMonthlyTargetPaise: e.fixedMonthlyTargetPaise ?? null,
          fixedMonthlyTargetMinPaise: e.fixedMonthlyTargetMinPaise ?? null,
          fixedMonthlyTargetMaxPaise: e.fixedMonthlyTargetMaxPaise ?? null,
          dueDay: e.dueDay ?? null,
        })),
      },
    },
    include: { entries: true },
  });

  return toResolved(version);
}

// dueDay is informational metadata (not a money-routing rule), so it's safe
// to update in place on the current version rather than requiring a whole
// new effective-dated version like percentage changes do.
export async function setBucketDueDay(bucketName: BucketName, dueDay: number | null): Promise<void> {
  const current = await getCurrentBucketConfig();
  await prisma.bucketConfigEntry.update({
    where: { versionId_bucketName: { versionId: current.versionId, bucketName } },
    data: { dueDay },
  });
}

// Dynamic targets that are NOT stored on bucket_config because they must
// always reflect the live employee / subscription lists.
export async function getSalaryPoolRequiredPaise(): Promise<number> {
  const active = await prisma.employee.findMany({ where: { active: true } });
  return active.reduce((sum, e) => sum + e.monthlySalaryPaise, 0);
}

export async function getAxisTargetPaise(): Promise<number> {
  const active = await prisma.subscriptionMisc.findMany({ where: { active: true } });
  const total = active.reduce((sum, s) => {
    const monthly =
      s.frequency === "Yearly" ? new Decimal(s.amountPaise).div(12) : new Decimal(s.amountPaise);
    return sum.plus(monthly);
  }, new Decimal(0));
  return total.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}
