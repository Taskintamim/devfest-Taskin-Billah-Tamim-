import { motion } from "framer-motion";
import { t } from "../lib/i18n";
import { useApp } from "../state/AppContext";

export function SealMark({ className = "h-8 w-8" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#1C1917" />
      <rect x="7" y="6" width="14" height="18" rx="1.5" fill="#F3F0E8" />
      <rect x="11" y="8" width="14" height="18" rx="1.5" fill="#0F766E" />
      <path d="M15 14.5h6M15 17.5h4" stroke="#F3F0E8" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function StatusBadge({ tone = "muted", children }) {
  const tones = {
    muted: "bg-surface-2 text-muted ring-line",
    seal: "bg-seal-soft text-seal-dark ring-seal/20",
    ok: "bg-ok-soft text-ok ring-ok/15",
    warn: "bg-warn-soft text-warn ring-warn/15",
    danger: "bg-danger-soft text-danger ring-danger/15",
    dup: "bg-dup-soft text-dup ring-dup/15",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[8px] px-2 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ${tones[tone] || tones.muted}`}
    >
      {children}
    </span>
  );
}

export function LanguageSwitch() {
  const { language, setLanguage } = useApp();
  const options = [
    { id: "en", label: "EN" },
    { id: "bn", label: "বাং" },
  ];

  return (
    <div
      role="group"
      aria-label={t(language, "language")}
      className="relative flex rounded-[10px] bg-paper-2 p-0.5 ring-1 ring-line"
    >
      {options.map((option) => {
        const active = language === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setLanguage(option.id)}
            className={`relative z-10 min-w-[44px] rounded-[8px] px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
              active ? "text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            {active && (
              <motion.span
                layoutId="lang-pill"
                className="absolute inset-0 -z-10 rounded-[8px] bg-ink shadow-sm"
                transition={{ type: "spring", stiffness: 520, damping: 38 }}
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
