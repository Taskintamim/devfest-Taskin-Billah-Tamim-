import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { localizeNumber, requirementTitle } from "../lib/format";
import { t } from "../lib/i18n";
import { useApp } from "../state/AppContext";

export function ActionBar() {
  const { language, tender, files, validation, duplicates, matches, requestGenerate } = useApp();
  const ready = validation.ready;
  const n = validation.blockers.length;
  const matchedIds = new Set(Object.values(matches));
  const unusedDups = Object.keys(duplicates).filter((id) => !matchedIds.has(id)).length;

  let title = t(language, "packageNotReady");
  let body = t(language, "loadTenderFirst");
  if (tender && files.length === 0) {
    body = t(language, "addFilesNext");
  } else if (tender && ready) {
    title = t(language, "packageReady");
    body = t(language, "packageReadyBody");
  } else if (tender && n > 0) {
    title = t(language, "issuesBlocking", { n: localizeNumber(n, language) });
    const first = validation.blockers.slice(0, 2).map((item) => requirementTitle(item.requirement, language));
    const extra = n > 2 ? ` +${localizeNumber(n - 2, language)}` : "";
    body = first.length ? `${first.join(" · ")}${extra}` : t(language, "reviewMatches");
  } else if (tender) {
    body = t(language, "reviewMatches");
  }

  return (
    <footer className="sticky bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
            {ready ? <CheckCircle2 className="h-4 w-4 text-ok" /> : <AlertTriangle className="h-4 w-4 text-warn" />}
            {title}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-muted">{body}</p>
          {!ready && n > 0 && (
            <p className="mt-1 hidden text-[11px] text-muted lg:block">
              {[
                validation.counts.missing > 0 && t(language, "blockingMissing", { n: localizeNumber(validation.counts.missing, language) }),
                validation.counts.expiry_needed > 0 && t(language, "blockingExpiry", { n: localizeNumber(validation.counts.expiry_needed, language) }),
                validation.counts.expired > 0 && t(language, "blockingExpired", { n: localizeNumber(validation.counts.expired, language) }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>

        {unusedDups > 0 && (
          <div className="inline-flex items-center rounded-[10px] bg-dup-soft px-3 py-2 text-[12px] font-semibold text-dup">
            {t(language, "unusedDuplicates", { n: localizeNumber(unusedDups, language) })}
          </div>
        )}

        <motion.button
          type="button"
          disabled={!ready}
          whileTap={ready ? { scale: 0.98 } : undefined}
          onClick={() => ready && requestGenerate()}
          className={`inline-flex items-center justify-center rounded-[10px] px-4 py-2.5 text-[13px] font-semibold text-white transition ${
            ready ? "bg-seal-dark shadow-sm hover:bg-seal" : "cursor-not-allowed bg-ink/30"
          }`}
          title={
            ready
              ? t(language, "generateReadyCta")
              : t(language, "resolveThenGenerate", { n: localizeNumber(Math.max(n, 1), language) })
          }
        >
          {ready ? t(language, "generateReadyCta") : t(language, "generatePackage")}
        </motion.button>
      </div>
    </footer>
  );
}
