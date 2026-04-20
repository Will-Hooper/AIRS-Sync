import type { AppTheme } from "../../shared/theme";
import type { H5Language } from "../lib/language";

interface H5ThemeSwitchProps {
  language: H5Language;
  theme: AppTheme;
  onChange: (theme: AppTheme) => void;
}

export function H5ThemeSwitch({ language, theme, onChange }: H5ThemeSwitchProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1">
      {([
        { value: "light", label: language === "zh" ? "白天" : "Day" },
        { value: "dark", label: language === "zh" ? "夜晚" : "Night" }
      ] as const).map((option) => {
        const active = option.value === theme;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`min-w-16 rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-gradient-to-r from-[#9ae8d4] to-[#84c6ff] text-slate-950"
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
