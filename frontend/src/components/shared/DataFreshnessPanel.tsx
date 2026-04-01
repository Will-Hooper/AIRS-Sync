import { formatDateTimeValue } from "../../lib/format";
import { messages, type AppLanguage } from "../../lib/i18n";
import type { DatasetSourceUpdatedAt, DatasetSyncStatus } from "../../lib/types";

interface DataFreshnessPanelProps {
  language: AppLanguage;
  generatedAt?: string;
  sourceUpdatedAt?: DatasetSourceUpdatedAt;
  datasetVersion?: string;
  syncStatus?: DatasetSyncStatus;
  compact?: boolean;
}

function syncStatusText(language: AppLanguage, syncStatus?: DatasetSyncStatus) {
  const copy = messages[language];
  if (!syncStatus) return copy.syncStateUnknown;
  const stateLabel =
    syncStatus.overall === "ok"
      ? copy.syncStatusOk
      : syncStatus.overall === "warning"
        ? copy.syncStatusWarning
        : copy.syncStatusError;
  const modeLabel = syncStatus.mode === "hourly" ? copy.syncModeHourly : copy.syncModeFull;
  return `${stateLabel} · ${modeLabel}`;
}

export function DataFreshnessPanel({
  language,
  generatedAt,
  sourceUpdatedAt,
  datasetVersion,
  syncStatus,
  compact = false
}: DataFreshnessPanelProps) {
  const copy = messages[language];
  const rows = [
    { label: copy.generatedAtLabel, value: formatDateTimeValue(generatedAt, language) },
    { label: copy.recruitmentUpdatedLabel, value: formatDateTimeValue(sourceUpdatedAt?.recruitment, language) },
    { label: copy.airsUpdatedLabel, value: formatDateTimeValue(sourceUpdatedAt?.airs, language) },
    { label: copy.onetUpdatedLabel, value: formatDateTimeValue(sourceUpdatedAt?.onet, language) },
    {
      label: copy.collegeScorecardUpdatedLabel,
      value: formatDateTimeValue(sourceUpdatedAt?.collegeScorecard, language)
    },
    { label: copy.datasetVersionLabel, value: datasetVersion || "--" },
    { label: copy.syncStatusLabel, value: syncStatusText(language, syncStatus) }
  ];

  if (compact) {
    return (
      <div className="rounded-[24px] border border-white/8 bg-black/10 px-4 py-4">
        <p className="airs-kicker">{copy.dataFreshness}</p>
        <div className="mt-4 grid gap-3">
          {rows.map((row) => (
            <div key={row.label} className="grid gap-1">
              <span className="text-xs text-white/45">{row.label}</span>
              <span className="text-sm font-medium text-white/80">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <article className="rounded-[28px] border border-white/8 bg-black/10 px-5 py-5">
      <p className="airs-kicker">{copy.dataFreshness}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-[20px] border border-white/8 bg-white/[0.02] px-4 py-4">
            <p className="text-sm text-white/45">{row.label}</p>
            <p className="mt-2 text-base font-medium text-white/82">{row.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
