import type { AppLanguage } from "../../lib/i18n";
import type { AppTheme } from "../../shared/theme";

interface ThemeSwitchProps {
  language: AppLanguage;
  theme: AppTheme;
  onChange: (theme: AppTheme) => void;
}

export function ThemeSwitch({ language, theme, onChange }: ThemeSwitchProps) {
  return (
    <div className="inline-flex max-w-full items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1">
      {([
        {
          value: "light",
          label: language === "zh" ? "浅色" : "Light",
          ariaLabel: language === "zh" ? "切换到浅色模式" : "Switch to light mode"
        },
        {
          value: "dark",
          label: language === "zh" ? "深色" : "Dark",
          ariaLabel: language === "zh" ? "切换到深色模式" : "Switch to dark mode"
        }
      ] as const).map((option) => {
        const active = option.value === theme;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-label={option.ariaLabel}
            aria-pressed={active}
            title={option.ariaLabel}
            className={`min-w-[4.5rem] rounded-full px-3 py-2 text-sm font-medium transition sm:min-w-16 sm:px-4 ${
              active
                ? "bg-gradient-to-r from-emerald-200 to-sky-300 text-slate-950"
                : "text-white/70 hover:text-white"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
