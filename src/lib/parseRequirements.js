const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function requiredString(obj, key) {
  const value = obj[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`missing:${key}`);
  }
  return value.trim();
}

function requiredBoolean(obj, key) {
  if (typeof obj[key] !== "boolean") {
    throw new Error(`missing:${key}`);
  }
  return obj[key];
}

function requiredNumber(obj, key) {
  const value = obj[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`missing:${key}`);
  }
  return value;
}

export function parseRequirementsPayload(data) {
  const root = asObject(data);
  if (!root) {
    throw new Error("invalid-root");
  }

  const tenderRaw = asObject(root.tender);
  if (!tenderRaw) {
    throw new Error("missing-tender");
  }

  const tender = {
    tender_id: requiredString(tenderRaw, "tender_id"),
    title: requiredString(tenderRaw, "title"),
    procuring_entity: requiredString(tenderRaw, "procuring_entity"),
    bidder: requiredString(tenderRaw, "bidder"),
    submission_deadline: requiredString(tenderRaw, "submission_deadline"),
  };

  if (!DATE_RE.test(tender.submission_deadline)) {
    throw new Error("bad-deadline");
  }

  if (!Array.isArray(root.requirements) || root.requirements.length === 0) {
    throw new Error("missing-requirements");
  }

  const requirements = root.requirements.map((item) => {
    const row = asObject(item);
    if (!row) throw new Error("bad-requirement");
    return {
      id: requiredString(row, "id"),
      order: requiredNumber(row, "order"),
      title_en: requiredString(row, "title_en"),
      title_bn: requiredString(row, "title_bn"),
      mandatory: requiredBoolean(row, "mandatory"),
      has_expiry: requiredBoolean(row, "has_expiry"),
    };
  });

  requirements.sort((a, b) => a.order - b.order);

  return { tender, requirements };
}

export function errorKeyForParse(error) {
  const code = error instanceof Error ? error.message : "";
  if (code === "missing-tender" || code.startsWith("missing:tender") || code.startsWith("missing:title") || code.startsWith("missing:procuring") || code.startsWith("missing:bidder") || code.startsWith("missing:submission")) {
    return "errorMissingTender";
  }
  if (code === "bad-deadline") return "errorDeadline";
  if (code === "missing-requirements") return "errorMissingRequirements";
  if (code === "bad-requirement" || code.startsWith("missing:")) return "errorRequirementRow";
  return "errorRequirementsInvalid";
}
