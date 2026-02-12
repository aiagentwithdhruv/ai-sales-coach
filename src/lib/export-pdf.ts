/**
 * PDF Export Utility
 * Converts markdown text content to a styled PDF document
 */

import jsPDF from "jspdf";

interface ExportOptions {
  title: string;
  content: string;
  subtitle?: string;
  metadata?: Record<string, string>;
}

interface QuotationPDFOptions {
  referenceNumber: string;
  clientName: string;
  company: string;
  email: string;
  productService: string;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number }>;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  validUntil: string;
  notes: string;
  aiEnhancement: string;
  status: string;
}

function fmtCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

// ─── Quotation-specific PDF export ─────────────────────────────────────────

export function exportQuotationPDF(opts: QuotationPDFOptions): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth(); // 210
  const ph = doc.internal.pageSize.getHeight(); // 297
  const m = 18; // margin
  const cw = pw - m * 2; // content width
  let y = 0;

  const checkPage = (need: number) => {
    if (y + need > ph - 20) {
      doc.addPage();
      y = m;
    }
  };

  // ─── Header Band ─────────────────────────────────────────────────────────
  doc.setFillColor(10, 14, 20);
  doc.rect(0, 0, pw, 52, "F");

  // Accent line
  doc.setFillColor(0, 179, 255);
  doc.rect(0, 52, pw, 1.5, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("QUOTATION", m, 22);

  // Reference
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(120, 140, 160);
  doc.text(opts.referenceNumber, m, 31);

  // Date + Valid (right side)
  doc.setFontSize(10);
  doc.setTextColor(180, 190, 200);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pw - m, 22, { align: "right" });
  doc.text(`Valid Until: ${opts.validUntil}`, pw - m, 29, { align: "right" });

  // Status badge
  doc.setFontSize(8);
  const statusText = opts.status.toUpperCase();
  const stw = doc.getTextWidth(statusText) + 8;
  doc.setFillColor(0, 179, 255);
  doc.roundedRect(pw - m - stw, 34, stw, 7, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(statusText, pw - m - stw + 4, 39);

  y = 62;

  // ─── Client Details Card ─────────────────────────────────────────────────
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(m, y, cw, 30, 3, 3, "F");

  doc.setFontSize(8);
  doc.setTextColor(130, 140, 150);
  doc.text("PREPARED FOR", m + 6, y + 8);

  doc.setFontSize(13);
  doc.setTextColor(20, 20, 30);
  doc.setFont("helvetica", "bold");
  doc.text(opts.clientName, m + 6, y + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 85, 95);
  const line2 = [opts.company, opts.email].filter(Boolean).join("  •  ");
  doc.text(line2, m + 6, y + 23);

  y += 38;

  // ─── Product / Service ───────────────────────────────────────────────────
  if (opts.productService) {
    doc.setFontSize(8);
    doc.setTextColor(130, 140, 150);
    doc.text("PRODUCT / SERVICE", m, y);
    y += 5;
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 50);
    doc.setFont("helvetica", "bold");
    const prodLines = doc.splitTextToSize(opts.productService, cw);
    doc.text(prodLines, m, y);
    y += prodLines.length * 5 + 6;
    doc.setFont("helvetica", "normal");
  }

  // ─── Line Items Table ────────────────────────────────────────────────────
  const validItems = opts.lineItems.filter((li) => li.description);
  if (validItems.length > 0) {
    checkPage(20 + validItems.length * 10);

    // Table header
    const cols = [
      { label: "Description", x: m, w: cw * 0.48 },
      { label: "Qty", x: m + cw * 0.48, w: cw * 0.12 },
      { label: "Unit Price", x: m + cw * 0.60, w: cw * 0.20 },
      { label: "Amount", x: m + cw * 0.80, w: cw * 0.20 },
    ];

    // Header row bg
    doc.setFillColor(10, 14, 20);
    doc.roundedRect(m, y, cw, 9, 2, 2, "F");

    doc.setFontSize(8);
    doc.setTextColor(180, 190, 200);
    doc.setFont("helvetica", "bold");
    cols.forEach((col) => {
      const align = col.label === "Description" ? "left" : "right";
      const tx = align === "right" ? col.x + col.w - 3 : col.x + 4;
      doc.text(col.label, tx, y + 6, { align });
    });
    y += 9;

    // Item rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    validItems.forEach((item, idx) => {
      checkPage(10);
      const rowBg = idx % 2 === 0 ? 252 : 245;
      doc.setFillColor(rowBg, rowBg, rowBg);
      doc.rect(m, y, cw, 9, "F");

      doc.setTextColor(40, 40, 50);
      // Description (truncate if too long)
      const desc = item.description.length > 45 ? item.description.slice(0, 42) + "..." : item.description;
      doc.text(desc, cols[0].x + 4, y + 6);

      doc.setTextColor(60, 65, 75);
      doc.text(String(item.quantity), cols[1].x + cols[1].w - 3, y + 6, { align: "right" });
      doc.text(fmtCurrency(item.unitPrice), cols[2].x + cols[2].w - 3, y + 6, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 40);
      doc.text(fmtCurrency(item.quantity * item.unitPrice), cols[3].x + cols[3].w - 3, y + 6, { align: "right" });
      doc.setFont("helvetica", "normal");

      y += 9;
    });

    // Bottom line
    doc.setDrawColor(200, 205, 210);
    doc.setLineWidth(0.3);
    doc.line(m, y, m + cw, y);
    y += 6;
  }

  // ─── Pricing Summary ─────────────────────────────────────────────────────
  checkPage(40);

  const summaryX = m + cw * 0.55;
  const summaryW = cw * 0.45;

  const addSummaryRow = (label: string, value: string, bold = false, color?: [number, number, number]) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 12 : 10);
    doc.setTextColor(100, 105, 115);
    doc.text(label, summaryX, y);
    doc.setTextColor(...(color || (bold ? [0, 179, 255] : [40, 40, 50])));
    doc.text(value, summaryX + summaryW, y, { align: "right" });
    y += bold ? 8 : 6;
  };

  addSummaryRow("Subtotal", fmtCurrency(opts.subtotal));

  if (opts.discountPercent > 0) {
    addSummaryRow(`Discount (${opts.discountPercent}%)`, `-${fmtCurrency(opts.discountAmount)}`, false, [46, 160, 67]);
  }
  if (opts.taxPercent > 0) {
    addSummaryRow(`Tax (${opts.taxPercent}%)`, `+${fmtCurrency(opts.taxAmount)}`);
  }

  // Total row with background
  y += 2;
  doc.setFillColor(10, 14, 20);
  doc.roundedRect(summaryX - 4, y - 5, summaryW + 8, 12, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("Total", summaryX, y + 2);
  doc.setTextColor(0, 179, 255);
  doc.text(fmtCurrency(opts.total), summaryX + summaryW, y + 2, { align: "right" });

  y += 16;

  // ─── Notes / Terms ───────────────────────────────────────────────────────
  if (opts.notes) {
    checkPage(25);
    doc.setDrawColor(220, 225, 230);
    doc.setLineWidth(0.3);
    doc.line(m, y, m + cw, y);
    y += 6;

    doc.setFontSize(8);
    doc.setTextColor(130, 140, 150);
    doc.text("TERMS & CONDITIONS", m, y);
    y += 5;

    doc.setFontSize(9);
    doc.setTextColor(80, 85, 95);
    doc.setFont("helvetica", "normal");
    const noteLines = doc.splitTextToSize(opts.notes, cw);
    doc.text(noteLines, m, y);
    y += noteLines.length * 4 + 4;
  }

  // ─── AI Proposal Section ─────────────────────────────────────────────────
  if (opts.aiEnhancement) {
    checkPage(25);
    y += 4;
    doc.setDrawColor(220, 225, 230);
    doc.setLineWidth(0.3);
    doc.line(m, y, m + cw, y);
    y += 6;

    doc.setFontSize(8);
    doc.setTextColor(130, 140, 150);
    doc.text("PROPOSAL DETAILS", m, y);
    y += 5;

    doc.setFontSize(9);
    doc.setTextColor(60, 65, 75);
    doc.setFont("helvetica", "normal");

    // Process AI enhancement text line by line
    const aiClean = opts.aiEnhancement
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/^#{1,6}\s+/gm, "");

    const aiLines = aiClean.split("\n");
    for (const line of aiLines) {
      const t = line.trim();
      if (!t) { y += 2; continue; }
      checkPage(8);
      const wrapped = doc.splitTextToSize(t, cw);
      doc.text(wrapped, m, y);
      y += wrapped.length * 4 + 1;
    }
  }

  // ─── Footer ──────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Footer line
    doc.setDrawColor(220, 225, 230);
    doc.setLineWidth(0.2);
    doc.line(m, ph - 14, pw - m, ph - 14);
    // Footer text
    doc.setFontSize(7);
    doc.setTextColor(150, 155, 165);
    doc.text("Generated by QuotaHit AI Sales Coach", m, ph - 9);
    doc.text(`Page ${i} of ${totalPages}`, pw - m, ph - 9, { align: "right" });
  }

  // ─── Save ────────────────────────────────────────────────────────────────
  const filename = `quotation-${opts.referenceNumber.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}

// ─── Generic markdown-to-PDF (used by other pages) ─────────────────────────

/**
 * Strip markdown formatting for clean PDF text
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "") // headers
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/\*(.+?)\*/g, "$1") // italic
    .replace(/`(.+?)`/g, "$1") // inline code
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```\w*\n?/g, "")) // code blocks
    .replace(/^\s*[-*+]\s+/gm, "  - ") // bullet points
    .replace(/^\s*\d+\.\s+/gm, (match) => `  ${match.trim()} `) // numbered lists
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // links
    .replace(/^\|.*\|$/gm, (match) => {
      const cells = match.split("|").filter(Boolean).map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) return "";
      return cells.join("  |  ");
    })
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * Export content as a styled PDF (generic)
 */
