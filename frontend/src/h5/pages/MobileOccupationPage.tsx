import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getOccupationDetail, getSummary } from "../../lib/api";
import { trackSearchEvent } from "../../lib/analytics";
import { formatNumber } from "../../lib/format";
import type { OccupationDetailPayload } from "../../lib/types";
import { MobileBottomHero } from "../components/MobileBottomHero";
import { H5DataFreshnessPanel } from "../components/H5DataFreshnessPanel";
import { H5Footer } from "../components/H5Footer";
import { H5LanguageSwitch } from "../components/H5LanguageSwitch";
import { H5NumberedBox } from "../components/H5NumberedBox";
import { H5SearchCombobox } from "../components/H5SearchCombobox";
import { OccupationBreakdownCard } from "../components/OccupationBreakdownCard";
import { OccupationReadingCard } from "../components/OccupationReadingCard";
import { useH5NumberedBoxes } from "../hooks/useH5NumberedBoxes";
import { getH5Copy, getH5LabelText } from "../lib/copy";
import { getInitialH5Language, normalizeH5Language, persistH5Language, type H5Language } from "../lib/language";
import { buildDesktopOccupationHref, buildH5OccupationHref } from "../lib/navigation";
import { renderOccupationShareImage } from "../share/share-image";

export function MobileOccupationPage() {
  const navigate = useNavigate();
  const params = useParams();
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [language, setLanguage] = useState<H5Language>(() =>
    normalizeH5Language(searchParams.get("lang") || getInitialH5Language(window.location.search))
  );
  const [payload, setPayload] = useState<OccupationDetailPayload | null>(null);
  const [averageAirs, setAverageAirs] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const socCode = decodeURIComponent(params.socCode || searchParams.get("soc") || "");
  const entryLabel = searchParams.get("entry") || "";
  const copy = getH5Copy(language);

  useEffect(() => {
    persistH5Language(language);
    const next = new URLSearchParams(searchParams);
    next.set("lang", language);
    setSearchParams(next, { replace: true });
  }, [language, searchParams, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([getOccupationDetail(socCode), getSummary()])
      .then(([detail, summary]) => {
        if (cancelled) return;
        setPayload(detail);
        setAverageAirs(summary.avgAirs);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setPayload(null);
          setError(reason instanceof Error ? reason.message : copy.loadError);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [copy.loadError, socCode]);

  useEffect(() => {
    return () => {
      if (shareImageUrl) {
        URL.revokeObjectURL(shareImageUrl);
      }
    };
  }, [shareImageUrl]);

  const occupation = payload?.occupation || null;
  const displayTitle = occupation
    ? language === "zh"
      ? entryLabel || occupation.titleZh || occupation.title
      : occupation.title
    : "";
  const readingText = occupation
    ? language === "zh"
      ? occupation.summaryZh || occupation.summary
      : occupation.summary || occupation.summaryZh || ""
    : "";
  const breakdown = useMemo(
    () =>
      occupation
        ? [
            {
              key: "replacement",
              label: copy.breakdownLabels.replacement,
              value: Number(occupation.replacement || 0),
              valueText: `${formatNumber(Number(occupation.replacement || 0) * 100, 0, language)}%`
            },
            {
              key: "augmentation",
              label: copy.breakdownLabels.augmentation,
              value: Number(occupation.augmentation || 0),
              valueText: `${formatNumber(Number(occupation.augmentation || 0) * 100, 0, language)}%`
            },
            {
              key: "hiring",
              label: copy.breakdownLabels.hiring,
              value: Number(occupation.hiring || 0),
              valueText: `${formatNumber(Number(occupation.hiring || 0) * 100, 0, language)}%`
            },
            {
              key: "historical",
              label: copy.breakdownLabels.historical,
              value: Number(occupation.historical || 0),
              valueText: `${formatNumber(Number(occupation.historical || 0) * 100, 0, language)}%`
            }
          ]
        : [],
    [copy.breakdownLabels.augmentation, copy.breakdownLabels.hiring, copy.breakdownLabels.historical, copy.breakdownLabels.replacement, language, occupation]
  );

  useH5NumberedBoxes(pageRef, [
    language,
    socCode,
    occupation?.socCode,
    occupation?.airs,
    averageAirs,
    payload?.generatedAt,
    payload?.datasetVersion,
    shareImageUrl,
    loading,
    error,
    shareError
  ]);

  const createShareImage = async () => {
    if (!occupation) return;
    setGenerating(true);
    setShareError(null);
    try {
      const dataUrl = await renderOccupationShareImage({
        occupation,
        averageAirs,
        language,
        generatedAt: payload?.generatedAt,
        sourceUpdatedAt: payload?.sourceUpdatedAt,
        siteUrl: buildH5OccupationHref(occupation.socCode, language)
      });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      if (shareImageUrl) URL.revokeObjectURL(shareImageUrl);
      const objectUrl = URL.createObjectURL(blob);
      setShareImageUrl(objectUrl);
    } catch {
      setShareError(copy.shareError);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="h5-shell">
      <div ref={pageRef} className="h5-page">
        <header data-h5-numbered-box className="h5-numbered h5-panel flex flex-col gap-4 px-5 py-5">
          <div className="flex items-center justify-between gap-4">
            <button type="button" className="h5-button" onClick={() => navigate(`/?lang=${language}`)}>
              {copy.backHome}
            </button>
            <H5LanguageSwitch language={language} onChange={setLanguage} />
          </div>
          <H5SearchCombobox
            language={language}
            placeholder={copy.searchPlaceholder}
            analyticsSource="h5-detail"
            onCommit={(query, selected, payload) => {
              void trackSearchEvent({
                query,
                source: "h5-detail",
                language,
                occupation: selected?.occupation,
                searchLabel: selected?.label,
                matchType: payload?.matchType || selected?.matchType,
                matchedAlias: selected?.matchedAlias,
                resultCount: payload?.resultCount,
                isZeroResult: !payload?.primaryResult,
                didClickResult: Boolean(selected)
              });
            }}
            onSelect={(selection) => {
              navigate(`/occupation/${encodeURIComponent(selection.occupation.socCode)}?lang=${language}&entry=${encodeURIComponent(selection.label)}`);
            }}
          />
        </header>

        <section data-h5-numbered-box className="h5-numbered h5-panel flex flex-col gap-6 px-5 py-6">
          {loading ? (
            <div className="h5-empty-state">{copy.loading}</div>
          ) : error ? (
            <div className="space-y-3 text-center">
              <p className="h5-kicker">{copy.moduleKicker}</p>
              <h1 className="text-2xl font-semibold text-white">{copy.loadError}</h1>
              <p className="text-sm leading-7 text-white/55">{error}</p>
            </div>
          ) : occupation ? (
            <>
              <div data-h5-numbered-box className="h5-numbered space-y-3">
                <p className="h5-kicker">{copy.resultTitle}</p>
                <h1 className="text-4xl font-semibold leading-tight tracking-[-0.06em] text-white">
                  {displayTitle}
                </h1>
                <div className="flex flex-wrap gap-2">
                  <span className="h5-chip">{occupation.socCode}</span>
                  <span className="h5-chip">{getH5LabelText(language, occupation.label)}</span>
                </div>
              </div>

              <H5NumberedBox>
                <H5DataFreshnessPanel
                  compact
                  language={language}
                  generatedAt={payload?.generatedAt}
                  sourceUpdatedAt={payload?.sourceUpdatedAt}
                  datasetVersion={payload?.datasetVersion}
                  syncStatus={payload?.syncStatus}
                />
              </H5NumberedBox>

              <div className="grid gap-4 sm:grid-cols-2">
                <div data-h5-numbered-box className="h5-numbered rounded-[28px] border border-white/10 bg-black/15 px-5 py-6">
                  <p className="text-sm text-white/52">{copy.currentAirsLabel}</p>
                  <p className="mt-4 text-[4rem] font-semibold leading-none tracking-[-0.08em] text-white">
                    {formatNumber(occupation.airs || 0, 1, language)}
                  </p>
                </div>
                <div data-h5-numbered-box className="h5-numbered rounded-[28px] border border-white/10 bg-black/15 px-5 py-6">
                  <p className="text-sm text-white/52">{copy.globalAverageLabel}</p>
                  <p className="mt-4 text-[4rem] font-semibold leading-none tracking-[-0.08em] text-white">
                    {formatNumber(averageAirs, 1, language)}
                  </p>
                </div>
              </div>

              <OccupationReadingCard title={copy.readingTitle} content={readingText} emptyText={copy.noReading} />

              <OccupationBreakdownCard title={copy.breakdownTitle} items={breakdown} />

              <div data-h5-numbered-box className="h5-numbered rounded-[28px] border border-white/8 bg-black/10 px-4 py-4">
                <div className="flex flex-wrap gap-3">
                  <button type="button" className="h5-button-primary flex-1" onClick={() => void createShareImage()}>
                    {generating ? copy.loading : copy.generateShare}
                  </button>
                  <button
                    type="button"
                    className="h5-button flex-1"
                    onClick={() => window.location.assign(buildDesktopOccupationHref(occupation.socCode, language))}
                  >
                    {copy.openDesktopDetail}
                  </button>
                  {shareImageUrl && (
                    <a
                      href={shareImageUrl}
                      download={`airs-share-${occupation.socCode}.png`}
                      className="h5-button flex-1 text-center"
                    >
                      {copy.saveImage}
                    </a>
                  )}
                </div>
                {shareError && <p className="mt-4 text-sm text-amber-200/80">{shareError}</p>}
                {shareImageUrl && <p className="mt-4 text-sm text-white/45">{copy.shareReady}</p>}
              </div>

              {shareImageUrl && (
                <div data-h5-numbered-box className="h5-numbered rounded-[28px] border border-white/10 bg-black/15 p-3">
                  <img src={shareImageUrl} alt={copy.shareImageTitle} className="w-full rounded-[22px]" />
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-white/55">{copy.noSelection}</p>
          )}
        </section>

        <div data-h5-numbered-box className="h5-numbered rounded-[32px] border border-white/10 bg-black/10 px-5 py-4 text-sm leading-7 text-white/62">
          {copy.sourceNote}
        </div>

        <H5NumberedBox>
          <MobileBottomHero caption={copy.bottomCaption} language={language} />
        </H5NumberedBox>
        <H5NumberedBox>
          <H5Footer language={language} />
        </H5NumberedBox>
      </div>
    </div>
  );
}
