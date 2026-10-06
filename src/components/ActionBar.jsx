import { motion } from "framer-motion";
import { AlertTriangle, FileCheck2 } from "lucide-react";
import { localizeNumber } from "../lib/format";
import { t } from "../lib/i18n";
import { useApp } from "../state/AppContext";

export function ActionBar() {
  const { language, tender, files, duplicates } = useApp();
  const dupCount = Object.keys(duplicates).length;
  const invalid = files.filter((file) => file.status === "invalid").length;
  const attention = dupCount + invalid;

  let summary = t(language, "loadTenderFirst");
  if (tender && files.length === 0) summary = t(language, "addFilesNext");
  else if (tender && files.length > 0) summary = t(language, "reviewFiles");

  return (
    <footer className="sticky bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
            <FileCheck2 className="h-4 w-4 text-seal" />
            {t(language, "packageNotReady")}
          </p>
          <p className="mt-0.5 text-[12px] text-muted">{summary}</p>
        </div>

        {attention > 0 && (
          <div className="inline-flex items-center gap-2 rounded-[10px] bg-warn-soft px-3 py-2 text-[12px] font-semibold text-warn">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t(language, "blockingSummary", { n: localizeNumber(attention, language) })}
          </div>
        )}

        <motion.button
          type="button"
          disabled
          whileTap={{ scale: 0.99 }}
          className="inline-flex cursor-not-allowed items-center justify-center rounded-[10px] bg-ink/30 px-4 py-2.5 text-[13px] font-semibold text-white"
          title={t(language, "generateSoon")}
        >
          {t(language, "generatePackage")}
        </motion.button>
      </div>
    </footer>
  );
}
