import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { LanguageSwitch } from "../components/shared/LanguageSwitch";
import { NumberedBox } from "../components/shared/NumberedBox";
import { SearchCombobox } from "../components/shared/SearchCombobox";
import { DataFreshnessPanel } from "../components/shared/DataFreshnessPanel";
import { SiteFooter } from "../components/shared/SiteFooter";
import { ThemeSwitch } from "../components/shared/ThemeSwitch";
import { getOccupationDetail, getSummary } from "../lib/api";
import { trackSearchEvent } from "../lib/analytics";
import { getDesktopShareCopy } from "../lib/desktop-share-copy";
import { applyDesktopShareMetadata } from "../lib/desktop-metadata";
import { formatCurrency, formatNumber } from "../lib/format";
import { getInitialLanguage, labelText, messages, normalizeLanguage, persistLanguage, type AppLanguage } from "../lib/i18n";
import type { OccupationDetailPayload } from "../lib/types";
import { useNumberedBoxes } from "../lib/useNumberedBoxes";
import { getScoreTextStyle } from "../shared/score-color";
import { getSharePlatformLabel, shareGeneratedImage, type GeneratedShareAsset, type SharePlatform } from "../shared/share/share-generated-image";
import { renderOccupationShareImage } from "../shared/share/render-occupation-share-image";
import { useAirsTheme } from "../shared/theme";

function getTaskSafetyScore(value?: number) {
  const normalized = Math.max(0, Math.min(1, Number(value || 0)));
  return Math.round((1 - normalized) * 100);
}

