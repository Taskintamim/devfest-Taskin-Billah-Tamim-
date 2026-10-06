import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { sha256Hex } from "../src/lib/hash.js";
import { buildPackagePdf } from "../src/lib/packagePdf.js";
import { parseRequirementsPayload } from "../src/lib/parseRequirements.js";
import { readPdfPageCount } from "../src/lib/pdf.js";
import { evaluatePackage } from "../src/lib/status.js";

const root = path.resolve("sample-pack");
const payload = JSON.parse(fs.readFileSync(path.join(root, "requirements.json"), "utf8"));
const { tender, requirements } = parseRequirementsPayload(payload);

const names = fs.readdirSync(path.join(root, "documents")).filter((name) => name.endsWith(".pdf"));
const files = [];
for (const name of names) {
  const bytes = new Uint8Array(fs.readFileSync(path.join(root, "documents", name)));
  const hash = await sha256Hex(bytes);
  const pageCount = await readPdfPageCount(bytes);
  files.push({
    id: name,
    name,
    size: bytes.byteLength,
    bytes,
    hash,
    pageCount,
    status: "ready",
  });
}

const pick = (name) => files.find((file) => file.name === name).id;
const matches = {
  R01: pick("trade_license_2026.pdf"),
  R02: pick("03_tin_certificate.pdf"),
  R03: pick("04_vat_certificate.pdf"),
  R04: pick("bank_solvency.pdf"),
  R05: pick("experience_cert.pdf"),
  R08: pick("02_technical_proposal.pdf"),
  R09: pick("01_financial_proposal.pdf"),
  R10: pick("scan_0042.pdf"),
};
const expiryDates = {
  R01: "2027-12-31",
  R04: "2027-06-30",
};

const validation = evaluatePackage({ tender, requirements, files, matches, expiryDates });
if (!validation.ready) {
  console.error("NOT READY", validation.blockers.map((item) => `${item.requirementId}:${item.status}`));
  process.exit(1);
}

const result = await buildPackagePdf({ tender, requirements, files, matches, expiryDates }, (phase) => {
  console.log("phase", phase);
});

const outDir = path.resolve("output");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, result.filename);
fs.writeFileSync(outPath, result.bytes);
console.log("wrote", outPath);
console.log("filename", result.filename);
console.log("pages", result.pages);
console.log("documents", result.documents);
console.log("starts", result.entries.map((item) => `${item.requirement.id} ${item.startPage} (${item.pageCount})`).join(" | "));

const loaded = await PDFDocument.load(result.bytes);
console.log("reloaded pages", loaded.getPageCount());
if (loaded.getPageCount() !== result.pages) {
  console.error("page count mismatch");
  process.exit(1);
}
if (result.filename !== `${tender.tender_id}_Package.pdf`) {
  console.error("bad filename");
  process.exit(1);
}
console.log("ok");
