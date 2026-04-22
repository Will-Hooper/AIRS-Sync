import type { AppLanguage } from "../../lib/i18n";
import type { AppTheme } from "../../shared/theme";
import { CircularToggleButton } from "./CircularToggleButton";

interface ThemeSwitchProps {
  language: AppLanguage;
  theme: AppTheme;
  onChange: (theme: AppTheme) => void;
}

function ThemeGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className="h-7 w-7" fill="none">
      <path
        d="M16 7.2a8.8 8.8 0 1 0 0 17.6V7.2Z"
        fill="currentColor"
      />
      <path
        d="M18.2 6.2c4.8.84 8.2 4.82 8.2 9.8s-3.4 8.96-8.2 9.8a1.6 1.6 0 0 1-.88-3.08 6.74 6.74 0 0 0 0-13.48 1.6 1.6 0 0 1 .88-3.04Z"
        fill="currentColor"
      />
      <path
        d="M8.1 16h-3.3M11 10.1l-2.34-2.34M11 21.9l-2.34 2.34M16 4.8v3.34M16 23.86v3.34"
        stroke="currentColor"
        strokeWidth="1.95"
        strokeLinecap="round"
      />
      <path
        d="M16.85 8.55A6.9 6.9 0 0 1 16.9 23.45"
        stroke="rgba(255,255,255,0.72)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ThemeSwitch({ language, theme, onChange }: ThemeSwitchProps) {
  const nextTheme = theme === "dark" ? "light" : "dark";
  const title = theme === "dark"
    ? (language === "zh" ? "切换到浅色模式" : "Switch to light mode")
    : (language === "zh" ? "切换到深色模式" : "Switch to dark mode");

  return (
    <CircularToggleButton title={title} ariaPressed={theme === "dark"} onClick={() => onChange(nextTheme)}>
      <span className="text-[#2d3748]">
        <ThemeGlyph />
      </span>
    </CircularToggleButton>
  );
}
