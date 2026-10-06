export const STATUS = {
  MISSING: "missing",
  EXPIRY_NEEDED: "expiry_needed",
  EXPIRED: "expired",
  NOT_PROVIDED: "not_provided",
  OK: "ok",
};

export const BLOCKING_STATUSES = new Set([STATUS.MISSING, STATUS.EXPIRY_NEEDED, STATUS.EXPIRED]);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isUsableFile(file) {
  return Boolean(file?.id && file.status === "ready" && file.hash && file.bytes?.byteLength);
}

export function requirementStatus(requirement, fileId, expiryDate, deadline) {
  const matched = Boolean(fileId);
  if (!matched) {
    return requirement.mandatory ? STATUS.MISSING : STATUS.NOT_PROVIDED;
  }
  if (requirement.has_expiry) {
    if (!expiryDate || !DATE_RE.test(expiryDate)) return STATUS.EXPIRY_NEEDED;
    if (expiryDate < deadline) return STATUS.EXPIRED;
  }
  return STATUS.OK;
}

export function matchedHashSet(files, matches, exceptRequirementId) {
  const byId = new Map(files.map((file) => [file.id, file]));
  const hashes = new Set();
  for (const [requirementId, fileId] of Object.entries(matches)) {
    if (requirementId === exceptRequirementId) continue;
    const file = byId.get(fileId);
    if (file?.hash) hashes.add(file.hash);
  }
  return hashes;
}

export function fileForMatch(files, matches, requirementId) {
  const fileId = matches[requirementId];
  if (!fileId) return null;
  return files.find((file) => file.id === fileId) || null;
}

export function evaluatePackage({ tender, requirements, files, matches, expiryDates }) {
  const deadline = tender?.submission_deadline || "";
  const byRequirement = {};
  const blockers = [];
  const counts = {
    missing: 0,
    expiry_needed: 0,
    expired: 0,
    not_provided: 0,
    ok: 0,
  };

  for (const requirement of requirements) {
    const file = fileForMatch(files, matches, requirement.id);
    const expiry = expiryDates[requirement.id] || "";
    const status = requirementStatus(requirement, isUsableFile(file) ? file.id : null, expiry, deadline);
    const blocking = BLOCKING_STATUSES.has(status);
    byRequirement[requirement.id] = {
      status,
      blocking,
      file,
      expiry,
    };
    counts[status] += 1;
    if (blocking) {
      blockers.push({
        requirementId: requirement.id,
        status,
        requirement,
        file,
      });
    }
  }

  return {
    byRequirement,
    blockers,
    counts,
    ready: Boolean(tender) && requirements.length > 0 && blockers.length === 0,
  };
}

export function statusTone(status) {
  if (status === STATUS.OK) return "ok";
  if (status === STATUS.NOT_PROVIDED) return "muted";
  if (status === STATUS.EXPIRY_NEEDED) return "warn";
  return "danger";
}

export function statusLabelKey(status) {
  return {
    [STATUS.MISSING]: "statusMissing",
    [STATUS.EXPIRY_NEEDED]: "statusExpiryNeeded",
    [STATUS.EXPIRED]: "statusExpired",
    [STATUS.NOT_PROVIDED]: "statusNotProvided",
    [STATUS.OK]: "statusOk",
  }[status];
}

export function statusHelpKey(status) {
  return {
    [STATUS.MISSING]: "helpMissing",
    [STATUS.EXPIRY_NEEDED]: "helpExpiryNeeded",
    [STATUS.EXPIRED]: "helpExpired",
    [STATUS.NOT_PROVIDED]: "helpNotProvided",
    [STATUS.OK]: "helpOk",
  }[status];
}
