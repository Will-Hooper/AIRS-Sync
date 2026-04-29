import type { AppTheme } from "../../shared/theme";
import { getMoatThemeTokens, getMoatTypeColor, withAlpha } from "../../lib/moat-color";
import {
  MOAT_TYPE_ORDER,
  getMoatStrengthLabelFromScore,
  getMoatTypeLabel,
  type MoatLanguage,
  type OccupationMoatNode
} from "../../lib/moat";

interface MoatMiniBarsProps {
  node: OccupationMoatNode;
  language: MoatLanguage;
  theme: AppTheme;
}

export function MoatMiniBars({ node, language, theme }: MoatMiniBarsProps) {
  const tokens = getMoatThemeTokens(theme);

  return (
    <div className="space-y-3">
      {MOAT_TYPE_ORDER.map((type) => {
        const color = getMoatTypeColor(type, theme);
        const value = node.moat[type];
        return (
          <div key={type} className="grid grid-cols-[84px_minmax(0,1fr)_26px] items-center gap-3">
            <span className="text-xs font-medium" style={{ color: tokens.textSecondary }}>
              {getMoatTypeLabel(type, language, "short")}
            </span>
            <div
              className="h-2.5 overflow-hidden rounded-full"
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
            <span className="text-xs font-semibold text-right" style={{ color }}>
              {getMoatStrengthLabelFromScore(value, language)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
