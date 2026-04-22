import type { AppLanguage } from "../../lib/i18n";
import type { AppTheme } from "../../shared/theme";

interface ThemeSwitchProps {
  language: AppLanguage;
  theme: AppTheme;
  onChange: (theme: AppTheme) => void;
}

function SunIcon({ active }: { active: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 transition ${active ? "text-slate-950" : "text-white/55"}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.7 5.3l-1.7 1.7M7 17l-1.7 1.7M18.7 18.7L17 17M7 7L5.3 5.3" />
    </svg>
  );
}

function MoonIcon({ active }: { active: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 transition ${active ? "text-slate-950" : "text-white/55"}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 15.4A8.4 8.4 0 1 1 8.6 4 7 7 0 0 0 20 15.4Z" />
    </svg>
  );
}

export function ThemeSwitch({ language, theme, onChange }: ThemeSwitchProps) {
  const nextTheme = theme === "dark" ? "light" : "dark";
  const title = theme === "dark"
    ? (language === "zh" ? "切换到浅色模式" : "Switch to light mode")
    : (language === "zh" ? "切换到深色模式" : "Switch to dark mode");

  return (
    <button
      type="button"
      onClick={() => onChange(nextTheme)}
      aria-label={title}
      aria-pressed={theme === "dark"}
      title={title}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 transition hover:-translate-y-0.5"
    >
      <span className={`inline-flex items-center justify-center rounded-full px-2 py-1 transition ${theme === "light" ? "bg-gradient-to-r from-emerald-200 to-sky-300" : "bg-white/5"}`}>
        <SunIcon active={theme === "light"} />
      </span>
      <span className={`inline-flex items-center justify-center rounded-full px-2 py-1 transition ${theme === "dark" ? "bg-gradient-to-r from-emerald-200 to-sky-300" : "bg-white/5"}`}>
        <MoonIcon active={theme === "dark"} />
      </span>
    </button>
  );
}
