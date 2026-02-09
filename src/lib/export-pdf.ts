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
      // table rows - extract cell values
      const cells = match.split("|").filter(Boolean).map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) return ""; // skip separator rows
      return cells.join("  |  ");
    })
    .replace(/\n{3,}/g, "\n\n"); // clean up extra newlines
}

/**
 * Export content as a styled PDF
 */
export function exportToPDF({ title, content, subtitle, metadata }: ExportOptions): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper to add a new page if needed
  const checkPage = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // --- Header ---
  doc.setFillColor(11, 15, 20); // obsidian
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(0, 179, 255); // neonblue
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("AI Sales Coach", margin, 18);

  doc.setTextColor(199, 204, 209); // platinum
  doc.setFontSize(14);
  doc.text(title, margin, 30);

  y = 48;

  // --- Subtitle / Metadata ---
  if (subtitle) {
    doc.setTextColor(154, 164, 175); // silver
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

  // --- Divider ---
  doc.setDrawColor(42, 47, 54); // gunmetal
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // --- Content ---
  const cleanContent = stripMarkdown(content);
  const lines = cleanContent.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      y += 3;
      continue;
    }

    // Detect section headers (lines that were ## in original markdown)
    const isHeader = /^[A-Z][A-Za-z\s&/]+:?\s*$/.test(trimmed) ||
      content.includes(`## ${trimmed}`) ||
      content.includes(`### ${trimmed}`);

    if (isHeader) {
      checkPage(12);
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 179, 255); // neonblue for headers
      const wrappedHeader = doc.splitTextToSize(trimmed, contentWidth);
      doc.text(wrappedHeader, margin, y);
      y += wrappedHeader.length * 6 + 2;
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      // Bullet point
      checkPage(8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const bulletText = trimmed.replace(/^[-*]\s+/, "");
      const wrappedBullet = doc.splitTextToSize(`  \u2022  ${bulletText}`, contentWidth - 5);
      doc.text(wrappedBullet, margin + 2, y);
      y += wrappedBullet.length * 5 + 1;
    } else if (trimmed.includes("|")) {
      // Table row
      checkPage(8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const wrappedRow = doc.splitTextToSize(trimmed, contentWidth);
      doc.text(wrappedRow, margin, y);
      y += wrappedRow.length * 4.5 + 1;
    } else {
      // Regular text
      checkPage(8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const wrappedText = doc.splitTextToSize(trimmed, contentWidth);
      doc.text(wrappedText, margin, y);
      y += wrappedText.length * 5 + 2;
    }
  }

  // --- Footer on each page ---
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

  // --- Download ---
  const filename = `${title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
