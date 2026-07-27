import { describe, expect, it } from "vitest";
import {
  calculateDueDate,
  calculateInvoiceTotals,
  convertAmountToIndianWords,
  generateDocumentNumber,
  getFinancialYear,
} from "@/lib/invoiceUtils";

describe("invoice utilities", () => {
  it("detects Indian financial year from April to March", () => {
    expect(getFinancialYear(new Date("2026-04-01T00:00:00"))).toBe("2026-27");
    expect(getFinancialYear(new Date("2027-03-31T00:00:00"))).toBe("2026-27");
    expect(getFinancialYear(new Date("2027-04-01T00:00:00"))).toBe("2027-28");
  });

  it("generates padded document numbers", () => {
    expect(generateDocumentNumber({ type: "INV", financialYear: "2026-27", sequenceNumber: 1 })).toBe("PRV/INV/2026-27/0001");
    expect(generateDocumentNumber({ type: "QTN", financialYear: "2026-27", sequenceNumber: 42 })).toBe("PRV/QTN/2026-27/0042");
  });

  it("calculates intra-state GST as CGST plus SGST", () => {
    const totals = calculateInvoiceTotals({
      taxMode: "Intra-State",
      items: [{ quantity: 1, rate: 100000, discount: 0, gstRate: 18 }],
    });

    expect(totals.cgst).toBe(9000);
    expect(totals.sgst).toBe(9000);
    expect(totals.igst).toBe(0);
    expect(totals.grandTotal).toBe(118000);
  });

  it("calculates inter-state GST as IGST", () => {
    const totals = calculateInvoiceTotals({
      taxMode: "Inter-State",
      items: [{ quantity: 1, rate: 100000, discount: 0, gstRate: 18 }],
    });

    expect(totals.cgst).toBe(0);
    expect(totals.sgst).toBe(0);
    expect(totals.igst).toBe(18000);
    expect(totals.grandTotal).toBe(118000);
  });

  it("converts payable amount into Indian words", () => {
    expect(convertAmountToIndianWords(118000)).toBe("Indian Rupees One Lakh Eighteen Thousand Only");
  });

  it("calculates payment due date from standard terms", () => {
    expect(calculateDueDate("2026-07-27", "15 Days")).toBe("2026-08-11");
  });
});
