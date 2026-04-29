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
            className="rounded-[22px] border p-3.5 sm:p-4"
            style={{
              borderColor: tokens.border,
              background: tokens.surface,
              boxShadow: tokens.shadow
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-2xl text-sm font-semibold"
                  style={{
                    color: theme === "dark" ? "#f8fbff" : "#ffffff",
                    background: color
                  }}
                >
                  {getMoatTypeIcon(item.type, language)}
                </span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
                    {getMoatTypeLabel(item.type, language, "full")}
                  </p>
                  <p className="text-xs" style={{ color: tokens.textSecondary }}>
                    {language === "zh" ? `${item.count} 个职业` : `${item.count} occupations`}
                  </p>
                </div>
              </div>

              <div
                className="relative h-11 w-11 rounded-full"
                style={{
                  background: `conic-gradient(${color} ${item.ratio * 360}deg, ${withAlpha(color, theme === "dark" ? 0.14 : 0.1)} 0deg)`
                }}
              >
                <div
                  className="absolute inset-[6px] rounded-full"
                  style={{
                    background: tokens.surfaceStrong,
                    border: `1px solid ${tokens.border}`
                  }}
                />
              </div>
            </div>

            <div className="mt-3 flex items-end justify-between">
              <p className="text-2xl font-semibold tracking-[-0.04em]" style={{ color: color }}>
                {formatPercent(item.ratio)}
              </p>
              <div
                className="h-2 w-20 overflow-hidden rounded-full"
                style={{ background: withAlpha(color, theme === "dark" ? 0.18 : 0.12) }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(item.ratio * 100, 6)}%`,
                    background: color
                  }}
                />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
