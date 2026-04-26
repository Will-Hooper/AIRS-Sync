import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { LanguageSwitch } from "../components/shared/LanguageSwitch";
import { NumberedBox } from "../components/shared/NumberedBox";
import { SearchCombobox } from "../components/shared/SearchCombobox";
import { DataFreshnessPanel } from "../components/shared/DataFreshnessPanel";
import { SiteFooter } from "../components/shared/SiteFooter";
import { ThemeSwitch } from "../components/shared/ThemeSwitch";
import { useEditorMode } from "../editor/EditorProvider";
import { EditableText } from "../editor/components/EditableText";
import { EditorChrome } from "../editor/components/EditorChrome";
import { usePageEditor } from "../editor/usePageEditor";
import { getOccupationDetail, getSummary } from "../lib/api";
import { trackSearchEvent } from "../lib/analytics";
import { getDesktopShareCopy } from "../lib/desktop-share-copy";
import { applyDesktopShareMetadata } from "../lib/desktop-metadata";
import { formatCurrency, formatNumber } from "../lib/format";
import { getHumanMoatFactorEntries, getOccupationUniverseMetrics } from "../lib/human-moat";
import { getInitialLanguage, labelText, messages, normalizeLanguage, persistLanguage, type AppLanguage } from "../lib/i18n";
import type { OccupationDetailPayload, OccupationRow } from "../lib/types";
import { useNumberedBoxes } from "../lib/useNumberedBoxes";
import { getScoreTextStyle } from "../shared/score-color";
import { getSharePlatformLabel, shareGeneratedImage, type GeneratedShareAsset, type SharePlatform } from "../shared/share/share-generated-image";
import { renderOccupationShareImage } from "../shared/share/render-occupation-share-image";
import { useAirsTheme } from "../shared/theme";

function getTaskSafetyScore(value?: number) {
  const normalized = Math.max(0, Math.min(1, Number(value || 0)));
  return Math.round((1 - normalized) * 100);
}

