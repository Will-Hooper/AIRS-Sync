import type { AppTheme } from "../../shared/theme";
import { getMoatThemeTokens, getMoatTypeColor, withAlpha } from "../../lib/moat-color";
import {
  MOAT_TYPE_ORDER,
  getMoatStrengthLabelFromScore,
  getMoatTypeIcon,
  getMoatTypeLabel,
  type MoatLanguage,
  type OccupationMoatNode
} from "../../lib/moat";

interface MoatMiniBarsProps {
  node: OccupationMoatNode;
  language: MoatLanguage;
  theme: AppTheme;
  compact?: boolean;
}

export function MoatMiniBars({ node, language, theme, compact = false }: MoatMiniBarsProps) {
  const tokens = getMoatThemeTokens(theme);

  return (
    <div className={compact ? "space-y-1.5" : "space-y-3"}>
      {MOAT_TYPE_ORDER.map((type) => {
        const color = getMoatTypeColor(type, theme);
        const value = node.moat[type];
        return (
          <div
            key={type}
            className={compact
              ? "grid grid-cols-[24px_minmax(0,1fr)] items-center gap-2"
              : "grid grid-cols-[84px_minmax(0,1fr)_26px] items-center gap-3"}
          >
            <span
              className={compact ? "text-[10px] font-semibold tracking-[0.04em]" : "text-xs font-medium"}
              style={{ color: compact ? color : tokens.textSecondary }}
              title={getMoatTypeLabel(type, language, "full")}
            >
              {compact ? getMoatTypeIcon(type, language) : getMoatTypeLabel(type, language, "short")}
            </span>
            <div
              className={compact ? "h-1.5 overflow-hidden rounded-full" : "h-2.5 overflow-hidden rounded-full"}
              style={{ background: withAlpha(color, theme === "dark" ? 0.14 : 0.12) }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(value, 4)}%`,
                  background: color
                }}
              />
            </div>
            {!compact ? (
              <span className="text-xs font-semibold text-right" style={{ color }}>
                {getMoatStrengthLabelFromScore(value, language)}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
