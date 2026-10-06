import { AnimatePresence, motion } from "framer-motion";
import { Building2, CalendarDays, FileJson, Sparkles, UserRound } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { formatDeadline, localizeNumber } from "../lib/format";
import { t } from "../lib/i18n";
import { BLOCKING_STATUSES, STATUS } from "../lib/status";
import { useApp } from "../state/AppContext";
import { RequirementRow } from "./RequirementRow";

function MetaCell({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="truncate text-[14px] font-semibold text-ink">{value}</p>
    </div>
  );
}

export function TenderPanel() {
  const { language, tender, requirements, loadRequirementsFile, validation, suggestions, applySuggestions, files } = useApp();
  const inputRef = useRef(null);
  const [filter, setFilter] = useState("all");

  const visible = useMemo(() => {
    if (filter === "blocking") {
      return requirements.filter((requirement) => BLOCKING_STATUSES.has(validation.byRequirement[requirement.id]?.status));
    }
    if (filter === "ready") {
      return requirements.filter((requirement) => {
        const status = validation.byRequirement[requirement.id]?.status;
        return status === STATUS.OK || status === STATUS.NOT_PROVIDED;
      });
    }
    return requirements;
  }, [filter, requirements, validation]);

  const filters = [
    { id: "all", label: t(language, "filterAll") },
    { id: "blocking", label: t(language, "filterBlocking") },
    { id: "ready", label: t(language, "filterReady") },
  ];

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <AnimatePresence mode="wait">
        {!tender ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 items-center justify-center p-4 sm:p-8"
          >
            <div className="w-full max-w-[460px] rounded-[18px] border border-dashed border-line-strong bg-surface px-8 py-12 text-center shadow-[0_1px_0_rgba(28,25,23,0.04)]">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-paper-2 text-seal">
                <FileJson className="h-6 w-6" />
              </div>
              <h2 className="text-[22px] font-bold tracking-tight text-ink">{t(language, "emptyTenderTitle")}</h2>
              <p className="mt-2 text-[14px] leading-6 text-ink-soft">{t(language, "emptyTenderBody")}</p>
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => inputRef.current?.click()}
                className="mt-6 inline-flex items-center justify-center rounded-[10px] bg-ink px-4 py-2.5 text-[13px] font-semibold text-white"
              >
                {t(language, "loadRequirements")}
              </motion.button>
              <p className="mt-3 text-[12px] text-muted">{t(language, "emptyTenderHint")}</p>
              <input
                ref={inputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) loadRequirementsFile(file);
                  event.target.value = "";
                }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={tender.tender_id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6"
          >
            <div className="rounded-[16px] border border-line bg-surface p-5 shadow-[0_1px_0_rgba(28,25,23,0.03)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{tender.tender_id}</p>
              <h2 className="mt-1 text-[22px] font-bold tracking-tight text-ink">{tender.title}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <MetaCell icon={Building2} label={t(language, "procuringEntity")} value={tender.procuring_entity} />
                <MetaCell icon={UserRound} label={t(language, "bidder")} value={tender.bidder} />
                <MetaCell icon={CalendarDays} label={t(language, "deadline")} value={formatDeadline(tender.submission_deadline, language)} />
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border border-line bg-surface">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
                <div>
                  <h3 className="text-[14px] font-semibold text-ink">{t(language, "documentSchedule")}</h3>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {t(language, "requirementCount", { n: localizeNumber(requirements.length, language) })}
                    {validation.blockers.length > 0
                      ? ` · ${t(language, "blockingSummary", { n: localizeNumber(validation.blockers.length, language) })}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {suggestions.length > 0 && files.length > 0 && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => applySuggestions(suggestions)}
                      className="inline-flex items-center gap-1.5 rounded-[10px] bg-seal-soft px-3 py-1.5 text-[12px] font-semibold text-seal-dark"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {t(language, "applySuggestions", { n: localizeNumber(suggestions.length, language) })}
                    </motion.button>
                  )}
                  <div className="relative flex rounded-[10px] bg-paper-2 p-0.5 ring-1 ring-line">
                    {filters.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFilter(item.id)}
                        className={`relative z-10 rounded-[8px] px-2.5 py-1 text-[11px] font-semibold ${
                          filter === item.id ? "text-white" : "text-ink-soft"
                        }`}
                      >
                        {filter === item.id && (
                          <motion.span
                            layoutId="req-filter"
                            className="absolute inset-0 -z-10 rounded-[8px] bg-ink"
                            transition={{ type: "spring", stiffness: 480, damping: 36 }}
                          />
                        )}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <ol className="scrollbar-thin min-h-0 flex-1 overflow-auto">
                <AnimatePresence initial={false}>
                  {visible.map((requirement, index) => (
                    <RequirementRow key={requirement.id} requirement={requirement} index={index} />
                  ))}
                </AnimatePresence>
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
