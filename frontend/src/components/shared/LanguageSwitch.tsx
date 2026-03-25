import type { AppLanguage } from "../../lib/i18n";

interface LanguageSwitchProps {
  language: AppLanguage;
  onChange: (language: AppLanguage) => void;
}

export function LanguageSwitch({ language, onChange }: LanguageSwitchProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1">
      {(["zh", "en"] as AppLanguage[]).map((option) => {
        const active = option === language;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`min-w-16 rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-gradient-to-r from-emerald-200 to-sky-300 text-slate-950"
                : "text-white/70 hover:text-white"
            }`}
          >
            {option === "zh" ? "中文" : "EN"}
          </button>
        );
      })}
    </div>
  );
}
