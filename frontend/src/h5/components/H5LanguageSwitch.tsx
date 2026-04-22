import type { H5Language } from "../lib/language";

interface H5LanguageSwitchProps {
  language: H5Language;
  onChange: (language: H5Language) => void;
}

export function H5LanguageSwitch({ language, onChange }: H5LanguageSwitchProps) {
  const nextLanguage = language === "zh" ? "en" : "zh";
  const title = language === "zh" ? "切换到英文" : "Switch to Chinese";

  return (
    <button
      type="button"
      onClick={() => onChange(nextLanguage)}
      aria-label={title}
      aria-pressed={language === "zh"}
      title={title}
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-sm font-medium transition"
    >
      <span className={`rounded-full px-2 py-1 transition ${language === "zh" ? "bg-gradient-to-r from-[#9ae8d4] to-[#84c6ff] text-slate-950" : "text-white/55"}`}>中</span>
      <span className="text-white/45">+</span>
      <span className={`rounded-full px-2 py-1 transition ${language === "en" ? "bg-gradient-to-r from-[#9ae8d4] to-[#84c6ff] text-slate-950" : "text-white/55"}`}>En</span>
    </button>
  );
}
