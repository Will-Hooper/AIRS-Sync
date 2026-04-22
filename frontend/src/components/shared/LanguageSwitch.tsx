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
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-sm font-medium transition hover:-translate-y-0.5"
    >
      <span className={`relative inline-flex h-7 w-7 items-center justify-center rounded-full transition ${
        language === "zh"
          ? "bg-gradient-to-br from-emerald-200 to-sky-300 text-slate-950 shadow-[0_8px_22px_rgba(132,198,255,0.3)]"
          : "bg-white/6 text-white/80"
      }`}>
        <span className="absolute -left-1 top-0 text-[10px] font-semibold leading-none">中</span>
        <span className="absolute -right-1 bottom-0 text-[9px] font-semibold leading-none">En</span>
      </span>
    </button>
  );
}
