import type { CSSProperties } from "react";
import type { AppTheme } from "../../shared/theme";
import { getMoatThemeTokens } from "../../lib/moat-color";
import {
  MOAT_TYPE_ORDER,
  getMoatStrengthLabelFromScore,
  getMoatTypeLabel,
  getOccupationMoatDisplayName,
  type MoatLanguage,
  type OccupationMoatNode
} from "../../lib/moat";

interface MoatNodeTooltipProps {
  node: OccupationMoatNode;
  language: MoatLanguage;
  theme: AppTheme;
  style: CSSProperties;
}

export function MoatNodeTooltip({ node, language, theme, style }: MoatNodeTooltipProps) {
  const tokens = getMoatThemeTokens(theme);

  return (
    <div
      className="pointer-events-none absolute z-50 w-[248px] rounded-[20px] border p-4 shadow-2xl backdrop-blur-xl"
      style={{
        ...style,
        color: tokens.textPrimary,
        borderColor: tokens.borderStrong,
        background: tokens.surfaceStrong
      }}
    >
      <div className="space-y-1">
        <p className="text-sm font-semibold">{getOccupationMoatDisplayName(node, language)}</p>
        <p className="text-xs" style={{ color: tokens.textSecondary }}>
          {language === "zh" ? node.majorGroupCn : node.majorGroup}
        </p>
        <p className="text-xs" style={{ color: tokens.textSecondary }}>
          {language === "zh" ? "主护城河：" : "Dominant moat: "}
          <span style={{ color: tokens.textPrimary }}>
            {getMoatTypeLabel(node.dominantMoatType, language, "short")}
          </span>
        </p>
      </div>

      <div className="mt-3 space-y-1.5">
        {MOAT_TYPE_ORDER.map((type) => (
          <div key={type} className="flex items-center justify-between gap-3 text-xs">
            <span style={{ color: tokens.textSecondary }}>{getMoatTypeLabel(type, language, "short")}</span>
            <span style={{ color: tokens.textPrimary }}>
              {getMoatStrengthLabelFromScore(node.moat[type], language)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
