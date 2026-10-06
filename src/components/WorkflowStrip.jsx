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
  const { language, tender, files, validation } = useApp();
  const matchedCount = Object.keys(validation.byRequirement || {}).filter(
    (id) => validation.byRequirement[id]?.file,
  ).length;

  let current = "understand";
  if (!tender) current = "understand";
  else if (files.length === 0) current = "upload";
  else if (!validation.ready) current = "fix";
  else current = "verify";

  return (
    <div className="border-b border-line/80 bg-surface">
      <div className="mx-auto flex max-w-[1440px] items-center gap-1 overflow-x-auto px-4 py-2.5 sm:px-6">
        {STEPS.map((step, index) => {
          const reached =
            (step.id === "understand" && Boolean(tender)) ||
            (step.id === "upload" && files.length > 0) ||
            (step.id === "fix" && matchedCount > 0) ||
            (step.id === "verify" && validation.ready);
          const isCurrent = step.id === current;
          return (
            <div key={step.id} className="flex items-center gap-1">
              {index > 0 && <div className="mx-1 h-px w-6 bg-line sm:w-10" />}
              <div
                className={`flex items-center gap-2 rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                  isCurrent ? "bg-ink text-white" : reached ? "bg-seal-soft text-seal-dark" : "text-muted"
                }`}
              >
                <span className="tabular text-[11px] opacity-70">{index + 1}</span>
                {t(language, step.labelKey)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
