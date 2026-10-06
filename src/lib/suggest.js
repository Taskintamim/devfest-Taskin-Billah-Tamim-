import { requirementTitle } from "./format";

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[()]/g, " ")
    .replace(/[^a-z0-9\u0980-\u09ff]+/g, " ")
    .trim();
}

function expand(token) {
  if (token === "cert" || token === "certificate" || token === "সনদ") return ["cert", "certificate", "সনদ"];
  if (token === "auth" || token === "authorization" || token === "authorisation") return ["auth", "authorization", "authorisation", "অনুমোদন"];
  if (token === "vat" || token === "ভ্যাট") return ["vat", "ভ্যাট"];
  if (token === "tin" || token === "টিআইএন") return ["tin", "টিআইএন"];
  if (token === "financial" || token === "আর্থিক") return ["financial", "আর্থিক"];
  if (token === "technical" || token === "কারিগরি") return ["technical", "কারিগরি"];
  if (token === "trade" || token === "ট্রেড") return ["trade", "ট্রেড"];
  if (token === "license" || token === "licence" || token === "লাইসেন্স") return ["license", "licence", "লাইসেন্স"];
  if (token === "solvency" || token === "সচ্ছলতা") return ["solvency", "সচ্ছলতা"];
  if (token === "experience" || token === "অভিজ্ঞতা") return ["experience", "অভিজ্ঞতা"];
  if (token === "declaration" || token === "ঘোষণা") return ["declaration", "ঘোষণা", "signed"];
  if (token === "manufacturer" || token === "প্রস্তুতকারক") return ["manufacturer", "manufacturers", "প্রস্তুতকারক"];
  if (token === "proposal" || token === "প্রস্তাব") return ["proposal", "প্রস্তাব"];
  if (token === "audited" || token === "নিরীক্ষিত") return ["audited", "নিরীক্ষিত"];
  return [token];
}

function tokens(text) {
  return normalize(text)
    .split(/\s+/)
    .filter((token) => token.length > 2 && !/^\d+$/.test(token))
    .flatMap(expand);
}

function scoreAgainst(fileTokens, title) {
  const titleTokens = [...new Set(tokens(title))];
  if (titleTokens.length === 0) return 0;
  let hits = 0;
  for (const token of titleTokens) {
    if (fileTokens.has(token) || [...fileTokens].some((item) => item.includes(token) || token.includes(item))) {
      hits += 1;
    }
  }
  const ratio = hits / titleTokens.length;
  if (hits < 1 || ratio < 0.34) return 0;
  return hits * 10 + ratio * 5;
}

function scoreFile(file, requirement) {
  const fileTokens = new Set(tokens(file.name));
  if (fileTokens.size === 0) return 0;
  return Math.max(scoreAgainst(fileTokens, requirement.title_en), scoreAgainst(fileTokens, requirement.title_bn));
}

export function buildSuggestions({ files, requirements, matches, matchedHashes }) {
  const usedFileIds = new Set(Object.values(matches));
  const matchedReqs = new Set(Object.keys(matches));
  const available = files.filter((file) => file.status === "ready" && file.hash && !usedFileIds.has(file.id) && !matchedHashes.has(file.hash));
  const openReqs = requirements.filter((requirement) => !matchedReqs.has(requirement.id));

  const ranked = [];
  for (const requirement of openReqs) {
    let best = null;
    for (const file of available) {
      const score = scoreFile(file, requirement);
      if (score > 0 && (!best || score > best.score)) {
        best = { requirementId: requirement.id, fileId: file.id, fileName: file.name, score, requirement };
      }
    }
    if (best) ranked.push(best);
  }

  ranked.sort((a, b) => b.score - a.score);
  const claimedFiles = new Set();
  const claimedReqs = new Set();
  const unique = [];
  for (const item of ranked) {
    if (claimedFiles.has(item.fileId) || claimedReqs.has(item.requirementId)) continue;
    claimedFiles.add(item.fileId);
    claimedReqs.add(item.requirementId);
    unique.push(item);
  }
  return unique;
}

export function suggestionForRequirement(suggestions, requirementId) {
  return suggestions.find((item) => item.requirementId === requirementId) || null;
}

export function suggestionLabel(suggestion, language) {
  if (!suggestion) return "";
  return `${suggestion.fileName} → ${requirementTitle(suggestion.requirement, language)}`;
}