export function exportToPDF({ title, content, subtitle, metadata }: ExportOptions): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPage = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header
  doc.setFillColor(11, 15, 20);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(0, 179, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("AI Sales Coach", margin, 18);
  doc.setTextColor(199, 204, 209);
  doc.setFontSize(14);
  doc.text(title, margin, 30);
  y = 48;

  if (subtitle) {
    doc.setTextColor(154, 164, 175);
    doc.setFontSize(10);
    doc.text(subtitle, margin, y);
    y += 6;
  }

  if (metadata) {
    doc.setFontSize(9);
    doc.setTextColor(154, 164, 175);
    for (const [key, value] of Object.entries(metadata)) {
      doc.text(`${key}: ${value}`, margin, y);
      y += 5;
    }
  }

  y += 4;
  doc.setDrawColor(42, 47, 54);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  const cleanContent = stripMarkdown(content);
  const lines = cleanContent.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { y += 3; continue; }

    const isHeader = /^[A-Z][A-Za-z\s&/]+:?\s*$/.test(trimmed) ||
      content.includes(`## ${trimmed}`) ||
      content.includes(`### ${trimmed}`);

    if (isHeader) {
      checkPage(12);
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 179, 255);
      const wrappedHeader = doc.splitTextToSize(trimmed, contentWidth);
      doc.text(wrappedHeader, margin, y);
      y += wrappedHeader.length * 6 + 2;
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      checkPage(8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const bulletText = trimmed.replace(/^[-*]\s+/, "");
      const wrappedBullet = doc.splitTextToSize(`  \u2022  ${bulletText}`, contentWidth - 5);
      doc.text(wrappedBullet, margin + 2, y);
      y += wrappedBullet.length * 5 + 1;
    } else if (trimmed.includes("|")) {
      checkPage(8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const wrappedRow = doc.splitTextToSize(trimmed, contentWidth);
      doc.text(wrappedRow, margin, y);
      y += wrappedRow.length * 4.5 + 1;
    } else {
      checkPage(8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const wrappedText = doc.splitTextToSize(trimmed, contentWidth);
      doc.text(wrappedText, margin, y);
      y += wrappedText.length * 5 + 2;
    }
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(154, 164, 175);
    doc.text(
      `AI Sales Coach Report  |  Page ${i} of ${totalPages}  |  ${new Date().toLocaleDateString()}`,
      margin,
      pageHeight - 10
    );
  }

  const filename = `${title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
