import type { H5Language } from "../lib/language";

interface H5LanguageSwitchProps {
  language: H5Language;
  onChange: (language: H5Language) => void;
}

export function H5LanguageSwitch({ language, onChange }: H5LanguageSwitchProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1">
      {(["zh", "en"] as H5Language[]).map((option) => {
        const active = option === language;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`min-w-16 rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-gradient-to-r from-[#9ae8d4] to-[#84c6ff] text-slate-950"
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
