import { motion } from "framer-motion";
import { t } from "../lib/i18n";
import { useApp } from "../state/AppContext";

const STEPS = [
  { id: "upload", labelKey: "stepUpload" },
  { id: "understand", labelKey: "stepUnderstand" },
  { id: "fix", labelKey: "stepFix" },
  { id: "verify", labelKey: "stepVerify" },
  { id: "generate", labelKey: "stepGenerate" },
];

export function WorkflowStrip() {
  const { language, tender, files, validation, generation } = useApp();
  const matchedCount = Object.keys(validation.byRequirement || {}).filter(
    (id) => validation.byRequirement[id]?.file,
  ).length;
  const generated = generation.phase === "success";
  const busy = ["preparing", "processing", "finalizing"].includes(generation.phase);

  let current = "understand";
  if (!tender) current = "understand";
  else if (files.length === 0) current = "upload";
  else if (busy || generated || validation.ready) current = "generate";
  else if (!validation.ready) current = "fix";

  return (
    <div className="border-b border-line/80 bg-surface">
      <div className="mx-auto flex max-w-[1440px] items-center gap-1 overflow-x-auto px-4 py-2.5 sm:px-6">
        {STEPS.map((step, index) => {
          const reached =
            (step.id === "understand" && Boolean(tender)) ||
            (step.id === "upload" && files.length > 0) ||
            (step.id === "fix" && matchedCount > 0) ||
            (step.id === "verify" && validation.ready) ||
            (step.id === "generate" && generated);
          const isCurrent = step.id === current;
          return (
            <div key={step.id} className="flex items-center gap-1">
              {index > 0 && <div className="mx-1 h-px w-6 bg-line sm:w-10" />}
              <motion.div
                layout
                className={`flex items-center gap-2 rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                  isCurrent ? "bg-ink text-white" : reached ? "bg-seal-soft text-seal-dark" : "text-muted"
                }`}
                transition={{ duration: 0.18 }}
              >
                <span className="tabular text-[11px] opacity-70">{index + 1}</span>
                {t(language, step.labelKey)}
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
