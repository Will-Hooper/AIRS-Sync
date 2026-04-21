import type { AppLanguage } from "../../lib/i18n";

interface LanguageSwitchProps {
  language: AppLanguage;
  onChange: (language: AppLanguage) => void;
}

export function LanguageSwitch({ language, onChange }: LanguageSwitchProps) {
  return (
    <div className="inline-flex max-w-full items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1">
      {(["zh", "en"] as AppLanguage[]).map((option) => {
        const active = option === language;
        const label = option === "zh" ? "中文" : "EN";
        const ariaLabel = option === "zh"
          ? (language === "zh" ? "当前语言为中文" : "切换到中文")
          : (language === "zh" ? "切换到英文" : "Switch to English");
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-label={ariaLabel}
            aria-pressed={active}
            title={ariaLabel}
            className={`min-w-[4.5rem] rounded-full px-3 py-2 text-sm font-medium transition sm:min-w-16 sm:px-4 ${
              active
                ? "bg-gradient-to-r from-emerald-200 to-sky-300 text-slate-950"
                : "text-white/70 hover:text-white"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
