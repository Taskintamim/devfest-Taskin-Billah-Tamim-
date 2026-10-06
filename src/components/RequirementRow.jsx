import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CalendarClock, Check, FileSearch, Minus, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDeadline, localizeNumber, padOrder, requirementTitle } from "../lib/format";
import { t } from "../lib/i18n";
import { STATUS, statusHelpKey, statusLabelKey, statusTone } from "../lib/status";
import { suggestionForRequirement } from "../lib/suggest";
import { useApp } from "../state/AppContext";
import { FilePicker } from "./FilePicker";
import { StatusBadge } from "./ui";

const ICONS = {
  [STATUS.MISSING]: AlertCircle,
  [STATUS.EXPIRY_NEEDED]: CalendarClock,
  [STATUS.EXPIRED]: AlertCircle,
  [STATUS.NOT_PROVIDED]: Minus,
  [STATUS.OK]: Check,
};

export function RequirementRow({ requirement, index }) {
  const {
    language,
    tender,
    validation,
    suggestions,
    matchFile,
    unmatchFile,
    setExpiry,
  } = useApp();
  const [open, setOpen] = useState(false);
  const result = validation.byRequirement[requirement.id];
  const status = result?.status || (requirement.mandatory ? STATUS.MISSING : STATUS.NOT_PROVIDED);
  const file = result?.file || null;
  const expiry = result?.expiry || "";
  const suggestion = !file ? suggestionForRequirement(suggestions, requirement.id) : null;

  useEffect(() => {
    if (file) setOpen(false);
  }, [file]);
  const StatusIcon = ICONS[status];
  const tone = statusTone(status);
  const accent =
    status === STATUS.OK
      ? "border-l-ok"
      : status === STATUS.NOT_PROVIDED
        ? "border-l-line"
        : status === STATUS.EXPIRY_NEEDED
          ? "border-l-warn"
          : "border-l-danger";

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.18), duration: 0.2 }}
      className={`border-b border-line/70 border-l-2 px-5 py-4 last:border-b-0 ${accent}`}
    >
      <div className="flex flex-wrap items-start gap-3">
        <span className="tabular w-8 shrink-0 pt-0.5 text-[13px] font-bold text-muted">
          {localizeNumber(padOrder(requirement.order), language)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-ink">{requirementTitle(requirement, language)}</p>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                <StatusBadge tone={requirement.mandatory ? "danger" : "muted"}>
                  {t(language, requirement.mandatory ? "mandatory" : "optional")}
                </StatusBadge>
                <StatusBadge tone={requirement.has_expiry ? "warn" : "muted"}>
                  {t(language, requirement.has_expiry ? "expiryRequired" : "noExpiry")}
                </StatusBadge>
              </p>
            </div>
            <motion.div layoutId={`status-${requirement.id}`} className="shrink-0">
              <StatusBadge tone={tone}>
                <StatusIcon className="h-3 w-3" />
                {t(language, statusLabelKey(status))}
              </StatusBadge>
            </motion.div>
          </div>

          <p className="mt-2 text-[12px] leading-5 text-ink-soft">{t(language, statusHelpKey(status))}</p>

          <div className="relative mt-3">
            {file ? (
              <div className="flex flex-wrap items-center gap-2 rounded-[12px] bg-paper px-3 py-2 ring-1 ring-line">
                <p className="min-w-0 flex-1 truncate text-[12px] font-semibold text-ink" title={file.name}>
                  {t(language, "matched")}: {file.name}
                </p>
                <button
                  type="button"
                  onClick={() => setOpen((value) => !value)}
                  className="text-[12px] font-semibold text-seal-dark hover:underline"
                >
                  {t(language, "changeFile")}
                </button>
                <button
                  type="button"
                  onClick={() => unmatchFile(requirement.id)}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted hover:text-danger"
                  aria-label={t(language, "unmatchFile")}
                >
                  <X className="h-3.5 w-3.5" />
                  {t(language, "unmatchFile")}
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setOpen((value) => !value)}
                  className="inline-flex items-center gap-1.5 rounded-[10px] bg-ink px-3 py-1.5 text-[12px] font-semibold text-white"
                >
                  <FileSearch className="h-3.5 w-3.5" />
                  {t(language, "matchFile")}
                </motion.button>
                {suggestion && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => matchFile(requirement.id, suggestion.fileId)}
                    className="inline-flex items-center gap-1.5 rounded-[10px] bg-seal-soft px-3 py-1.5 text-[12px] font-semibold text-seal-dark"
                    title={t(language, "suggestionHint")}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {t(language, "useSuggestion", { name: suggestion.fileName })}
                  </motion.button>
                )}
              </div>
            )}
            <AnimatePresence>{open && <FilePicker requirementId={requirement.id} onClose={() => setOpen(false)} />}</AnimatePresence>
          </div>

          {requirement.has_expiry && file && (
            <div className="mt-3 max-w-[280px]">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted" htmlFor={`expiry-${requirement.id}`}>
                {t(language, "expiryDate")}
              </label>
              <input
                id={`expiry-${requirement.id}`}
                type="date"
                value={expiry}
                onChange={(event) => setExpiry(requirement.id, event.target.value)}
                className="mt-1 w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[13px] text-ink outline-none transition focus:border-seal"
              />
              <p className="mt-1 text-[11px] text-muted">
                {expiry && tender?.submission_deadline && expiry === tender.submission_deadline
                  ? t(language, "expiryOnDeadline")
                  : t(language, "expiryHelper")}
                {tender?.submission_deadline ? ` · ${formatDeadline(tender.submission_deadline, language)}` : ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.li>
  );
}
