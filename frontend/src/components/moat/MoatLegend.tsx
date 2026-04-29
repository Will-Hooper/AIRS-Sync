import type { AppTheme } from "../../shared/theme";
import { getMoatThemeTokens, getMoatTypeColor, withAlpha } from "../../lib/moat-color";
import { MOAT_TYPE_ORDER, getMoatTypeIcon, getMoatTypeLabel, type MoatLanguage } from "../../lib/moat";

interface MoatLegendProps {
  language: MoatLanguage;
  theme: AppTheme;
}

export function MoatLegend({ language, theme }: MoatLegendProps) {
  const tokens = getMoatThemeTokens(theme);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {MOAT_TYPE_ORDER.map((type) => {
        const color = getMoatTypeColor(type, theme);
        return (
          <span
            key={type}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
            style={{
              color: tokens.textPrimary,
              borderColor: tokens.border,
              background: withAlpha(color, theme === "dark" ? 0.12 : 0.08)
            }}
          >
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold"
              style={{
                color: theme === "dark" ? "#f8fbff" : "#ffffff",
                background: color
              }}
            >
              {getMoatTypeIcon(type, language)}
            </span>
            <span>{getMoatTypeLabel(type, language, "short")}</span>
          </span>
        );
      })}
    </div>
  );
}
