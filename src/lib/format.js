const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

const MONTHS_EN = [
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

const MONTHS_BN = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

export function localizeNumber(value, lang) {
  const text = String(value);
  if (lang !== "bn") return text;
  return text.replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

export function padOrder(order) {
  return String(order).padStart(2, "0");
}

export function formatBytes(bytes, lang = "en") {
  if (!Number.isFinite(bytes) || bytes < 0) return lang === "bn" ? "০ বাইট" : "0 B";
  const units = lang === "bn" ? ["বাইট", "কেবি", "এমবি"] : ["B", "KB", "MB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  const digits = unit === 0 ? 0 : size >= 10 ? 1 : 2;
  const n = size.toFixed(digits);
  return `${localizeNumber(n, lang)} ${units[unit]}`;
}

export function formatDeadline(iso, lang) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!match) return iso || "—";
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (lang === "bn") {
    return `${localizeNumber(day, "bn")} ${MONTHS_BN[month - 1]} ${localizeNumber(year, "bn")}`;
  }
  return `${day} ${MONTHS_EN[month - 1]} ${year}`;
}

export function requirementTitle(requirement, lang) {
  if (!requirement) return "";
  return lang === "bn" ? requirement.title_bn : requirement.title_en;
}
