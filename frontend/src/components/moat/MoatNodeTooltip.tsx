import type { CSSProperties } from "react";
import type { AppTheme } from "../../shared/theme";
import { getMoatThemeTokens, getMoatTypeColor, withAlpha } from "../../lib/moat-color";
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
  const accent = getMoatTypeColor(node.dominantMoatType, theme);

  return (
    <div
      className="moat-tooltip-panel pointer-events-none absolute z-50 w-[248px] overflow-hidden rounded-[20px] border p-4 shadow-2xl backdrop-blur-xl"
      style={{
        ...style,
        color: tokens.textPrimary,
        borderColor: tokens.borderStrong,
        background: `linear-gradient(180deg, ${withAlpha(accent, theme === "dark" ? 0.16 : 0.08)}, ${tokens.surfaceStrong})`
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-4 top-0 h-14 rounded-b-[18px] blur-2xl"
        style={{ background: withAlpha(accent, theme === "dark" ? 0.2 : 0.12) }}
      />
      <div className="space-y-1">
        <p className="text-sm font-semibold">{getOccupationMoatDisplayName(node, language)}</p>
        <p className="text-xs" style={{ color: tokens.textSecondary }}>
          {language === "zh" ? node.majorGroupCn : node.majorGroup}
        </p>
        <span
          className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{
            color: theme === "dark" ? "#f8fbff" : "#ffffff",
            background: `linear-gradient(135deg, ${withAlpha(accent, theme === "dark" ? 0.88 : 0.94)}, ${accent})`
          }}
        >
          {language === "zh" ? "主护城河：" : "Dominant moat: "}
          {getMoatTypeLabel(node.dominantMoatType, language, "short")}
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        {MOAT_TYPE_ORDER.map((type) => (
          <div
            key={type}
            className="flex items-center justify-between gap-3 rounded-[12px] px-2.5 py-2 text-xs"
            style={{ background: withAlpha(getMoatTypeColor(type, theme), theme === "dark" ? 0.08 : 0.06) }}
          >
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
