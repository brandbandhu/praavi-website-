import { computeBaseAmountPaise, splitIntoBuckets } from "./bucketCalc.js";
import { getBucketConfigAsOf } from "./bucketConfigService.js";
import type { BucketName, GstType } from "./types.js";

export interface PaymentLike {
  id: string;
  dateReceived: Date;
  paymentAmountPaise: number;
  gstType: string;
  gstPercentBps: number;
}

export interface ComputedPaymentAmounts {
  baseAmountPaise: number;
  bucketAmountsPaise: Record<BucketName, number>;
  bucketConfigVersionId: string;
}

// Computes base_amount + all six bucket amounts for a payment, always using
// whichever bucket_config version was effective on the payment's date_received
// — never the current one — so historical splits never silently change when
// the founder edits percentages later.
export async function computePaymentAmounts(payment: PaymentLike): Promise<ComputedPaymentAmounts> {
  const config = await getBucketConfigAsOf(payment.dateReceived);
  const baseAmountPaise = computeBaseAmountPaise(
    payment.paymentAmountPaise,
    payment.gstType as GstType,
    payment.gstPercentBps
  );
  const bucketAmountsPaise = splitIntoBuckets(
    baseAmountPaise,
    config.entries.map((e) => ({ bucketName: e.bucketName, percentageBps: e.percentageBps }))
  );
  return { baseAmountPaise, bucketAmountsPaise, bucketConfigVersionId: config.versionId };
}
