import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Download, LoaderCircle } from "lucide-react";
import { localizeNumber, requirementTitle } from "../lib/format";
import { t } from "../lib/i18n";
import { useApp } from "../state/AppContext";

function generatingLabel(language, phase) {
  if (phase === "preparing") return t(language, "generatingPreparing");
  if (phase === "processing") return t(language, "generatingProcessing");
  if (phase === "finalizing") return t(language, "generatingFinalizing");
  return t(language, "generateReadyCta");
}

export function ActionBar() {
  const { language, tender, files, validation, duplicates, matches, generation, requestGenerate, downloadPackage } =
    useApp();
  const ready = validation.ready;
  const n = validation.blockers.length;
  const matchedIds = new Set(Object.values(matches));
  const unusedDups = Object.keys(duplicates).filter((id) => !matchedIds.has(id)).length;
  const busy = ["preparing", "processing", "finalizing"].includes(generation.phase);
  const success = generation.phase === "success" && generation.result;
  const failed = generation.phase === "error";

  let title = t(language, "packageNotReady");
  let body = t(language, "loadTenderFirst");
  if (failed) {
    title = t(language, "generationFailed");
    body = generation.error || t(language, "generationFailedBody");
  } else if (busy) {
    title = generatingLabel(language, generation.phase);
    body = t(language, "generatingInProgress");
  } else if (success) {
    title = t(language, "packageReadyHeadline");
    body = `${generation.result.filename} · ${t(language, "pagesLabel")} ${localizeNumber(generation.result.pages, language)}`;
  } else if (tender && files.length === 0) {
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

  const enabled = (ready && !busy) || failed;
  const canDownload = Boolean(success);

  return (
    <footer className="sticky bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
            {failed ? (
              <AlertTriangle className="h-4 w-4 text-danger" />
            ) : busy ? (
              <LoaderCircle className="h-4 w-4 animate-spin text-seal" />
            ) : ready || success ? (
              <CheckCircle2 className="h-4 w-4 text-ok" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-warn" />
            )}
            {title}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-muted">{body}</p>
          {!ready && !busy && n > 0 && (
            <p className="mt-1 hidden text-[11px] text-muted lg:block">
              {[
                validation.counts.missing > 0 &&
                  t(language, "blockingMissing", { n: localizeNumber(validation.counts.missing, language) }),
                validation.counts.expiry_needed > 0 &&
                  t(language, "blockingExpiry", { n: localizeNumber(validation.counts.expiry_needed, language) }),
                validation.counts.expired > 0 &&
                  t(language, "blockingExpired", { n: localizeNumber(validation.counts.expired, language) }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>

        {unusedDups > 0 && !busy && (
          <div className="inline-flex items-center rounded-[10px] bg-dup-soft px-3 py-2 text-[12px] font-semibold text-dup">
            {t(language, "unusedDuplicates", { n: localizeNumber(unusedDups, language) })}
          </div>
        )}

        {canDownload && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={downloadPackage}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-paper px-4 py-2.5 text-[13px] font-semibold text-ink ring-1 ring-line"
          >
            <Download className="h-4 w-4" />
            {t(language, "downloadAgain")}
          </motion.button>
        )}

        <motion.button
          type="button"
          disabled={!enabled}
          whileTap={enabled ? { scale: 0.98 } : undefined}
          animate={ready && !busy && !success ? { boxShadow: "0 0 0 4px rgba(15,118,110,0.12)" } : { boxShadow: "0 0 0 0px rgba(15,118,110,0)" }}
          onClick={() => enabled && requestGenerate()}
          className={`inline-flex items-center justify-center rounded-[10px] px-4 py-2.5 text-[13px] font-semibold text-white transition ${
            enabled ? "bg-seal-dark shadow-sm hover:bg-seal" : "cursor-not-allowed bg-ink/30"
          }`}
          title={
            busy
              ? t(language, "generatingInProgress")
              : ready || failed
                ? t(language, failed ? "retryGenerate" : "generateReadyCta")
                : t(language, "resolveThenGenerate", { n: localizeNumber(Math.max(n, 1), language) })
          }
        >
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              {generatingLabel(language, generation.phase)}
            </span>
          ) : failed ? (
            t(language, "retryGenerate")
          ) : ready ? (
            t(language, "generateReadyCta")
          ) : (
            t(language, "generatePackage")
          )}
        </motion.button>
      </div>
    </footer>
  );
}
