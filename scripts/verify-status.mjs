import { evaluatePackage, requirementStatus, STATUS } from "../src/lib/status.js";

function req(partial) {
  return {
    id: "R01",
    order: 1,
    title_en: "Trade License",
    title_bn: "ট্রেড লাইসেন্স",
    mandatory: true,
    has_expiry: false,
    ...partial,
  };
}

function file(partial = {}) {
  return {
    id: "f1",
    status: "ready",
    hash: "abc",
    bytes: new Uint8Array([1, 2, 3]),
    ...partial,
  };
}

const deadline = "2026-10-20";
const checks = [];

function assert(name, actual, expected) {
  const ok = actual === expected;
  checks.push({ name, ok, actual, expected });
  if (!ok) console.error("FAIL", name, { actual, expected });
}

assert("missing mandatory", requirementStatus(req({ mandatory: true }), null, "", deadline), STATUS.MISSING);
assert("not provided optional", requirementStatus(req({ mandatory: false }), null, "", deadline), STATUS.NOT_PROVIDED);
assert("ok no expiry", requirementStatus(req({ has_expiry: false }), "f1", "", deadline), STATUS.OK);
assert("expiry needed", requirementStatus(req({ has_expiry: true }), "f1", "", deadline), STATUS.EXPIRY_NEEDED);
assert("expired", requirementStatus(req({ has_expiry: true }), "f1", "2026-10-19", deadline), STATUS.EXPIRED);
assert("same-day expiry is OK", requirementStatus(req({ has_expiry: true }), "f1", "2026-10-20", deadline), STATUS.OK);
assert("later expiry is OK", requirementStatus(req({ has_expiry: true }), "f1", "2026-10-21", deadline), STATUS.OK);
assert("bad expiry format", requirementStatus(req({ has_expiry: true }), "f1", "20/10/2026", deadline), STATUS.EXPIRY_NEEDED);

const invalidPkg = evaluatePackage({
  tender: { submission_deadline: deadline },
  requirements: [req({ has_expiry: true })],
  files: [file({ status: "invalid" })],
  matches: { R01: "f1" },
  expiryDates: { R01: "2027-01-01" },
});
assert("invalid matched file is missing", invalidPkg.byRequirement.R01.status, STATUS.MISSING);
assert("invalid matched file blocks", invalidPkg.ready, false);

const readyPkg = evaluatePackage({
  tender: { submission_deadline: deadline },
  requirements: [
    req({ id: "R01", order: 1, mandatory: true, has_expiry: true }),
    req({ id: "R02", order: 2, mandatory: false, has_expiry: false }),
  ],
  files: [file()],
  matches: { R01: "f1" },
  expiryDates: { R01: "2026-10-20" },
});
assert("optional unmatched does not block", readyPkg.byRequirement.R02.status, STATUS.NOT_PROVIDED);
assert("package ready with same-day expiry", readyPkg.ready, true);

const failed = checks.filter((item) => !item.ok);
console.log(`${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exit(1);
