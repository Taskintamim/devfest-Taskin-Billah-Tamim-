import { motion } from "framer-motion";
import { Copy, Search, ShieldOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatBytes, localizeNumber, requirementTitle } from "../lib/format";
import { t } from "../lib/i18n";
import { useApp } from "../state/AppContext";

export function FilePicker({ requirementId, onClose }) {
  const { language, files, matches, requirements, duplicates, matchFile } = useApp();
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    function onPointer(event) {
      if (!rootRef.current?.contains(event.target)) onClose();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [onClose]);

  const currentFileId = matches[requirementId];
  const q = query.trim().toLowerCase();
  const rows = files
    .filter((file) => !q || file.name.toLowerCase().includes(q))
    .map((file) => {
      const matchedReqId = Object.entries(matches).find(([, id]) => id === file.id)?.[0];
      const matchedReq = requirements.find((item) => item.id === matchedReqId);
      const duplicate = duplicates[file.id];
      const siblingMatchedElsewhere = files.some((other) => {
        if (other.id === file.id || !other.hash || other.hash !== file.hash) return false;
        const otherReqId = Object.entries(matches).find(([, id]) => id === other.id)?.[0];
        return Boolean(otherReqId && otherReqId !== requirementId);
      });
      let disabled = false;
      let reason = "";
      if (file.status === "processing") {
        disabled = true;
        reason = t(language, "processingFileBlocked");
      } else if (file.status === "invalid") {
        disabled = true;
        reason = t(language, "invalidFileBlocked");
      } else if (siblingMatchedElsewhere) {
        disabled = true;
        reason = t(language, "duplicateBlocked", { name: duplicate?.otherName || file.name });
      }
      return { file, matchedReq, duplicate, disabled, reason, selected: file.id === currentFileId };
    });

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className="absolute z-30 mt-2 w-[min(420px,calc(100vw-48px))] overflow-hidden rounded-[14px] border border-line bg-surface shadow-[0_12px_40px_rgba(28,25,23,0.12)]"
      role="listbox"
      aria-label={t(language, "matchFile")}
    >
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <Search className="h-4 w-4 text-muted" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t(language, "searchFiles")}
          className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
          aria-label={t(language, "searchFiles")}
        />
      </div>
      <div className="scrollbar-thin max-h-[280px] overflow-auto p-1.5">
        {files.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12px] text-muted">{t(language, "uploadToMatch")}</p>
        ) : rows.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12px] text-muted">{t(language, "noMatchingFiles")}</p>
        ) : (
          rows.map(({ file, matchedReq, duplicate, disabled, reason, selected }) => (
            <button
              key={file.id}
              type="button"
              role="option"
              aria-selected={selected}
              disabled={disabled}
              aria-disabled={disabled}
              onClick={() => {
                if (matchFile(requirementId, file.id)) onClose();
              }}
              className={`flex w-full items-start gap-2 rounded-[10px] px-2.5 py-2 text-left transition ${
                selected ? "bg-seal-soft" : "hover:bg-paper"
              } ${disabled ? "cursor-not-allowed opacity-55" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{file.name}</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {file.pageCount != null
                    ? `${localizeNumber(file.pageCount, language)} ${t(language, file.pageCount === 1 ? "page" : "pages")}`
                    : t(language, "pageCountUnknown")}
                  <span className="mx-1">·</span>
                  {formatBytes(file.size, language)}
                </p>
                {matchedReq && !selected && (
                  <p className="mt-1 text-[11px] text-seal-dark">
                    {t(language, "alreadyMatchedTo", { name: requirementTitle(matchedReq, language) })}
                  </p>
                )}
                {disabled && reason && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-dup">
                    {duplicate ? <Copy className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
                    {reason}
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </motion.div>
  );
}
