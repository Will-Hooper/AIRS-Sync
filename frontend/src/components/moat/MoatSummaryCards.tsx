import type { AppTheme } from "../../shared/theme";
import { getMoatThemeTokens, getMoatTypeColor, withAlpha } from "../../lib/moat-color";
import { getMoatTypeIcon, getMoatTypeLabel, type MoatLanguage } from "../../lib/moat";
import type { MoatSummaryItem } from "../../lib/moat-summary";

interface MoatSummaryCardsProps {
  items: MoatSummaryItem[];
  language: MoatLanguage;
  theme: AppTheme;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function MoatSummaryCards({ items, language, theme }: MoatSummaryCardsProps) {
  const tokens = getMoatThemeTokens(theme);

  return (
    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => {
        const color = getMoatTypeColor(item.type, theme);
        return (
          <article
            key={item.type}
            className="moat-summary-card relative overflow-hidden rounded-[24px] border p-3.5 sm:p-4"
            style={{
              borderColor: withAlpha(color, theme === "dark" ? 0.2 : 0.16),
              background: `linear-gradient(180deg, ${withAlpha(color, theme === "dark" ? 0.08 : 0.05)}, ${tokens.surface})`,
              boxShadow: tokens.shadow
            }}
          >
            <div
              className="pointer-events-none absolute -right-6 -top-10 h-24 w-24 rounded-full blur-2xl"
              style={{ background: withAlpha(color, theme === "dark" ? 0.14 : 0.09) }}
            />
            <div
              className="pointer-events-none absolute inset-x-4 bottom-3 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${withAlpha(color, 0.32)}, transparent)` }}
            />

            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[18px] text-sm font-semibold shadow-lg"
                  style={{
                    color: theme === "dark" ? "#f8fbff" : "#ffffff",
                    background: `linear-gradient(135deg, ${withAlpha(color, theme === "dark" ? 0.86 : 0.96)}, ${color})`
                  }}
                >
                  {getMoatTypeIcon(item.type, language)}
                </span>
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                    style={{ color: withAlpha(color, theme === "dark" ? 0.9 : 0.78) }}
                  >
                    {language === "zh" ? "护城河占比" : "Moat share"}
                  </p>
                  <p className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
                    {getMoatTypeLabel(item.type, language, "full")}
                  </p>
                  <p className="text-xs" style={{ color: tokens.textSecondary }}>
                    {language === "zh" ? `${item.count} 个职业` : `${item.count} occupations`}
                  </p>
                </div>
              </div>

              <div className="relative flex h-12 w-12 items-center justify-center rounded-full">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(${color} ${item.ratio * 360}deg, ${withAlpha(color, theme === "dark" ? 0.12 : 0.08)} 0deg)`
                  }}
                />
                <div
                  className="absolute inset-[6px] rounded-full"
                  style={{
                    background: tokens.surfaceRaised,
                    border: `1px solid ${tokens.border}`
                  }}
                />
                <span className="relative text-[11px] font-semibold" style={{ color }}>
                  {Math.round(item.ratio * 100)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: tokens.textSecondary }}>
                  {language === "zh" ? "当前占比" : "Current share"}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]" style={{ color }}>
                  {formatPercent(item.ratio)}
                </p>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div
                  className="h-2.5 overflow-hidden rounded-full"
                  style={{ background: withAlpha(color, theme === "dark" ? 0.16 : 0.12) }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(item.ratio * 100, 6)}%`,
                      background: `linear-gradient(90deg, ${withAlpha(color, theme === "dark" ? 0.88 : 0.92)}, ${color})`
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px]" style={{ color: tokens.textSecondary }}>
                  <span>{language === "zh" ? "低" : "Low"}</span>
                  <span>{language === "zh" ? "高" : "High"}</span>
                </div>
              </div>
            </div>

            <div
              className="pointer-events-none absolute inset-0 rounded-[24px]"
              style={{
                boxShadow: `inset 0 1px 0 ${withAlpha("#ffffff", theme === "dark" ? 0.08 : 0.62)}`
              }}
            />
          </article>
        );
      })}
    </div>
  );
}