function getOccupationTitle(occupation: OccupationRow, language: AppLanguage, entryLabel = "") {
  if (language === "zh") return entryLabel || occupation.titleZh || occupation.title;
  return occupation.title;
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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [theme, setTheme] = useAirsTheme();
  const pageRef = useRef<HTMLDivElement | null>(null);
  const { isEditMode, exitEditMode, withDebugParam } = useEditorMode();

  const socCode = decodeURIComponent(params.socCode || searchParams.get("soc") || "");
  const copy = messages[language];
  const region = searchParams.get("region") || undefined;
  const date = searchParams.get("date") || undefined;
  const entryLabel = searchParams.get("entry") || "";
  const editor = usePageEditor({
    pageId: "occupation-detail",
    isEditMode,
    onExitEditMode: exitEditMode
  });

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
          navigate(withDebugParam(`/occupation/${encodeURIComponent(nextPayload.occupation.socCode)}?lang=${language}`), { replace: true });
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
  }, [socCode, region, date, language, navigate, withDebugParam]);

  useEffect(() => {
    return () => {
      if (shareAsset?.objectUrl) {
        URL.revokeObjectURL(shareAsset.objectUrl);
      }
    };
  }, [shareAsset]);

  useEffect(() => {
    setShareError(null);
    setShareNotice(null);
    setIsShareModalOpen(false);
    setShareAsset((current) => {
      if (current?.objectUrl) {
        URL.revokeObjectURL(current.objectUrl);
      }
      return null;
    });
  }, [socCode, language]);

  useEffect(() => {
    if (!isShareModalOpen) return;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isShareModalOpen]);

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
  const displayTitle = occupation ? getOccupationTitle(occupation, language, entryLabel) : "--";
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
    if (!occupation || editor.isEditMode) return;
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
    if (!shareAsset || editor.isEditMode) return;
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
    evidence.length,
    editor.currentConfig?.updatedAt,
    editor.isEditMode
  ]);

  const detailPathForSelection = (selectionSocCode: string, label: string) =>
    withDebugParam(`/occupation/${encodeURIComponent(selectionSocCode)}?lang=${language}&entry=${encodeURIComponent(label)}`);

  const scoreValue = Number(occupation?.airs || 0);
  const universeMetrics = useMemo(
    () => (occupation ? getOccupationUniverseMetrics(occupation, language) : null),
    [language, occupation]
  );
  const humanMoatEntries = useMemo(
    () => (occupation ? getHumanMoatFactorEntries(occupation, language) : []),
    [language, occupation]
  );
  const quadrantConclusion = universeMetrics?.quadrant.detailConclusion
    || (language === "zh" ? "当前暂时没有可用的象限结论。" : "No quadrant conclusion is available right now.");

  const openShareModal = async () => {
    if (!occupation || editor.isEditMode) return;
    setIsShareModalOpen(true);
    if (!shareAsset && !generating) {
      await createShareImage();
    }
  };

  return (
    <div className={`airs-result-shell ${editor.isEditMode ? "airs-editor-active" : ""}`.trim()}>
      <EditorChrome editor={editor} language={language} />

      <main ref={pageRef} className="airs-result-main">
        <header data-numbered-box className="airs-result-topbar">
          <button type="button" className="airs-button" onClick={() => navigate(withDebugParam("/"))}>
            {copy.backToUniverse}
          </button>
          <SearchCombobox
            language={language}
            placeholder={copy.detailSearchPlaceholder}
            analyticsSource="desktop-detail"
            buttonPlacement="inline"
            buttonLabel="Thinking"
            buttonLabelClassName="airs-thinking-label"
            suggestionsPlacement="bottom"
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
              navigate(detailPathForSelection(selection.occupation.socCode, selection.label));
            }}
            className="airs-apple-search airs-result-topbar__search"
          />
          <div className="airs-result-topbar__actions">
            <ThemeSwitch compact language={language} theme={theme} onChange={setTheme} />
            <LanguageSwitch compact language={language} onChange={setLanguage} />
          </div>
        </header>

        <section data-numbered-box className="airs-result-hero">
          {loading ? (
            <div className="airs-result-loading">
              <div />
              <div />
              <div />
            </div>
          ) : error ? (
            <div className="airs-result-error">
              <p className="airs-kicker">{copy.detailKicker}</p>
              <h1>{language === "zh" ? "当前无法读取该职业的实时数据" : "Unable to read this occupation right now"}</h1>
              <p>{error}</p>
            </div>
          ) : occupation ? (
            <>
              <div className="airs-result-hero__copy">
                <EditableText
                  editor={editor}
                  moduleId="occupation-overview"
                  fieldName="detailKicker"
                  language={language}
                  as="p"
                  className="airs-kicker"
                  fallback={copy.detailKicker}
                />
                <h1>{displayTitle}</h1>
                <div className="airs-result-hero__chips">
                  <span className="airs-chip">{occupation.socCode}</span>
                  <span className="airs-chip">{labelText(language, occupation.label)}</span>
                </div>
                <p>{summary}</p>
                <p className="airs-result-hero__conclusion">{quadrantConclusion}</p>
              </div>
              <div className="airs-result-score">
                <div className="airs-result-score__value">
                  <span style={getScoreTextStyle(scoreValue, { highIsDangerous: false, theme })}>
                    {formatNumber(scoreValue, 0, language)}
                  </span>
                  <small>AIRS</small>
                </div>
                <div className="airs-result-score__actions">
                  <button type="button" className="airs-button-primary" disabled={editor.isEditMode} onClick={() => void openShareModal()}>
                    {generating ? copy.loading : language === "zh" ? "分享出去" : "Share"}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </section>

        <section className="airs-result-grid">
          <article data-numbered-box className="airs-result-panel airs-result-panel--wide">
            <EditableText
              editor={editor}
              moduleId="occupation-overview"
              fieldName="definitionKicker"
              language={language}
              as="p"
              className="airs-kicker"
              fallback={copy.definitionKicker}
            />
            <p className="airs-result-readable">{definition}</p>
          </article>

          <article data-numbered-box className="airs-result-panel airs-result-panel--wide">
            <EditableText
              editor={editor}
              moduleId="occupation-breakdown"
              fieldName="breakdownTitle"
              language={language}
              as="h2"
              fallback={copy.breakdownTitle}
            />
            <div className="airs-breakdown-list">
              {breakdown.map((item) => (
                <div key={item.key} className="airs-breakdown-row">
                  <div>
                    <span>{item.label}</span>
                    <strong style={getScoreTextStyle(item.value * 100, { highIsDangerous: true, theme })}>
                      {formatNumber(item.value * 100, 0, language)}%
                    </strong>
                  </div>
                  <div className="airs-breakdown-track">
                    <span style={{ width: `${Math.max(4, item.value * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article data-numbered-box className="airs-result-panel">
            <EditableText
              editor={editor}
              moduleId="occupation-breakdown"
              fieldName="trendTitle"
              language={language}
              as="p"
              className="airs-kicker"
              fallback={copy.trendTitle}
            />
            <svg viewBox="0 0 720 240" className="airs-trend-chart">
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
          </article>

          <article data-numbered-box className="airs-result-panel airs-result-panel--wide">
            <EditableText
              editor={editor}
              moduleId="occupation-evidence"
              fieldName="title"
              language={language}
              as="h2"
              fallback={copy.evidenceTitle}
            />
            <div className="airs-evidence-list">
              {evidence.length ? (
                evidence.map((line, index) => <p key={`${line}-${index}`}>{line}</p>)
              ) : (
                <p>{copy.evidenceEmpty}</p>
              )}
            </div>
          </article>

          <article data-numbered-box className="airs-result-panel">
            <p className="airs-kicker">{language === "zh" ? "人的护城河" : "Human moat"}</p>
            <div className="airs-status-score" style={getScoreTextStyle(universeMetrics?.humanMoatScore || 0, { highIsDangerous: false, theme })}>
              {occupation ? formatNumber(universeMetrics?.humanMoatScore || 0, 0, language) : "--"}
            </div>
            <div className="airs-status-label">
              {occupation ? `${language === "zh" ? "护城河等级" : "Moat level"} · ${universeMetrics?.humanMoatLabel}` : "--"}
            </div>
            <div className="airs-human-moat-list">
              {humanMoatEntries.map((entry) => (
                <div key={entry.key} className="airs-human-moat-row">
                  <div>
                    <span>{entry.label}</span>
                    <strong>{formatNumber(entry.value, 0, language)}</strong>
                  </div>
                  <div className="airs-breakdown-track">
                    <span style={{ width: `${Math.max(6, entry.value)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article data-numbered-box className="airs-result-panel airs-result-panel--wide">
            <div className="airs-stat-list">
              <div>
                <span>{language === "zh" ? "AI 替代压力" : "AI Replacement Pressure"}</span>
                <strong>{formatNumber(universeMetrics?.aiReplacementPressure || 0, 0, language)}</strong>
              </div>
              <div>
                <span>{language === "zh" ? "人的护城河等级" : "Human Moat Level"}</span>
                <strong>{universeMetrics?.humanMoatLabel || "--"}</strong>
              </div>
              <div>
                <span>{language === "zh" ? "所属区域" : "Quadrant"}</span>
                <strong>{universeMetrics?.quadrant.label || "--"}</strong>
              </div>
              <div>
                <span>{copy.openPostings}</span>
                <strong>{formatNumber(occupation?.postings || 0, 0, language)}</strong>
              </div>
              <div>
                <span>{copy.relatedMedian2Y}</span>
                <strong>{formatCurrency(occupation?.educationOutcomes?.median2Y, language)}</strong>
              </div>
              <div>
                <span>{copy.relatedSamples}</span>
                <strong>{formatNumber(occupation?.educationOutcomes?.programCount || 0, 0, language)}</strong>
              </div>
            </div>
            <div className="mt-6">
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

          <article data-numbered-box className="airs-result-panel airs-result-panel--wide">
            <div className="airs-panel-heading">
              <div>
                <EditableText
                  editor={editor}
                  moduleId="occupation-tasks"
                  fieldName="title"
                  language={language}
                  as="h2"
                  fallback={copy.tasksTitle}
                />
                <EditableText
                  editor={editor}
                  moduleId="occupation-tasks"
                  fieldName="intro"
                  language={language}
                  as="p"
                  className="airs-result-muted"
                  fallback={copy.tasksIntro}
                />
              </div>
              <span className="airs-chip">
                {formatNumber(tasks.length, 0, language)} {copy.taskCountSuffix}
              </span>
            </div>
            <div className="airs-task-grid">
              {tasks.length ? (
                tasks.map((task, index) => {
                  const safeScore = getTaskSafetyScore(task.score);
                  return (
                    <article key={`${task.name}-${index}`}>
                      <span>{language === "zh" ? "工作内容" : "Task"}</span>
                      <h3>{language === "zh" ? task.nameZh || task.name : task.name}</h3>
                      <p>
                        {copy.impactExposure}{" "}
                        <strong style={getScoreTextStyle(safeScore, { highIsDangerous: false, theme })}>
                          {formatNumber(safeScore, 0, language)} / 100
                        </strong>
                      </p>
                    </article>
                  );
                })
              ) : (
                <p className="airs-result-muted">{copy.tasksEmpty}</p>
              )}
            </div>
          </article>
        </section>

        <NumberedBox>
          <SiteFooter language={language} />
        </NumberedBox>
      </main>

      {isShareModalOpen && (
        <div className="airs-share-modal-backdrop" role="presentation" onClick={() => setIsShareModalOpen(false)}>
          <section
            className="airs-share-modal"
            aria-modal="true"
            role="dialog"
            aria-label={language === "zh" ? "分享出去" : "Share"}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="airs-share-modal__close"
              aria-label={language === "zh" ? "关闭" : "Close"}
              onClick={() => setIsShareModalOpen(false)}
            >
              ×
            </button>
            <h2>{language === "zh" ? "分享出去" : "Share"}</h2>
            {shareError && <p className="airs-result-warning">{shareError}</p>}
            {shareNotice && !shareError && <p className="airs-result-muted">{shareNotice}</p>}
            {generating && !shareAsset ? (
              <p className="airs-result-muted">{copy.loading}</p>
            ) : (
              <>
                {shareAsset && (
                  <div className="airs-share-modal__actions">
                    <a
                      href={editor.isEditMode ? undefined : shareAsset.objectUrl}
                      download={editor.isEditMode ? undefined : shareAsset.fileName}
                      className="airs-button"
                      onClick={(event) => {
                        if (editor.isEditMode) event.preventDefault();
                      }}
                    >
                      {copy.shareSave}
                    </a>
                    {(["wechatMoments", "xiaohongshu", "weibo"] as SharePlatform[]).map((platform) => (
                      <button
                        key={platform}
                        type="button"
                        className="airs-button"
                        disabled={editor.isEditMode}
                        onClick={() => void handlePlatformShare(platform)}
                      >
                        {getSharePlatformLabel(platform, language)}
                      </button>
                    ))}
                  </div>
                )}
                {shareAsset && (
                  <img
                    src={shareAsset.objectUrl}
                    alt={`${displayTitle} ${copy.sharePreviewTitle}`}
                    className="airs-share-preview"
                  />
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
