import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { evaluatePackage, fileForMatch } from "./status";

const A4 = [595.28, 841.89];
const MARGIN = 56;
const FOOTER_H = 28;
const INK = rgb(0.11, 0.1, 0.09);
const MUTED = rgb(0.35, 0.32, 0.28);
const LINE = rgb(0.78, 0.74, 0.66);
const SEAL = rgb(0.06, 0.46, 0.43);
const WHITE = rgb(1, 1, 1);

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatEnglishDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!match) return iso || "—";
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]} ${match[1]}`;
}

export function todayIso() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function includedDocuments(requirements, files, matches) {
  return [...requirements]
    .sort((a, b) => a.order - b.order)
    .map((requirement) => ({
      requirement,
      file: fileForMatch(files, matches, requirement.id),
    }))
    .filter((item) => item.file?.bytes);
}

function wrapText(text, font, size, maxWidth) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(next, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawFooter(page, font, tenderId, pageNumber, totalPages) {
  const { width } = page.getSize();
  const inset = Math.min(MARGIN, Math.max(18, width * 0.06));
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height: FOOTER_H,
    color: WHITE,
  });
  page.drawLine({
    start: { x: inset, y: FOOTER_H },
    end: { x: width - inset, y: FOOTER_H },
    thickness: 0.6,
    color: LINE,
  });
  const label = `${tenderId} | Page ${pageNumber} of ${totalPages}`;
  const size = 8;
  const textWidth = font.widthOfTextAtSize(label, size);
  page.drawText(label, {
    x: Math.max(inset, (width - textWidth) / 2),
    y: 10,
    size,
    font,
    color: MUTED,
  });
}

function drawLabeledValue(page, font, fontBold, label, value, y, width) {
  page.drawText(label, {
    x: MARGIN,
    y,
    size: 8,
    font: fontBold,
    color: MUTED,
  });
  const lines = wrapText(value || "—", font, 12, width - MARGIN * 2);
  let cursor = y - 16;
  for (const line of lines) {
    page.drawText(line, { x: MARGIN, y: cursor, size: 12, font, color: INK });
    cursor -= 16;
  }
  return cursor - 10;
}

function drawCover(page, font, fontBold, tender, entries, createdIso) {
  const { width, height } = page.getSize();
  let y = height - 64;

  page.drawText("TENDER SUBMISSION PACKAGE", {
    x: MARGIN,
    y,
    size: 10,
    font: fontBold,
    color: SEAL,
  });
  y -= 10;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: width - MARGIN, y },
    thickness: 1.5,
    color: SEAL,
  });

  y -= 32;
  y = drawLabeledValue(page, font, fontBold, "TENDER ID", tender.tender_id, y, width);
  y = drawLabeledValue(page, font, fontBold, "TENDER TITLE", tender.title, y, width);
  y = drawLabeledValue(page, font, fontBold, "PROCURING ENTITY", tender.procuring_entity, y, width);
  y = drawLabeledValue(page, font, fontBold, "BIDDER NAME", tender.bidder, y, width);
  y = drawLabeledValue(page, font, fontBold, "SUBMISSION DEADLINE", formatEnglishDate(tender.submission_deadline), y, width);
  y = drawLabeledValue(page, font, fontBold, "PACKAGE CREATION DATE", formatEnglishDate(createdIso), y, width);

  y -= 4;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: width - MARGIN, y },
    thickness: 0.6,
    color: LINE,
  });
  y -= 24;
  page.drawText("INCLUDED DOCUMENTS", {
    x: MARGIN,
    y,
    size: 8,
    font: fontBold,
    color: MUTED,
  });
  y -= 14;
  page.drawText("In required tender order", {
    x: MARGIN,
    y,
    size: 9,
    font,
    color: MUTED,
  });
  y -= 20;

  entries.forEach((entry, index) => {
    const number = String(index + 1).padStart(2, "0");
    page.drawText(number, { x: MARGIN, y, size: 11, font: fontBold, color: SEAL });
    const name = wrapText(entry.requirement.title_en, font, 11, width - MARGIN * 2 - 36);
    page.drawText(name[0], { x: MARGIN + 28, y, size: 11, font, color: INK });
    y -= 18;
  });
}

function drawIndex(page, font, fontBold, tender, entries) {
  const { width, height } = page.getSize();
  let y = height - 64;

  page.drawText(tender.tender_id, { x: MARGIN, y, size: 9, font, color: MUTED });
  y -= 22;
  page.drawText("Document index", { x: MARGIN, y, size: 18, font: fontBold, color: INK });
  y -= 12;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: width - MARGIN, y },
    thickness: 1,
    color: SEAL,
  });

  y -= 28;
  page.drawText("No.", { x: MARGIN, y, size: 8, font: fontBold, color: MUTED });
  page.drawText("Document", { x: MARGIN + 40, y, size: 8, font: fontBold, color: MUTED });
  page.drawText("Starts on page", { x: width - MARGIN - 90, y, size: 8, font: fontBold, color: MUTED });
  y -= 8;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: width - MARGIN, y },
    thickness: 0.5,
    color: LINE,
  });
  y -= 18;

  entries.forEach((entry, index) => {
    page.drawText(String(index + 1).padStart(2, "0"), {
      x: MARGIN,
      y,
      size: 10,
      font: fontBold,
      color: SEAL,
    });
    const name = wrapText(entry.requirement.title_en, font, 11, width - MARGIN * 2 - 140);
    page.drawText(name[0], { x: MARGIN + 40, y, size: 11, font, color: INK });
    page.drawText(String(entry.startPage), {
      x: width - MARGIN - 24,
      y,
      size: 11,
      font,
      color: INK,
    });
    y -= 20;
  });
}

export async function buildPackagePdf({ tender, requirements, files, matches, expiryDates }, onProgress) {
  onProgress?.("preparing");
  const validation = evaluatePackage({ tender, requirements, files, matches, expiryDates });
  if (!validation.ready) {
    const error = new Error("not-ready");
    error.blockers = validation.blockers;
    throw error;
  }

  const included = includedDocuments(requirements, files, matches);
  if (included.length === 0) {
    throw new Error("no-documents");
  }
  for (const item of included) {
    if (!item.file.bytes) throw new Error("missing-bytes");
  }

  onProgress?.("processing");
  const createdIso = todayIso();
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`${tender.tender_id} Tender Submission Package`);
  pdfDoc.setAuthor(tender.bidder);
  pdfDoc.setCreator("Folio Tender Package Builder");
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const loaded = [];
  for (const item of included) {
    const source = await PDFDocument.load(item.file.bytes, {
      ignoreEncryption: true,
      updateMetadata: false,
    });
    loaded.push({
      requirement: item.requirement,
      bytes: item.file.bytes,
      pageCount: source.getPageCount(),
    });
  }

  let nextPage = 3;
  const entries = loaded.map((item) => {
    const startPage = nextPage;
    nextPage += item.pageCount;
    return {
      requirement: item.requirement,
      startPage,
      pageCount: item.pageCount,
    };
  });

  const cover = pdfDoc.addPage(A4);
  drawCover(cover, font, fontBold, tender, entries, createdIso);

  const index = pdfDoc.addPage(A4);
  drawIndex(index, font, fontBold, tender, entries);

  for (const item of loaded) {
    const indices = Array.from({ length: item.pageCount }, (_, index) => index);
    const embeddedPages = await pdfDoc.embedPdf(item.bytes, indices);
    for (const embedded of embeddedPages) {
      const width = embedded.width;
      const height = embedded.height;
      const page = pdfDoc.addPage([width, height]);
      const usable = Math.max(height - FOOTER_H, height * 0.9);
      const scale = usable / height;
      const drawWidth = width * scale;
      page.drawPage(embedded, {
        x: (width - drawWidth) / 2,
        y: FOOTER_H,
        width: drawWidth,
        height: usable,
      });
    }
  }

  onProgress?.("finalizing");
  const pages = pdfDoc.getPages();
  const total = pages.length;
  pages.forEach((page, index) => {
    drawFooter(page, font, tender.tender_id, index + 1, total);
  });

  const bytes = await pdfDoc.save({ useObjectStreams: false });
  return {
    bytes,
    filename: `${tender.tender_id}_Package.pdf`,
    pages: total,
    documents: included.length,
    createdIso,
    entries,
  };
}

export function triggerDownload(bytes, filename) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  return { blob, url };
}
