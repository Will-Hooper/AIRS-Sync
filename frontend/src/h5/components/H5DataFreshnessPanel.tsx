import { formatDateTimeValue } from "../../lib/format";
import type { DatasetSourceUpdatedAt, DatasetSyncStatus } from "../../lib/types";
import { getH5Copy, getH5SyncStatusText } from "../lib/copy";
import type { H5Language } from "../lib/language";

interface H5DataFreshnessPanelProps {
  language: H5Language;
  fileUpdatedAt?: string;
  generatedAt?: string;
  sourceUpdatedAt?: DatasetSourceUpdatedAt;
  datasetVersion?: string;
  syncStatus?: DatasetSyncStatus;
  compact?: boolean;
}

export function H5DataFreshnessPanel({
  language,
  fileUpdatedAt,
  generatedAt,
  sourceUpdatedAt,
  datasetVersion,
  syncStatus,
  compact = false
}: H5DataFreshnessPanelProps) {
  const copy = getH5Copy(language);
  const primaryUpdatedAt = fileUpdatedAt || generatedAt || sourceUpdatedAt?.airs || sourceUpdatedAt?.recruitment;
  const rows = [
    {
      label: fileUpdatedAt ? copy.dataFileUpdatedLabel : copy.generatedAtLabel,
      value: formatDateTimeValue(primaryUpdatedAt, language)
    },
    ...(fileUpdatedAt && generatedAt && generatedAt !== fileUpdatedAt
      ? [{ label: copy.generatedAtLabel, value: formatDateTimeValue(generatedAt, language) }]
      : []),
    { label: copy.recruitmentUpdatedLabel, value: formatDateTimeValue(sourceUpdatedAt?.recruitment, language) },
    { label: copy.airsUpdatedLabel, value: formatDateTimeValue(sourceUpdatedAt?.airs, language) },
    { label: copy.onetUpdatedLabel, value: formatDateTimeValue(sourceUpdatedAt?.onet, language) },
    { label: copy.collegeScorecardUpdatedLabel, value: formatDateTimeValue(sourceUpdatedAt?.collegeScorecard, language) },
    { label: copy.datasetVersionLabel, value: datasetVersion || "--" },
    { label: copy.syncStatusLabel, value: getH5SyncStatusText(language, syncStatus) }
  ];

  if (compact) {
    return (
      <div className="rounded-[24px] border border-white/8 bg-black/10 px-4 py-4">
        <p className="h5-kicker">{copy.dataFreshness}</p>
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
      <p className="h5-kicker">{copy.dataFreshness}</p>
      <div className="mt-5 grid gap-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-[22px] border border-white/8 bg-black/10 px-4 py-4">
            <p className="text-sm text-white/45">{row.label}</p>
            <p className="mt-2 text-base font-medium text-white/82">{row.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
