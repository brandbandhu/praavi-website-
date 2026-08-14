import Decimal from "decimal.js";
import { sum } from "./money.js";
import { BUCKET_NAMES, type BucketName, type GstType } from "./types.js";

export interface BucketConfigEntryInput {
  bucketName: BucketName;
  percentageBps: number;
}

/**
 * Base Amount = Payment Amount / (1 + GST%)   [GST Inclusive]
 * Base Amount = Payment Amount                 [GST Exclusive / None]
 */
export function computeBaseAmountPaise(
  paymentAmountPaise: number,
  gstType: GstType,
  gstPercentBps: number
): number {
  if (gstType === "Inclusive") {
    const divisor = new Decimal(1).plus(new Decimal(gstPercentBps).div(10000));
    return new Decimal(paymentAmountPaise)
      .div(divisor)
      .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
      .toNumber();
  }
  return paymentAmountPaise;
}

/**
 * Splits baseAmountPaise across the six buckets using the largest-remainder
 * method, so the parts always sum EXACTLY to baseAmountPaise (no paise lost
 * or invented to floating point / rounding).
 */
export function splitIntoBuckets(
  baseAmountPaise: number,
  entries: BucketConfigEntryInput[]
): Record<BucketName, number> {
  const totalBps = sum(entries.map((e) => e.percentageBps));
  if (totalBps !== 10000) {
    throw new Error(`Bucket percentages must sum to 100% (got ${totalBps / 100}%)`);
  }

  const shares = entries.map((e) => {
    const exact = new Decimal(baseAmountPaise).mul(e.percentageBps).div(10000);
    const floor = exact.floor();
    return {
      bucketName: e.bucketName,
      floor: floor.toNumber(),
      remainder: exact.minus(floor).toNumber(),
    };
  });

  const flooredTotal = sum(shares.map((s) => s.floor));
  let leftoverPaise = baseAmountPaise - flooredTotal;

  // Distribute leftover paise (always < number of buckets) to the shares
  // with the largest fractional remainder first, for a fair, deterministic split.
  const byRemainderDesc = [...shares].sort((a, b) => b.remainder - a.remainder);
  const bonus = new Map<BucketName, number>();
  for (let i = 0; i < byRemainderDesc.length && leftoverPaise > 0; i++, leftoverPaise--) {
    bonus.set(byRemainderDesc[i].bucketName, 1);
  }

  const result = {} as Record<BucketName, number>;
  for (const s of shares) {
    result[s.bucketName] = s.floor + (bonus.get(s.bucketName) ?? 0);
  }
  return result;
}

export function validatePercentagesSumTo100(entries: { percentageBps: number }[]): {
  valid: boolean;
  totalBps: number;
} {
  const totalBps = sum(entries.map((e) => e.percentageBps));
  return { valid: totalBps === 10000, totalBps };
}

export function assertAllBucketsPresent(entries: { bucketName: string }[]): void {
  const names = new Set(entries.map((e) => e.bucketName));
  for (const b of BUCKET_NAMES) {
    if (!names.has(b)) throw new Error(`Missing bucket config entry for "${b}"`);
  }
}
