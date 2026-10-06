import { AnimatePresence, motion } from "framer-motion";
import { Copy, FileText, LoaderCircle, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { formatBytes, localizeNumber, requirementTitle } from "../lib/format";
import { t } from "../lib/i18n";
import { useApp } from "../state/AppContext";
import { StatusBadge } from "./ui";

function FileCard({ file, duplicate, language, onRemove, matchedRequirement, selected }) {
  const pages = file.pageCount;
  const pageLabel =
    pages == null
      ? t(language, "pageCountUnknown")
      : `${localizeNumber(pages, language)} ${t(language, pages === 1 ? "page" : "pages")}`;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-[14px] border bg-surface p-3.5 ${
        selected ? "border-seal ring-1 ring-seal/30" : "border-line"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
            file.status === "invalid"
              ? "bg-danger-soft text-danger"
              : duplicate
                ? "bg-dup-soft text-dup"
                : "bg-paper-2 text-seal"
          }`}
        >
          {file.status === "processing" ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : (
            <FileText className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink" title={file.name}>
            {file.name}
          </p>
          <p className="mt-0.5 text-[12px] text-muted">
            {file.status === "processing" ? t(language, "processing") : pageLabel}
            <span className="mx-1.5 text-line-strong">·</span>
            {formatBytes(file.size, language)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {file.status === "processing" && <StatusBadge tone="seal">{t(language, "processing")}</StatusBadge>}
            {file.status === "ready" && !duplicate && !matchedRequirement && (
              <StatusBadge tone="muted">{t(language, "unmatched")}</StatusBadge>
            )}
            {matchedRequirement && <StatusBadge tone="ok">{t(language, "matched")}</StatusBadge>}
            {file.status === "invalid" && <StatusBadge tone="danger">{t(language, "invalid")}</StatusBadge>}
            {duplicate && (
              <StatusBadge tone="dup">
                <Copy className="h-3 w-3" />
                {t(language, "exactDuplicate")}
              </StatusBadge>
            )}
          </div>
          {matchedRequirement && (
            <p className="mt-2 text-[12px] leading-5 text-seal-dark">
              {t(language, "matchedTo", { name: matchedRequirement })}
            </p>
          )}
          {file.status === "invalid" && (
            <p className="mt-2 text-[12px] leading-5 text-danger">{t(language, "errorUnreadablePdf")}</p>
          )}
          {duplicate && (
            <p className="mt-2 text-[12px] leading-5 text-dup">
              {duplicate.nameDiffers
                ? t(language, "duplicateOf", { name: duplicate.otherName })
                : t(language, "duplicateCopies", { n: localizeNumber(duplicate.count, language) })}
            </p>
          )}
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => onRemove(file.id)}
          className="rounded-[8px] p-1.5 text-muted transition hover:bg-danger-soft hover:text-danger"
          aria-label={t(language, "removeFile")}
        >
          <Trash2 className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.li>
  );
}

export function FilePanel() {
  const { language, files, duplicates, addFiles, removeFile, clearFiles, matches, requirements } = useApp();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const matchedByFile = useMemo(() => {
    const map = {};
    for (const [requirementId, fileId] of Object.entries(matches)) {
      const requirement = requirements.find((item) => item.id === requirementId);
      if (requirement) map[fileId] = requirementTitle(requirement, language);
    }
    return map;
  }, [matches, requirements, language]);

  const stats = useMemo(() => {
    const pages = files.reduce((sum, file) => sum + (file.pageCount || 0), 0);
    const size = files.reduce((sum, file) => sum + file.size, 0);
    const dupCount = Object.keys(duplicates).length;
    const invalid = files.filter((file) => file.status === "invalid").length;
    return { pages, size, dupCount, invalid };
  }, [files, duplicates]);

  function onDrop(event) {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  }

  return (
    <aside className="flex min-h-0 w-full flex-col border-t border-line bg-surface-2 lg:w-[400px] lg:border-t-0 lg:border-l xl:w-[440px]">
      <div className="flex items-start justify-between gap-3 px-5 py-4">
        <div>
          <h2 className="text-[14px] font-semibold text-ink">{t(language, "filesTitle")}</h2>
          <p className="mt-1 max-w-[280px] text-[12px] leading-5 text-muted">{t(language, "filesSubtitle")}</p>
        </div>
        {files.length > 0 && (
          <button
            type="button"
            onClick={clearFiles}
            className="text-[12px] font-semibold text-muted transition hover:text-danger"
          >
            {t(language, "removeAll")}
          </button>
        )}
      </div>

      <div className="px-5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex w-full flex-col items-center rounded-[16px] border border-dashed px-4 py-7 text-center transition ${
            dragging ? "border-seal bg-seal-soft/60" : "border-line-strong bg-surface hover:border-seal/50"
          }`}
        >
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-[12px] bg-paper-2 text-seal">
            <Upload className="h-5 w-5" />
          </span>
          <span className="text-[14px] font-semibold text-ink">{t(language, "dropTitle")}</span>
          <span className="mt-1 text-[12px] text-muted">{t(language, "dropBody")}</span>
          <span className="mt-3 text-[11px] font-medium text-muted">{t(language, "dropRules")}</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 px-5 text-[11px] font-semibold text-muted">
          <span className="rounded-full bg-surface px-2.5 py-1 ring-1 ring-line">
            {t(language, "fileStats", {
              files: localizeNumber(files.length, language),
              pages: localizeNumber(stats.pages, language),
              size: formatBytes(stats.size, language),
            })}
          </span>
          <span className="rounded-full bg-surface px-2.5 py-1 ring-1 ring-line">
            {t(language, "sizeUsed", { used: formatBytes(stats.size, language) })}
          </span>
          {stats.dupCount > 0 && (
            <span className="rounded-full bg-dup-soft px-2.5 py-1 text-dup">
              {t(language, "duplicatesStat", { n: localizeNumber(stats.dupCount, language) })}
            </span>
          )}
          {stats.invalid > 0 && (
            <span className="rounded-full bg-danger-soft px-2.5 py-1 text-danger">
              {t(language, "invalidStat", { n: localizeNumber(stats.invalid, language) })}
            </span>
          )}
        </div>
      )}

      <div className="scrollbar-thin mt-4 min-h-0 flex-1 overflow-auto px-5 pb-5">
        <AnimatePresence initial={false}>
          {files.length === 0 ? (
            <motion.div
              key="empty-files"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[16px] border border-line bg-surface px-5 py-8 text-center"
            >
              <p className="text-[14px] font-semibold text-ink">{t(language, "noFilesTitle")}</p>
              <p className="mt-1 text-[12px] leading-5 text-muted">{t(language, "noFilesBody")}</p>
            </motion.div>
          ) : (
            <ul className="space-y-2.5">
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  duplicate={duplicates[file.id]}
                  language={language}
                  onRemove={removeFile}
                  matchedRequirement={matchedByFile[file.id]}
                  selected={Boolean(matchedByFile[file.id])}
                />
              ))}
            </ul>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
