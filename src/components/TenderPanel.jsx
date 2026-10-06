import { AnimatePresence, motion } from "framer-motion";
import { Building2, CalendarDays, FileJson, UserRound } from "lucide-react";
import { useRef } from "react";
import { formatDeadline, localizeNumber, padOrder, requirementTitle } from "../lib/format";
import { t } from "../lib/i18n";
import { useApp } from "../state/AppContext";
import { StatusBadge } from "./ui";

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
  const { language, tender, requirements, loadRequirementsFile } = useApp();
  const inputRef = useRef(null);

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
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <h3 className="text-[14px] font-semibold text-ink">{t(language, "documentSchedule")}</h3>
                <span className="text-[12px] font-medium text-muted">
                  {t(language, "requirementCount", { n: localizeNumber(requirements.length, language) })}
                </span>
              </div>
              <ol className="scrollbar-thin min-h-0 flex-1 overflow-auto">
                {requirements.map((requirement, index) => (
                  <motion.li
                    key={requirement.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.24), duration: 0.22 }}
                    className="flex flex-wrap items-start gap-x-4 gap-y-2 border-b border-line/70 px-5 py-3.5 last:border-b-0 sm:items-center"
                  >
                    <span className="tabular w-8 shrink-0 pt-0.5 text-[13px] font-bold text-muted sm:pt-0">
                      {localizeNumber(padOrder(requirement.order), language)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-ink">{requirementTitle(requirement, language)}</p>
                      <p className="mt-0.5 text-[11px] text-muted">{requirement.id}</p>
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:justify-end">
                      <StatusBadge tone={requirement.mandatory ? "danger" : "muted"}>
                        {t(language, requirement.mandatory ? "mandatory" : "optional")}
                      </StatusBadge>
                      <StatusBadge tone={requirement.has_expiry ? "warn" : "muted"}>
                        {t(language, requirement.has_expiry ? "expiryRequired" : "noExpiry")}
                      </StatusBadge>
                    </div>
                  </motion.li>
                ))}
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
