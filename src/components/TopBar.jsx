import { motion } from "framer-motion";
import { FileJson } from "lucide-react";
import { useRef } from "react";
import { t, tCount } from "../lib/i18n";
import { useApp } from "../state/AppContext";
import { LanguageSwitch, SealMark, StatusBadge } from "./ui";

function readiness(app) {
  const { language, tender, validation, generation } = app;
  if (generation.phase === "success") return { label: t(language, "packageReadyHeadline"), tone: "ok" };
  if (["preparing", "processing", "finalizing"].includes(generation.phase)) {
    return { label: t(language, "generatingProcessing"), tone: "seal" };
  }
  if (generation.phase === "error") return { label: t(language, "generationFailed"), tone: "danger" };
  if (!tender) return { label: t(language, "awaitingTender"), tone: "muted" };
  if (validation.ready) return { label: t(language, "packageReady"), tone: "ok" };
  if (validation.blockers.length > 0) {
    return {
      label: tCount(language, "issuesBlocking", validation.blockers.length),
      tone: "danger",
    };
  }
  return { label: t(language, "awaitingFiles"), tone: "seal" };
}

export function TopBar() {
  const app = useApp();
  const { language, tender, loadRequirementsFile } = app;
  const inputRef = useRef(null);
  const ready = readiness(app);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-[64px] max-w-[1440px] items-center gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <SealMark className="h-8 w-8 shrink-0" />
          <div className="min-w-0">
            <p className="text-[15px] font-bold tracking-tight text-ink">{t(language, "appName")}</p>
            <p className="hidden text-[11px] font-medium text-muted sm:block">{t(language, "appTag")}</p>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
          {tender ? (
            <div className="max-w-[560px] truncate rounded-full bg-paper px-4 py-1.5 text-[13px] text-ink-soft ring-1 ring-line">
              <span className="font-semibold text-ink">{tender.tender_id}</span>
              <span className="mx-2 text-line-strong">·</span>
              <span>{tender.title}</span>
            </div>
          ) : (
            <div className="text-[13px] text-muted">{t(language, "awaitingTender")}</div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <StatusBadge tone={ready.tone}>{ready.label}</StatusBadge>
          <LanguageSwitch />
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-[10px] bg-ink px-3 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-ink-soft"
          >
            <FileJson className="h-4 w-4" />
            <span className="hidden sm:inline">{tender ? t(language, "changeTender") : t(language, "openTender")}</span>
          </motion.button>
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
      </div>
    </header>
  );
}
