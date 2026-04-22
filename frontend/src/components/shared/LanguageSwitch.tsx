import type { AppLanguage } from "../../lib/i18n";

interface LanguageSwitchProps {
  language: AppLanguage;
  onChange: (language: AppLanguage) => void;
}

export function LanguageSwitch({ language, onChange }: LanguageSwitchProps) {
  const nextLanguage = language === "zh" ? "en" : "zh";
  const title = language === "zh" ? "切换到英文" : "Switch to Chinese";

  return (
    <button
      type="button"
      onClick={() => onChange(nextLanguage)}
      aria-label={title}
      aria-pressed={language === "zh"}
      title={title}
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-sm font-medium transition hover:-translate-y-0.5"
    >
      <span className={`rounded-full px-2 py-1 transition ${language === "zh" ? "bg-gradient-to-r from-emerald-200 to-sky-300 text-slate-950" : "text-white/55"}`}>中</span>
      <span className="text-white/45">+</span>
      <span className={`rounded-full px-2 py-1 transition ${language === "en" ? "bg-gradient-to-r from-emerald-200 to-sky-300 text-slate-950" : "text-white/55"}`}>En</span>
    </button>
  );
}
