import type { AppLanguage } from "../../lib/i18n";
import { CircularToggleButton } from "./CircularToggleButton";

interface LanguageSwitchProps {
  language: AppLanguage;
  onChange: (language: AppLanguage) => void;
}

export function LanguageSwitch({ language, onChange }: LanguageSwitchProps) {
  const nextLanguage = language === "zh" ? "en" : "zh";
  const title = language === "zh" ? "切换到英文" : "Switch to Chinese";

  return (
    <CircularToggleButton title={title} ariaPressed={language === "zh"} onClick={() => onChange(nextLanguage)}>
      <span className="inline-flex items-center gap-[0.46rem] text-[#2d3748]">
        <span className="text-[1.72rem] font-semibold leading-none tracking-[-0.08em]">中</span>
        <span aria-hidden="true" className="h-7 w-px rounded-full bg-[#a9c6ff]" />
        <span className="text-[1.42rem] font-semibold leading-none tracking-[-0.05em]">En</span>
      </span>
    </CircularToggleButton>
  );
}
