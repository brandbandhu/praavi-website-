export type TaxMode = "Intra-State" | "Inter-State" | "No GST" | "Custom Tax";

export interface InvoiceItemInput {
  quantity: number | string;
  rate: number | string;
  discount?: number | string;
  gstRate?: number | string;
}

export function getFinancialYear(date = new Date()): string {
  const year = date.getFullYear();
  const start = date.getMonth() >= 3 ? year : year - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
}

export function generateDocumentNumber({
  prefix = "PRV",
  type,
  financialYear,
  sequenceNumber,
  separator = "/",
  digits = 4,
}: {
  prefix?: string;
  type: "INV" | "QTN" | "SOW";
  financialYear: string;
  sequenceNumber: number;
  separator?: string;
  digits?: number;
}): string {
  return [prefix.trim(), type, financialYear.trim(), String(sequenceNumber).padStart(digits, "0")].join(separator);
}

const toNumber = (value: number | string | undefined): number => {
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const money = (value: number): number => Math.round((Math.max(0, value) + Number.EPSILON) * 100) / 100;

export function calculateInvoiceTotals({
  items,
  taxMode,
  overallDiscount = 0,
  additionalCharges = 0,
  roundOff = 0,
  amountPaid = 0,
}: {
  items: InvoiceItemInput[];
  taxMode: TaxMode;
  overallDiscount?: number;
  additionalCharges?: number;
  roundOff?: number;
  amountPaid?: number;
}) {
  let subtotal = 0;
  let itemDiscount = 0;
  let taxableAmount = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  const lines = items.map((item) => {
    const quantity = toNumber(item.quantity);
    const rate = toNumber(item.rate);
    const discount = toNumber(item.discount);
    const gstRate = toNumber(item.gstRate ?? 18);
    const base = money(quantity * rate);
    const taxable = money(base - discount);
    const lineCgst = taxMode === "Intra-State" ? money(taxable * (gstRate / 2) / 100) : 0;
    const lineSgst = taxMode === "Intra-State" ? money(taxable * (gstRate / 2) / 100) : 0;
    const lineIgst = taxMode === "Inter-State" ? money(taxable * gstRate / 100) : 0;
    const taxAmount = taxMode === "No GST" ? 0 : money(lineCgst + lineSgst + lineIgst);
    const lineTotal = money(taxable + taxAmount);

    subtotal += base;
    itemDiscount += discount;
    taxableAmount += taxable;
    cgst += lineCgst;
    sgst += lineSgst;
    igst += lineIgst;

    return { quantity, rate, discount, taxableAmount: taxable, cgst: lineCgst, sgst: lineSgst, igst: lineIgst, taxAmount, lineTotal };
  });

  const grandTotal = money(taxableAmount + cgst + sgst + igst + toNumber(additionalCharges) - toNumber(overallDiscount) + Number(roundOff || 0));
  const paid = Math.min(toNumber(amountPaid), grandTotal);

  return {
    lines,
    subtotal: money(subtotal),
    itemDiscount: money(itemDiscount),
    taxableAmount: money(taxableAmount),
    cgst: money(cgst),
    sgst: money(sgst),
    igst: money(igst),
    grandTotal,
    amountPaid: paid,
    balanceDue: money(grandTotal - paid),
  };
}

export function convertAmountToIndianWords(amount: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n: number) => (n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`);
  const three = (n: number) => `${n > 99 ? `${ones[Math.floor(n / 100)]} Hundred ` : ""}${two(n % 100)}`.trim();
  let value = Math.floor(money(amount));
  if (!value) return "Indian Rupees Zero Only";

  const parts: string[] = [];
  const crore = Math.floor(value / 10000000);
  value %= 10000000;
  const lakh = Math.floor(value / 100000);
  value %= 100000;
  const thousand = Math.floor(value / 1000);
  value %= 1000;

  if (crore) parts.push(`${three(crore)} Crore`);
  if (lakh) parts.push(`${three(lakh)} Lakh`);
  if (thousand) parts.push(`${three(thousand)} Thousand`);
  if (value) parts.push(three(value));

  return `Indian Rupees ${parts.join(" ")} Only`;
}

export function calculateDueDate(invoiceDate: string, paymentTerm: string): string {
  const daysByTerm: Record<string, number> = {
    "Due on Receipt": 0,
    "Advance Payment": 0,
    "7 Days": 7,
    "15 Days": 15,
    "30 Days": 30,
    "45 Days": 45,
    "60 Days": 60,
  };
  const days = daysByTerm[paymentTerm];
  if (days === undefined) return "";
  const [year, month, day] = invoiceDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
