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
    <div className="flex flex-wrap items-center gap-2.5">
      {MOAT_TYPE_ORDER.map((type) => {
        const color = getMoatTypeColor(type, theme);
        return (
          <span
            key={type}
            className="moat-legend-chip inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
            style={{
              color: tokens.textPrimary,
              borderColor: withAlpha(color, theme === "dark" ? 0.22 : 0.18),
              background: `linear-gradient(135deg, ${withAlpha(color, theme === "dark" ? 0.1 : 0.07)}, ${tokens.surfaceRaised})`
            }}
          >
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold"
              style={{
                color: theme === "dark" ? "#f8fbff" : "#ffffff",
                background: `linear-gradient(135deg, ${withAlpha(color, theme === "dark" ? 0.8 : 0.88)}, ${color})`
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
