import Decimal from "decimal.js";

// All money is stored/moved as integer paise (1 INR = 100 paise) so every
// stored value is exact. Decimal.js is used only for the arithmetic that
// produces those integers (percentage splits, GST back-out) so intermediate
// steps never touch floating point.

export function rupeesToPaise(rupees: number | string): number {
  return new Decimal(rupees).mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

export function paiseToRupees(paise: number): number {
  return new Decimal(paise).div(100).toNumber();
}

export function bpsToPercent(bps: number): number {
  return new Decimal(bps).div(100).toNumber();
}

export function percentToBps(percent: number | string): number {
  return new Decimal(percent).mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

// amountPaise * bps / 10000, rounded to nearest paise (half-up).
export function applyBps(amountPaise: number, bps: number): number {
  return new Decimal(amountPaise)
    .mul(bps)
    .div(10000)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();
}

export function sum(paiseAmounts: number[]): number {
  return paiseAmounts.reduce((a, b) => a + b, 0);
}
