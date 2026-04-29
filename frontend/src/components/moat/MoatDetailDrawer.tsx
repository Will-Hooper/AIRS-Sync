import type { AppTheme } from "../../shared/theme";
import { buildOccupationMoatSummary, getMoatStrengthLabel, getMoatTypeLabel, getOccupationMoatDisplayName, type MoatLanguage, type OccupationMoatNode } from "../../lib/moat";
import { getMoatThemeTokens, getMoatTypeColor } from "../../lib/moat-color";
import { MoatMiniBars } from "./MoatMiniBars";

interface MoatDetailDrawerProps {
  node: OccupationMoatNode | null;
  language: MoatLanguage;
  theme: AppTheme;
  onClose: () => void;
  onOpenOccupation: (node: OccupationMoatNode) => void;
}

function DrawerBody({
  node,
  language,
  theme,
  onClose,
  onOpenOccupation
}: {
  node: OccupationMoatNode;
  language: MoatLanguage;
  theme: AppTheme;
  onClose: () => void;
  onOpenOccupation: (node: OccupationMoatNode) => void;
}) {
  const tokens = getMoatThemeTokens(theme);
  const accent = getMoatTypeColor(node.dominantMoatType, theme);

  return (
    <div
      className="flex h-full max-h-full flex-col overflow-y-auto rounded-[30px] border p-5 shadow-2xl backdrop-blur-xl"
      style={{
        color: tokens.textPrimary,
        borderColor: tokens.borderStrong,
        background: tokens.surfaceStrong
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em]" style={{ color: tokens.textSecondary }}>
            {language === "zh" ? "人的护城河在哪里？" : "Where is the human moat?"}
          </p>
          <h3 className="text-2xl font-semibold tracking-[-0.04em]">
            {getOccupationMoatDisplayName(node, language)}
          </h3>
          <p className="text-sm" style={{ color: tokens.textSecondary }}>
            {language === "zh" ? node.majorGroupCn : node.majorGroup}
          </p>
        </div>

        <button
          type="button"
          aria-label={language === "zh" ? "关闭详情" : "Close detail"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border text-lg"
          style={{
            color: tokens.textPrimary,
            borderColor: tokens.border,
            background: tokens.surfaceAlt
          }}
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <div
          className="rounded-[22px] border p-4"
          style={{
            borderColor: tokens.border,
            background: tokens.surfaceAlt
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm" style={{ color: tokens.textSecondary }}>
                {language === "zh" ? "主护城河类型" : "Dominant moat type"}
              </p>
              <p className="mt-1 text-lg font-semibold" style={{ color: accent }}>
                {getMoatTypeLabel(node.dominantMoatType, language, "full")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm" style={{ color: tokens.textSecondary }}>
                {language === "zh" ? "整体强弱" : "Overall level"}
              </p>
              <p className="mt-1 text-lg font-semibold">
                {getMoatStrengthLabel(node.moatStrengthLevel, language)}
              </p>
            </div>
          </div>
        </div>

        <div
          className="rounded-[22px] border p-4"
          style={{
            borderColor: tokens.border,
            background: tokens.surfaceAlt
          }}
        >
          <MoatMiniBars node={node} language={language} theme={theme} />
        </div>

        <p className="text-sm leading-7" style={{ color: tokens.textSecondary }}>
          {buildOccupationMoatSummary(node, language)}
        </p>
      </div>

      <div className="mt-auto pt-5">
        <button
          type="button"
          className="inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold text-slate-950"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accent})`
          }}
          onClick={() => onOpenOccupation(node)}
        >
          {language === "zh" ? "查看职业详情" : "View occupation detail"}
        </button>
      </div>
    </div>
  );
}

export function MoatDetailDrawer({ node, language, theme, onClose, onOpenOccupation }: MoatDetailDrawerProps) {
  const tokens = getMoatThemeTokens(theme);

  if (!node) return null;

  return (
    <>
      <div className="fixed inset-0 z-[1200] bg-black/35 lg:hidden" onClick={onClose} />

      <div className="pointer-events-none absolute inset-0 z-20 hidden lg:block">
        <div className="pointer-events-auto absolute inset-y-4 right-4 w-[min(368px,35vw)]">
          <DrawerBody node={node} language={language} theme={theme} onClose={onClose} onOpenOccupation={onOpenOccupation} />
        </div>
      </div>

      <div className="fixed inset-x-3 bottom-3 z-[1300] lg:hidden">
        <div
          className="mx-auto w-full max-w-[520px] rounded-[32px] border p-1 shadow-2xl backdrop-blur-xl"
          style={{
            borderColor: tokens.borderStrong,
            background: tokens.overlay
          }}
        >
          <div className="max-h-[min(68vh,540px)]">
            <DrawerBody node={node} language={language} theme={theme} onClose={onClose} onOpenOccupation={onOpenOccupation} />
          </div>
        </div>
      </div>
    </>
  );
}
