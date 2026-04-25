import type { AppLanguage } from "../../lib/i18n";
import { CircularToggleButton } from "./CircularToggleButton";

interface LanguageSwitchProps {
  language: AppLanguage;
  onChange: (language: AppLanguage) => void;
  compact?: boolean;
}

export function LanguageSwitch({ language, onChange, compact = false }: LanguageSwitchProps) {
  const nextLanguage = language === "zh" ? "en" : "zh";
  const title = language === "zh" ? "切换到英文" : "Switch to Chinese";
  const gapClassName = compact ? "gap-[0.18rem]" : "gap-[0.46rem]";
  const zhClassName = compact ? "text-[0.92rem] tracking-[-0.02em]" : "text-[1.72rem] tracking-[-0.08em]";
  const dividerClassName = compact ? "h-4" : "h-7";
  const enClassName = compact ? "text-[0.82rem] tracking-[-0.01em]" : "text-[1.42rem] tracking-[-0.05em]";

  return (
    <CircularToggleButton title={title} ariaPressed={language === "zh"} onClick={() => onChange(nextLanguage)} size={compact ? "compact" : "desktop"}>
      <span className={`inline-flex items-center ${gapClassName} text-[#2d3748]`}>
        <span className={`${zhClassName} font-semibold leading-none`}>中</span>
        <span aria-hidden="true" className={`${dividerClassName} w-px rounded-full bg-[#a9c6ff]`} />
        <span className={`${enClassName} font-semibold leading-none`}>En</span>
      </span>
    </CircularToggleButton>
  );
}
