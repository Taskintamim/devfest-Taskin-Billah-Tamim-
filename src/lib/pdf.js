import { PDFDocument } from "pdf-lib";

export async function readPdfPageCount(bytes) {
  const document = await PDFDocument.load(bytes, {
    ignoreEncryption: true,
    updateMetadata: false,
    throwOnInvalidObject: false,
  });
  return document.getPageCount();
}
