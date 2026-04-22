import type { H5Language } from "../lib/language";
import { CircularToggleButton } from "../../components/shared/CircularToggleButton";

interface H5LanguageSwitchProps {
  language: H5Language;
  onChange: (language: H5Language) => void;
}

export function H5LanguageSwitch({ language, onChange }: H5LanguageSwitchProps) {
  const nextLanguage = language === "zh" ? "en" : "zh";
  const title = language === "zh" ? "切换到英文" : "Switch to Chinese";

  return (
    <CircularToggleButton title={title} ariaPressed={language === "zh"} onClick={() => onChange(nextLanguage)} size="mobile">
      <span className="inline-flex items-center gap-[0.34rem] text-[#2d3748]">
        <span className="text-[1.48rem] font-semibold leading-none tracking-[-0.08em]">中</span>
        <span aria-hidden="true" className="h-6 w-px rounded-full bg-[#a9c6ff]" />
        <span className="text-[1.18rem] font-semibold leading-none tracking-[-0.05em]">En</span>
      </span>
    </CircularToggleButton>
  );
}
