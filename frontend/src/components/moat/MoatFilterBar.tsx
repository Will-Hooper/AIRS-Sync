import { useState, type ReactNode } from "react";
import type { AppTheme } from "../../shared/theme";
import { getMoatThemeTokens, withAlpha } from "../../lib/moat-color";
import { MOAT_TYPE_ORDER, getMoatTypeLabel, type DominantMoatType, type MoatLanguage } from "../../lib/moat";
import { MoatLegend } from "./MoatLegend";

interface GroupOption {
  value: string;
  label: string;
}

interface MoatFilterBarProps {
  language: MoatLanguage;
  theme: AppTheme;
  searchSlot: ReactNode;
  groupOptions: GroupOption[];
  majorGroupValue: string;
  dominantMoatValue: DominantMoatType | "all";
  onMajorGroupChange: (value: string) => void;
  onDominantMoatChange: (value: DominantMoatType | "all") => void;
  matchedCount: number;
  totalCount: number;
  noResultText?: string | null;
  compact?: boolean;
}

export function MoatFilterBar({
  language,
  theme,
  searchSlot,
  groupOptions,
  majorGroupValue,
  dominantMoatValue,
  onMajorGroupChange,
  onDominantMoatChange,
  matchedCount,
  totalCount,
  noResultText,
  compact = false
}: MoatFilterBarProps) {
  const tokens = getMoatThemeTokens(theme);
  const [mobileOpen, setMobileOpen] = useState(false);
  const showControls = !compact || mobileOpen;

  const summaryText = language === "zh"
    ? `当前结果：${matchedCount} / ${totalCount}`
    : `Current result: ${matchedCount} / ${totalCount}`;

  return (
    <div
      className="moat-filter-shell relative z-30 overflow-hidden rounded-[28px] border p-3.5 sm:p-4"
      style={{
        borderColor: tokens.border,
        background: tokens.surface,
        boxShadow: tokens.shadow
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${tokens.borderStrong}, transparent)` }}
      />
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">{searchSlot}</div>
          {compact ? (
            <button
              type="button"
              className="inline-flex self-start rounded-full border px-4 py-2 text-sm font-medium shadow-lg transition hover:-translate-y-0.5"
              style={{
                color: tokens.textPrimary,
                borderColor: tokens.border,
                background: tokens.surfaceRaised
              }}
              onClick={() => setMobileOpen((current) => !current)}
            >
              {mobileOpen
                ? language === "zh" ? "收起筛选" : "Hide filters"
                : language === "zh" ? "展开筛选" : "Show filters"}
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs leading-5" style={{ color: noResultText ? "#ff8b8b" : tokens.textSecondary }}>
          <span
            className="inline-flex rounded-full border px-3 py-1"
            style={{
              borderColor: noResultText ? "rgba(255, 125, 125, 0.24)" : tokens.border,
              background: noResultText ? "rgba(255, 106, 106, 0.08)" : tokens.surfaceAlt
            }}
          >
            {noResultText || summaryText}
          </span>
        </div>

        {showControls ? (
          <div
            className={`grid gap-3 ${compact ? "rounded-[22px] border p-3" : "rounded-[24px] border px-3.5 py-3"} xl:grid-cols-[minmax(0,260px)_minmax(0,260px)_1fr] xl:items-start`}
            style={compact ? {
              borderColor: tokens.border,
              background: tokens.surfaceAlt
            } : {
              borderColor: tokens.border,
              background: `linear-gradient(180deg, ${tokens.surfaceAlt}, ${withAlpha(theme === "dark" ? "#08111d" : "#ffffff", theme === "dark" ? 0.02 : 0.03)})`
            }}
          >
            <label className="grid gap-2 text-sm">
              <span className="font-medium" style={{ color: tokens.textSecondary }}>
                {language === "zh" ? "职业大类" : "Major group"}
              </span>
              <select
                className={`rounded-[18px] border px-4 py-2.5 text-sm outline-none ${compact ? "" : "airs-select"}`}
                value={majorGroupValue}
                onChange={(event) => onMajorGroupChange(event.target.value)}
                style={compact ? {
                  color: tokens.textPrimary,
                  borderColor: tokens.border,
                  background: tokens.input
                } : undefined}
              >
                <option value="all">{language === "zh" ? "全部" : "All"}</option>
                {groupOptions.map((group) => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium" style={{ color: tokens.textSecondary }}>
                {language === "zh" ? "主护城河类型" : "Dominant moat type"}
              </span>
              <select
                className={`rounded-[18px] border px-4 py-2.5 text-sm outline-none ${compact ? "" : "airs-select"}`}
                value={dominantMoatValue}
                onChange={(event) => onDominantMoatChange(event.target.value as DominantMoatType | "all")}
                style={compact ? {
                  color: tokens.textPrimary,
                  borderColor: tokens.border,
                  background: tokens.input
                } : undefined}
              >
                <option value="all">{language === "zh" ? "全部" : "All"}</option>
                {MOAT_TYPE_ORDER.map((type) => (
                  <option key={type} value={type}>
                    {getMoatTypeLabel(type, language, "short")}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-2 rounded-[20px] border p-3" style={{ borderColor: tokens.border, background: tokens.surfaceAlt }}>
              <span className="text-sm font-medium" style={{ color: tokens.textSecondary }}>
                {language === "zh" ? "颜色代表该职业最主要的人类护城河类型。" : "Color shows the occupation's dominant human moat."}
              </span>
              <MoatLegend language={language} theme={theme} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
