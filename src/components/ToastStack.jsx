import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { t } from "../lib/i18n";
import { useApp } from "../state/AppContext";

const toneClass = {
  danger: "bg-ink text-white ring-white/10",
  ok: "bg-seal-dark text-white ring-white/10",
  info: "bg-ink text-white ring-white/10",
};

export function ToastStack() {
  const { toasts, dismissToast, language } = useApp();

  return (
    <div className="pointer-events-none fixed top-[84px] right-4 z-50 flex w-[min(360px,calc(100vw-32px))] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={`pointer-events-auto flex items-start gap-3 rounded-[14px] px-3.5 py-3 text-[13px] leading-5 shadow-lg ring-1 ${toneClass[toast.tone] || toneClass.info}`}
          >
            <p className="flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="rounded-md p-0.5 text-white/70 transition hover:text-white"
              aria-label={t(language, "toastDismiss")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
