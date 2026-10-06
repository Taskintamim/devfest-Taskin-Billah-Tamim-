import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Download, FileText, X } from "lucide-react";
import { localizeNumber } from "../lib/format";
import { t } from "../lib/i18n";
import { useApp } from "../state/AppContext";

const PHASES = [
  { id: "preparing", key: "generatingPreparing" },
  { id: "processing", key: "generatingProcessing" },
  { id: "finalizing", key: "generatingFinalizing" },
];

function phaseIndex(phase) {
  const index = PHASES.findIndex((item) => item.id === phase);
  return index;
}

export function GenerationProgress() {
  const { language, generation } = useApp();
  const busy = phaseIndex(generation.phase) >= 0;
  const current = Math.max(phaseIndex(generation.phase), 0);

  return (
    <AnimatePresence>
      {busy && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 p-4 backdrop-blur-[2px] sm:items-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[420px] rounded-[20px] border border-line bg-surface p-6 shadow-[0_20px_60px_rgba(28,25,23,0.18)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-seal">{t(language, "appName")}</p>
            <h2 className="mt-2 text-[20px] font-bold tracking-tight text-ink">{t(language, PHASES[current].key)}</h2>
            <ol className="mt-5 space-y-2.5">
              {PHASES.map((phase, index) => {
                const done = index < current;
                const active = index === current;
                return (
                  <li
                    key={phase.id}
                    className={`flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[13px] font-semibold ${
                      active ? "bg-seal-soft text-seal-dark" : done ? "text-ok" : "text-muted"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                        active ? "bg-seal text-white" : done ? "bg-ok-soft text-ok" : "bg-paper-2 text-muted"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                    </span>
                    {t(language, phase.key)}
                  </li>
                );
              })}
            </ol>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PackageReady() {
  const { language, generation, downloadPackage, dismissGeneration } = useApp();
  const result = generation.result;
  const open = generation.overlay && generation.phase === "success" && result;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-4 backdrop-blur-[2px] sm:items-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[460px] rounded-[22px] border border-line bg-surface p-6 shadow-[0_24px_70px_rgba(28,25,23,0.2)]"
            role="dialog"
            aria-labelledby="package-ready-title"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-ok-soft text-ok">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <button
                type="button"
                onClick={dismissGeneration}
                className="rounded-[8px] p-1.5 text-muted hover:bg-paper hover:text-ink"
                aria-label={t(language, "dismissPackage")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ok">{t(language, "packageReadyHeadline")}</p>
            <h2 id="package-ready-title" className="mt-1 text-[22px] font-bold tracking-tight text-ink">
              {t(language, "packageReady")}
            </h2>
            <dl className="mt-5 space-y-3 rounded-[16px] bg-paper px-4 py-4">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t(language, "packageLabel")}</dt>
                <dd className="mt-1 flex items-center gap-2 text-[14px] font-semibold text-ink">
                  <FileText className="h-4 w-4 text-seal" />
                  {result.filename}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t(language, "pagesLabel")}</dt>
                  <dd className="mt-1 text-[18px] font-bold tabular text-ink">{localizeNumber(result.pages, language)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t(language, "documentsLabel")}</dt>
                  <dd className="mt-1 text-[18px] font-bold tabular text-ink">{localizeNumber(result.documents, language)}</dd>
                </div>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t(language, "statusLabel")}</dt>
                <dd className="mt-1 text-[14px] font-semibold text-ok">{t(language, "readyForSubmission")}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={downloadPackage}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] bg-seal-dark px-4 py-2.5 text-[13px] font-semibold text-white"
              >
                <Download className="h-4 w-4" />
                {t(language, "downloadPackage")}
              </motion.button>
              <button
                type="button"
                onClick={dismissGeneration}
                className="inline-flex items-center justify-center rounded-[12px] px-4 py-2.5 text-[13px] font-semibold text-ink-soft hover:bg-paper"
              >
                {t(language, "dismissPackage")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