export function OccupationPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [language, setLanguage] = useState<AppLanguage>(() =>
    normalizeLanguage(searchParams.get("lang") || getInitialLanguage(window.location.search))
  );
  const [payload, setPayload] = useState<OccupationDetailPayload | null>(null);
  const [averageAirs, setAverageAirs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareAsset, setShareAsset] = useState<GeneratedShareAsset | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [theme, setTheme] = useAirsTheme();
  const pageRef = useRef<HTMLDivElement | null>(null);

  const socCode = decodeURIComponent(params.socCode || searchParams.get("soc") || "");
  const copy = messages[language];
  const region = searchParams.get("region") || undefined;
  const date = searchParams.get("date") || undefined;
  const entryLabel = searchParams.get("entry") || "";

  useEffect(() => {
    persistLanguage(language);
    const next = new URLSearchParams(searchParams);
    next.set("lang", language);
    setSearchParams(next, { replace: true });
  }, [language]);

  useEffect(() => {
    applyDesktopShareMetadata(language);
  }, [language]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [socCode]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getOccupationDetail(socCode, { region, date }), getSummary()])
      .then(([nextPayload, summary]) => {
        if (cancelled) return;
        setPayload(nextPayload);
        setAverageAirs(summary.avgAirs);
        if (!socCode && nextPayload.occupation?.socCode) {
          navigate(`/occupation/${encodeURIComponent(nextPayload.occupation.socCode)}?lang=${language}`, { replace: true });
        }
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : String(reason));
        setPayload(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [socCode, region, date, language, navigate]);

  useEffect(() => {
    return () => {
      if (shareAsset?.objectUrl) {
        URL.revokeObjectURL(shareAsset.objectUrl);
      }
    };
  }, [shareAsset]);

  const occupation = payload?.occupation || null;
  const definition = occupation
    ? language === "zh"
      ? occupation.definitionZh || occupation.definition || "--"
      : occupation.definition || occupation.definitionZh || "--"
    : "--";
  const summary = occupation
    ? language === "zh"
      ? occupation.summaryZh || occupation.summary
      : occupation.summary
    : "--";
  const displayTitle = occupation
    ? language === "zh"
      ? entryLabel || occupation.titleZh || occupation.title
      : occupation.title
    : "--";
  const evidence = occupation
    ? language === "zh"
      ? occupation.evidenceZh?.length
        ? occupation.evidenceZh
        : occupation.evidence
      : occupation.evidence
    : [];
  const tasks = occupation ? occupation.tasks : [];
  const monthlyAirs = occupation?.monthlyAirs?.length
    ? occupation.monthlyAirs
    : occupation
      ? Array.from({ length: 12 }, () => Number(occupation.airs || 0))
      : [];

  const trendPolyline = useMemo(() => {
    if (!monthlyAirs.length) return "";
    const max = Math.max(...monthlyAirs, 100);
    const min = Math.min(...monthlyAirs, 0);
    const width = 720;
    const height = 240;
    return monthlyAirs
      .map((value, index) => {
        const x = (index / Math.max(monthlyAirs.length - 1, 1)) * width;
        const y = height - ((value - min) / Math.max(max - min, 1)) * height;
        return `${x},${y}`;
      })
      .join(" ");
  }, [monthlyAirs]);

  const breakdown = occupation
    ? [
        { key: "replacement", label: copy.breakdownLabels.replacement, value: Number(occupation.replacement || 0) },
        { key: "augmentation", label: copy.breakdownLabels.augmentation, value: Number(occupation.augmentation || 0) },
        { key: "hiring", label: copy.breakdownLabels.hiring, value: Number(occupation.hiring || 0) },
        { key: "historical", label: copy.breakdownLabels.historical, value: Number(occupation.historical || 0) }
      ]
    : [];
  const shareBreakdownLabels = language === "zh"
    ? {
        replacement: "侵蚀率",
        augmentation: "改写率",
        hiring: "招聘影响",
        historical: "累计渗透"
      }
    : {
        replacement: "Erosion rate",
        augmentation: "Rewrite rate",
        hiring: "Hiring impact",
        historical: "Cumulative penetration"
      };
  const shareCaption = getDesktopShareCopy(language);

  const createShareImage = async () => {
    if (!occupation) return;
    setGenerating(true);
    setShareError(null);
    setShareNotice(null);

    try {
      const dataUrl = await renderOccupationShareImage({
        occupation,
        averageAirs,
        language,
        themeMode: theme,
        qrText: "airsindex.com",
        copy: {
          appName: copy.appName,
          currentAirsLabel: copy.currentAirsLabel,
          globalAverageLabel: copy.globalAverageLabel,
          readingTitle: copy.readKicker,
          breakdownTitle: copy.breakdownTitle,
          breakdownLabels: shareBreakdownLabels,
          noReading: copy.noReading,
          shareImageQrNote: copy.shareQrDescription,
          footerCopyright: copy.footerCopyright
        }
      });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      if (shareAsset?.objectUrl) URL.revokeObjectURL(shareAsset.objectUrl);
      const fileName = `airs-desktop-share-${occupation.socCode}.png`;
      const objectUrl = URL.createObjectURL(blob);
      setShareAsset({
        objectUrl,
        fileName,
        file: new File([blob], fileName, { type: blob.type || "image/png" })
      });
      setShareNotice(copy.shareReady);
    } catch {
      setShareError(copy.shareError);
    } finally {
      setGenerating(false);
    }
  };

  const handlePlatformShare = async (platform: SharePlatform) => {
    if (!shareAsset) return;
    const result = await shareGeneratedImage({
      asset: shareAsset,
      language,
      platform,
      shareText: shareCaption
    });

    if (result.status === "cancelled") {
      return;
    }

    setShareError(null);
    setShareNotice(result.status === "fallback" ? result.message : null);
  };

  useNumberedBoxes(pageRef, [
    socCode,
    language,
    loading,
    error,
    occupation?.socCode,
    occupation?.airs,
    tasks.length,
    evidence.length
  ]);

  return (
    <div className="airs-shell">
      <div ref={pageRef} className="airs-page">
        <header data-numbered-box className="airs-panel flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="airs-button" onClick={() => navigate("/")}>
              {copy.backToUniverse}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] md:min-w-[460px] md:items-center">
            <SearchCombobox
              language={language}
              placeholder={copy.detailSearchPlaceholder}
              analyticsSource="desktop-detail"
              onCommit={(query, selected, payload) => {
                void trackSearchEvent({
                  query,
                  source: "desktop-detail",
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
              className="sm:min-w-[260px] md:min-w-[320px]"
            />
            <div className="justify-self-start sm:justify-self-end">
              <ThemeSwitch language={language} theme={theme} onChange={setTheme} />
            </div>
            <div className="justify-self-start sm:justify-self-end">
              <LanguageSwitch language={language} onChange={setLanguage} />
            </div>
          </div>
        </header>

        <section id="overview" className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_360px]">
          <div className="space-y-6">
            <article data-numbered-box className="airs-panel px-6 py-8 md:px-8 md:py-10">
              <p className="airs-kicker">{copy.detailKicker}</p>
              {loading ? (
                <div className="mt-6 space-y-4">
                  <div className="h-16 w-3/4 rounded-3xl bg-white/5" />
                  <div className="h-6 w-1/3 rounded-full bg-white/5" />
                </div>
              ) : error ? (
                <div className="mt-6 space-y-4">
                  <h1 className="airs-title-xl max-w-[12ch]">{language === "zh" ? "当前无法读取该职业的实时数据" : "Unable to read this occupation right now"}</h1>
                  <p className="airs-copy">{error}</p>
                </div>
              ) : occupation ? (
                <div className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <h1 className="airs-title-xl max-w-[12ch]">
                      {displayTitle}
                    </h1>
                    <div className="flex flex-wrap gap-2">
                      <span className="airs-chip">{occupation.socCode}</span>
                      <span className="airs-chip">{labelText(language, occupation.label)}</span>
                    </div>
                  </div>

                  <article data-numbered-box className="rounded-[28px] border border-white/8 bg-black/10 px-5 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="airs-kicker">{copy.definitionKicker}</p>
                        <p className="mt-4 text-base leading-8 text-white/78">{definition}</p>
                      </div>
                      <span className="airs-chip">BLS / SOC</span>
                    </div>
                  </article>

                  <article data-numbered-box className="rounded-[28px] border border-white/8 bg-black/10 px-5 py-5">
                    <p className="airs-kicker">{copy.readKicker}</p>
                    <p className="mt-4 text-lg leading-8 text-white/82">{summary}</p>
                  </article>
                </div>
              ) : null}
            </article>

            <article id="breakdown" data-numbered-box className="airs-panel px-6 py-8 md:px-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">{copy.breakdownTitle}</h2>
                </div>
                {occupation && (
                  <span className="airs-chip">
                    AIRS{" "}
                    <span style={getScoreTextStyle(occupation.airs || 0, { highIsDangerous: false, theme })}>
                      {formatNumber(occupation.airs || 0, 1, language)}
                    </span>
                  </span>
                )}
              </div>
              <div className="mt-8 grid gap-4">
                {breakdown.map((item) => (
                  <div key={item.key} data-numbered-box className="rounded-[24px] border border-white/8 bg-black/10 px-5 py-5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-white/65">{item.label}</span>
                      <span className="text-sm font-medium text-white" style={getScoreTextStyle(item.value * 100, { highIsDangerous: true, theme })}>
                        {formatNumber(item.value * 100, 0, language)}%
                      </span>
                    </div>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-200 via-sky-300 to-cyan-400"
                        style={{ width: `${Math.max(4, item.value * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div data-numbered-box className="mt-8 rounded-[28px] border border-white/8 bg-black/10 px-4 py-5 md:px-5">
                <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">{copy.shareModuleTitle}</h3>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="airs-button-primary min-w-[180px] flex-1 sm:flex-none"
                    onClick={() => void createShareImage()}
                  >
                    {generating ? copy.loading : copy.shareGenerate}
                  </button>
                  {shareAsset && (
                    <a
                      href={shareAsset.objectUrl}
                      download={shareAsset.fileName}
                      className="airs-button min-w-[160px] flex-1 text-center sm:flex-none"
                    >
                      {copy.shareSave}
                    </a>
                  )}
                </div>
                {shareAsset && (
                  <div className="mt-3 grid gap-3 lg:grid-cols-3">
                    {(["wechatMoments", "xiaohongshu", "weibo"] as SharePlatform[]).map((platform) => (
                      <button
                        key={platform}
                        type="button"
                        className="airs-button"
                        onClick={() => void handlePlatformShare(platform)}
                      >
                        {getSharePlatformLabel(platform, language)}
                      </button>
                    ))}
                  </div>
                )}
                {shareError && <p className="mt-4 text-sm leading-6 text-amber-200/80">{shareError}</p>}
                {shareNotice && <p className="mt-4 text-sm leading-6 text-white/55">{shareNotice}</p>}

                {shareAsset && (
                  <div className="mt-5 rounded-[24px] border border-white/8 bg-black/10 p-3 md:p-4">
                    <p className="px-3 pt-2 text-sm font-medium text-white/72">{copy.sharePreviewTitle}</p>
                    <img
                      src={shareAsset.objectUrl}
                      alt={`${displayTitle} ${copy.sharePreviewTitle}`}
                      className="mt-3 mx-auto max-h-[720px] w-full rounded-[20px] bg-black/5 object-contain"
                    />
                  </div>
                )}
              </div>

              <div data-numbered-box className="mt-8 rounded-[28px] border border-white/8 bg-black/10 px-5 py-5">
                <p className="airs-kicker">{copy.trendTitle}</p>
                <svg viewBox="0 0 720 240" className="mt-5 w-full overflow-visible">
                  <polyline
                    fill="none"
                    stroke="url(#airs-trend-gradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={trendPolyline}
                  />
                  <defs>
                    <linearGradient id="airs-trend-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
                      <stop offset="0%" stopColor="#8ef0cf" />
                      <stop offset="100%" stopColor="#8bc8ff" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </article>

            <article id="evidence" data-numbered-box className="airs-panel px-6 py-8 md:px-8">
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">{copy.evidenceTitle}</h2>
              <div className="mt-6 space-y-3">
                {evidence.length ? (
                  evidence.map((line) => (
                    <div key={line} data-numbered-box className="rounded-[22px] border border-white/8 bg-black/10 px-4 py-4 text-sm leading-7 text-white/72">
                      {line}
                    </div>
                  ))
                ) : (
                  <div data-numbered-box className="rounded-[22px] border border-white/8 bg-black/10 px-4 py-4 text-sm text-white/55">
                    {copy.evidenceEmpty}
                  </div>
                )}
              </div>
            </article>

            <article data-numbered-box className="airs-panel px-6 py-8 md:px-8">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-4xl">
                  <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">{copy.tasksTitle}</h2>
                  <p className="mt-4 text-sm leading-8 text-white/55">{copy.tasksIntro}</p>
                </div>
                <span className="airs-chip">
                  {formatNumber(tasks.length, 0, language)} {copy.taskCountSuffix}
                </span>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {tasks.length ? (
                  tasks.map((task, index) => {
                    const safeScore = getTaskSafetyScore(task.score);
                    return (
                      <article key={`${task.name}-${index}`} data-numbered-box className="rounded-[24px] border border-white/8 bg-black/10 px-5 py-5">
                        <p className="text-sm text-white/45">{language === "zh" ? "工作内容" : "Task"}</p>
                        <h3 className="mt-4 text-2xl font-semibold leading-tight tracking-[-0.03em] text-white">
                          {language === "zh" ? task.nameZh || task.name : task.name}
                        </h3>
                        <p className="mt-5 text-xl text-white/65">
                          {copy.impactExposure}{" "}
                          <span style={getScoreTextStyle(safeScore, { highIsDangerous: false, theme })}>
                            {formatNumber(safeScore, 0, language)} / 100
                          </span>
                        </p>
                      </article>
                    );
                  })
                ) : (
                  <div data-numbered-box className="rounded-[24px] border border-white/8 bg-black/10 px-5 py-5 text-sm text-white/55">
                    {copy.tasksEmpty}
                  </div>
                )}
              </div>
            </article>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <article data-numbered-box className="airs-panel px-6 py-6">
              <p className="airs-kicker">{copy.statusLabel}</p>
              <p className="mt-4 text-8xl font-semibold tracking-[-0.08em] text-white">
                <span style={getScoreTextStyle(occupation?.airs || 0, { highIsDangerous: false, theme })}>
                  {occupation ? formatNumber(occupation.airs || 0, 0, language) : "--"}
                </span>
              </p>
              <div className="mt-6 rounded-full border border-emerald-300/20 bg-emerald-300/8 px-4 py-3 text-center text-lg font-medium text-white/88">
                {occupation ? labelText(language, occupation.label) : "--"}
              </div>
              <p className="mt-6 text-base leading-8 text-white/65">
                {occupation && Number(occupation.postings || 0) > 0
                  ? language === "zh"
                    ? `当前抓到稳定公开招聘岗位 ${formatNumber(occupation.postings || 0, 0, language)} 个。`
                    : `${formatNumber(occupation.postings || 0, 0, language)} active public openings are currently attached to this occupation.`
                  : language === "zh"
                    ? "当前没有抓到稳定的公开招聘岗位数，因此这里先用美国高校相关专业的公开结果作为就业侧补充参考。"
                    : "No stable public opening count is currently available, so related college outcomes are shown here as a labor-market fallback."}
              </p>
              <div className="mt-6 space-y-3 border-t border-white/8 pt-6">
                <div data-numbered-box className="rounded-[22px] border border-white/8 bg-black/10 px-4 py-4">
                  <p className="text-sm text-white/45">{copy.openPostings}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
                    {formatNumber(occupation?.postings || 0, 0, language)}
                  </p>
                </div>
                <div data-numbered-box className="rounded-[22px] border border-white/8 bg-black/10 px-4 py-4">
                  <p className="text-sm text-white/45">{copy.relatedMedian2Y}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
                    {formatCurrency(occupation?.educationOutcomes?.median2Y, language)}
                  </p>
                </div>
                <div data-numbered-box className="rounded-[22px] border border-white/8 bg-black/10 px-4 py-4">
                  <p className="text-sm text-white/45">{copy.relatedSamples}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
                    {formatNumber(occupation?.educationOutcomes?.programCount || 0, 0, language)}
                  </p>
                </div>
              </div>
              <div data-numbered-box className="mt-6">
                <DataFreshnessPanel
                  compact
                  language={language}
                  fileUpdatedAt={payload?.fileUpdatedAt}
                  generatedAt={payload?.generatedAt}
                  sourceUpdatedAt={payload?.sourceUpdatedAt}
                  datasetVersion={payload?.datasetVersion}
                  syncStatus={payload?.syncStatus}
                />
              </div>
            </article>
          </aside>
        </section>

        <NumberedBox>
          <SiteFooter language={language} />
        </NumberedBox>
      </div>
    </div>
  );
}
