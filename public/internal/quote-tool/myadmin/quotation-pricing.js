export function applyFinalQuotedPrice(lineItems, totals, quotation) {
  const value = quotation.finalQuotedPrice;
  if (value == null || value === "") return { lineItems, totals };
  const entered = Number(value);
  if (!Number.isFinite(entered) || entered < 0) return { lineItems, totals };

  const money = (amount) => Math.round(amount * 100) / 100;
  const grandTotal = money(entered);
  const taxableAmount = quotation.includeGst ? money(grandTotal / 1.18) : grandTotal;
  const gstAmount = money(grandTotal - taxableAmount);
  // Keep the existing discount and reconcile the agreed total through a line item.
  const subtotal = money(taxableAmount + totals.discountAmount);
  const adjustment = money(subtotal - totals.subtotal);
  return {
    lineItems: adjustment === 0 ? lineItems : [...lineItems, {
      id: "final-quote-adjustment",
      label: "Final quoted price adjustment",
      description: "Final quoted price adjustment",
      note: null,
      amount: adjustment
    }],
    totals: { ...totals, subtotal, taxableAmount, gstAmount, grandTotal }
  };
}
