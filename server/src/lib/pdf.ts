import PDFDocument from "pdfkit";
import type { Response } from "express";

const PAGE_MARGIN = 50;
const PAGE_WIDTH = 595.28; // A4 at 72dpi
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

export function rupees(paise: number): string {
  return `Rs. ${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Streams a new A4 PDF straight to the response. `inline` lets it preview in
// the browser tab (still downloadable from there) instead of forcing a save dialog.
export function startPdfResponse(res: Response, filename: string): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: "A4", margin: PAGE_MARGIN });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  doc.pipe(res);
  return doc;
}

// Company header shared by every generated document. No logo yet — once
// branding is ready, drop `doc.image(logoPath, PAGE_MARGIN, 45, { width: 100 })`
// in here and shift the text block right.
export function drawHeader(
  doc: PDFKit.PDFDocument,
  opts: { docType: string; docNumber?: string; date?: string }
): number {
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#111111")
    .text("Praavi Consultants", PAGE_MARGIN, 50);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#666666")
    .text("Digital Marketing & Web Development", PAGE_MARGIN, 72);

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#111111")
    .text(opts.docType, PAGE_MARGIN, 105, { width: CONTENT_WIDTH, align: "right" });

  const metaLines = [opts.docNumber ? `No: ${opts.docNumber}` : null, opts.date ? `Date: ${opts.date}` : null].filter(
    Boolean
  ) as string[];
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#444444")
    .text(metaLines.join("   |   "), PAGE_MARGIN, 124, { width: CONTENT_WIDTH, align: "right" });

  doc.moveTo(PAGE_MARGIN, 150).lineTo(PAGE_WIDTH - PAGE_MARGIN, 150).strokeColor("#dddddd").lineWidth(1).stroke();

  return 170; // y-position where callers should start their content
}

// A simple two-column "label: value" block, e.g. client/amount/date details.
export function drawFacts(doc: PDFKit.PDFDocument, startY: number, rows: [string, string][]): number {
  let y = startY;
  for (const [label, value] of rows) {
    doc.font("Helvetica").fontSize(10).fillColor("#666666").text(label, PAGE_MARGIN, y, { width: 150 });
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#111111")
      .text(value, PAGE_MARGIN + 150, y, { width: CONTENT_WIDTH - 150 });
    y += 20;
  }
  return y + 10;
}

// A checked/unchecked deliverables list (Digital Marketing package quotations) —
// only the included items are shown, with their quantity where it's more
// than a plain yes/no.
export function drawChecklist(
  doc: PDFKit.PDFDocument,
  startY: number,
  packageName: string | null,
  items: { name: string; unit: string; included: boolean; quantity: number }[]
): number {
  let y = startY;

  if (packageName) {
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#111111").text(`Package: ${packageName}`, PAGE_MARGIN, y);
    y += 22;
  }

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#666666").text("Included in this quotation", PAGE_MARGIN, y);
  y += 16;
  doc.moveTo(PAGE_MARGIN, y).lineTo(PAGE_WIDTH - PAGE_MARGIN, y).strokeColor("#dddddd").stroke();
  y += 10;

  const included = items.filter((i) => i.included);
  doc.font("Helvetica").fontSize(10).fillColor("#111111");
  for (const item of included) {
    const qtyLabel = item.unit === "included" ? "" : `  —  ${item.quantity} ${item.unit}`;
    doc.text(`✓  ${item.name}${qtyLabel}`, PAGE_MARGIN + 4, y, { width: CONTENT_WIDTH - 8 });
    y += 16;
  }
  if (included.length === 0) {
    doc.fillColor("#999999").text("No deliverables selected.", PAGE_MARGIN + 4, y);
    y += 16;
  }

  return y + 14;
}

// A single bold total row — pairs with drawChecklist for package quotations
// that are priced as one figure rather than itemized.
export function drawTotalOnly(doc: PDFKit.PDFDocument, startY: number, label: string, totalPaise: number): number {
  let y = startY;
  doc.moveTo(PAGE_MARGIN, y).lineTo(PAGE_WIDTH - PAGE_MARGIN, y).strokeColor("#111111").stroke();
  y += 10;
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#111111");
  doc.text(label, PAGE_MARGIN, y, { width: CONTENT_WIDTH - 120 });
  doc.text(rupees(totalPaise), PAGE_MARGIN + CONTENT_WIDTH - 120, y, { width: 120, align: "right" });
  return y + 24;
}

// A description/amount line-item table with a bold total row.
export function drawLineItems(
  doc: PDFKit.PDFDocument,
  startY: number,
  items: { description: string; amountPaise: number }[],
  totalLabel: string,
  totalPaise: number
): number {
  let y = startY;
  const descX = PAGE_MARGIN;
  const amountX = PAGE_MARGIN + CONTENT_WIDTH - 120;

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#666666");
  doc.text("Description", descX, y);
  doc.text("Amount", amountX, y, { width: 120, align: "right" });
  y += 16;
  doc.moveTo(PAGE_MARGIN, y).lineTo(PAGE_WIDTH - PAGE_MARGIN, y).strokeColor("#dddddd").stroke();
  y += 10;

  doc.font("Helvetica").fontSize(10).fillColor("#111111");
  for (const item of items) {
    const lineHeight = doc.heightOfString(item.description, { width: amountX - descX - 20 });
    doc.text(item.description, descX, y, { width: amountX - descX - 20 });
    doc.text(rupees(item.amountPaise), amountX, y, { width: 120, align: "right" });
    y += Math.max(lineHeight, 14) + 8;
  }

  y += 6;
  doc.moveTo(PAGE_MARGIN, y).lineTo(PAGE_WIDTH - PAGE_MARGIN, y).strokeColor("#111111").stroke();
  y += 10;
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#111111");
  doc.text(totalLabel, descX, y, { width: amountX - descX - 20 });
  doc.text(rupees(totalPaise), amountX, y, { width: 120, align: "right" });
  y += 24;

  return y;
}

export function drawFooterNote(doc: PDFKit.PDFDocument, text: string): void {
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#999999")
    .text(text, PAGE_MARGIN, 780, { width: CONTENT_WIDTH, align: "center" });
}
