import { startTransition, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HeroSection } from "../components/home/HeroSection";
import { UniverseMap } from "../components/home/UniverseMap";
import { DataFreshnessPanel } from "../components/shared/DataFreshnessPanel";
import { LanguageSwitch } from "../components/shared/LanguageSwitch";
import { NumberedBox } from "../components/shared/NumberedBox";
import { SearchCombobox } from "../components/shared/SearchCombobox";
import { SiteFooter } from "../components/shared/SiteFooter";
import { ThemeSwitch } from "../components/shared/ThemeSwitch";
import { getOccupations, getSummary, searchOccupations as searchOccupationMatches } from "../lib/api";
import { trackSearchEvent } from "../lib/analytics";
import { applyDesktopShareMetadata } from "../lib/desktop-metadata";
import { formatDateTime, formatDateTimeValue, formatNumber, formatPercent } from "../lib/format";
import { getInitialLanguage, groupText, labelText, messages, normalizeLanguage, persistLanguage, type AppLanguage } from "../lib/i18n";
import type { OccupationQueryParams, OccupationRow, SummaryPayload } from "../lib/types";
import { useNumberedBoxes } from "../lib/useNumberedBoxes";
import { getScoreTextStyle } from "../shared/score-color";
import { useAirsTheme } from "../shared/theme";

function buildFilters(params: URLSearchParams, query: string): OccupationQueryParams {
  return {
    date: params.get("date") || undefined,
    region: params.get("region") || undefined,
    majorGroup: params.get("majorGroup") || undefined,
    label: params.get("label") || undefined,
    q: query.trim() || undefined
  };
}

function updateParamState(
  current: URLSearchParams,
  setSearchParams: ReturnType<typeof useSearchParams>[1],
  nextValues: Record<string, string | undefined>
) {
  const next = new URLSearchParams(current);
  Object.entries(nextValues).forEach(([key, value]) => {
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
  });
  startTransition(() => setSearchParams(next, { replace: true }));
}

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [language, setLanguage] = useState<AppLanguage>(() =>
    normalizeLanguage(searchParams.get("lang") || getInitialLanguage(window.location.search))
  );
  const [summary, setSummary] = useState<SummaryPayload | null>(null);
  const [occupations, setOccupations] = useState<OccupationRow[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [selectedSocCode, setSelectedSocCode] = useState<string | null>(null);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useAirsTheme();
  const trackedDesktopQueryRef = useRef("");
  const skipNextQuerySyncRef = useRef(false);
  const pageRef = useRef<HTMLDivElement | null>(null);

  const copy = messages[language];
  const deferredQuery = useDeferredValue(query);
  const searchParamQuery = searchParams.get("q") || "";
  const filters = useMemo(() => buildFilters(searchParams, deferredQuery), [deferredQuery, searchParams]);

  useEffect(() => {
    persistLanguage(language);
    updateParamState(searchParams, setSearchParams, { lang: language || undefined });
  }, [language]);

  useEffect(() => {
    applyDesktopShareMetadata(language);
  }, [language]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useLayoutEffect(() => {
    const resetScroll = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    resetScroll();
    const frame = window.requestAnimationFrame(resetScroll);
    const timeout = window.setTimeout(resetScroll, 64);
    window.addEventListener("pageshow", resetScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      window.removeEventListener("pageshow", resetScroll);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getSummary(filters), getOccupations(filters)])
      .then(([nextSummary, listPayload]) => {
        if (cancelled) return;
        setSummary(nextSummary);
        setOccupations(listPayload.occupations);
        setLabels(listPayload.labels);
        setGroups(listPayload.groups);
        setSelectedSocCode((current) => {
          if (current && listPayload.occupations.some((occupation) => occupation.socCode === current)) {
            return current;
          }
          return listPayload.occupations[0]?.socCode || null;
        });
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : String(reason));
        setSummary(null);
        setOccupations([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters]);

  useEffect(() => {
    setQuery((current) => (current === searchParamQuery ? current : searchParamQuery));
  }, [searchParamQuery]);

  useEffect(() => {
    if (skipNextQuerySyncRef.current) {
      skipNextQuerySyncRef.current = false;
      return;
    }
    updateParamState(searchParams, setSearchParams, { q: deferredQuery.trim() || undefined });
  }, [deferredQuery]);

  useEffect(() => {
    const normalized = deferredQuery.trim();
    if (!normalized || trackedDesktopQueryRef.current === normalized) return;
    trackedDesktopQueryRef.current = normalized;

    let cancelled = false;
    void searchOccupationMatches(normalized)
      .then((payload) => {
        if (cancelled) return;
        return trackSearchEvent({
          query: normalized,
          language,
          source: "desktop-home",
          occupation: payload.primaryResult?.occupation,
          searchLabel: payload.primaryResult?.label,
          matchType: payload.matchType,
          matchedAlias: payload.primaryResult?.matchedAlias,
          resultCount: payload.resultCount,
          isZeroResult: !payload.primaryResult,
          didClickResult: false
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [deferredQuery, language]);

  useNumberedBoxes(pageRef, [
    occupations.length,
    selectedSocCode,
    summary?.avgAirs,
    summary?.highRiskCount,
    summary?.occupationCount,
    language,
    loading,
    error
  ]);

  const selectedOccupation = occupations.find((occupation) => occupation.socCode === selectedSocCode) || occupations[0] || null;

  const rewriteShare = useMemo(() => {
    if (!occupations.length) return 0;
    const matching = occupations.filter((occupation) =>
      occupation.label === "restructuring" || occupation.label === "augmenting"
    ).length;
    return matching / occupations.length;
  }, [occupations]);

  const earliestSignal = useMemo(() => {
    if (!occupations.length) return null;
    return occupations
      .slice()
      .sort((left, right) => Number(left.airs || 0) - Number(right.airs || 0) || Number(right.postings || 0) - Number(left.postings || 0))[0];
  }, [occupations]);

  const concentrationText = language === "zh"
    ? `${summary?.highRiskCount ?? 0} 个职业已进入高风险区。`
    : `${summary?.highRiskCount ?? 0} occupations are already in the highest-risk band.`;
  const rewriteText = language === "zh"
    ? `${formatPercent(rewriteShare, 0, language)} 的职业正处于“AI辅助增强”或“招聘结构调整中”。`
    : `${formatPercent(rewriteShare, 0, language)} of occupations are currently augmenting or restructuring.`;
  const signalValue = earliestSignal
    ? language === "zh"
      ? earliestSignal.titleZh || earliestSignal.title
      : earliestSignal.title
    : "--";
  const signalMeta = earliestSignal
    ? `${earliestSignal.socCode} · AIRS ${formatNumber(earliestSignal.airs || 0, 1, language)}`
    : "--";

  return (
    <div className="airs-shell">
      <div ref={pageRef} className="airs-page">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="airs-kicker">{copy.appName}</p>
            <h2 className="mt-2 text-lg font-medium text-white/80">{copy.appSubtitle}</h2>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitch language={language} theme={theme} onChange={setTheme} />
            <LanguageSwitch language={language} onChange={setLanguage} />
          </div>
        </div>

        <NumberedBox>
          <HeroSection kicker={copy.heroKicker} titleLines={copy.heroTitleLines} text={copy.heroText} />
        </NumberedBox>

        <section className="order-2 grid gap-4 xl:grid-cols-4">
          <article data-numbered-box className="airs-panel flex min-h-[220px] flex-col gap-6 px-6 py-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-white/70">{copy.summaryCards[0].label}</p>
              <span className="airs-chip">{copy.summaryCards[0].code}</span>
            </div>
            <div className="space-y-3">
              <p className="text-6xl font-semibold tracking-[-0.06em] text-white">
                <span style={getScoreTextStyle(summary?.avgAirs || 0, { highIsDangerous: false, theme })}>
                  {summary ? formatNumber(summary.avgAirs, 1, language) : "--"}
                </span>
              </p>
              <p className="text-sm leading-7 text-white/55">
                {language === "zh"
                  ? "平均分越高，代表整体招聘稳定度越高。"
                  : "Higher averages mean the hiring layer remains more stable overall."}
              </p>
            </div>
          </article>

          <article data-numbered-box className="airs-panel flex min-h-[220px] flex-col gap-6 px-6 py-6">
            <div className="flex items-center justify-between gap-3">
              <p className="airs-kicker">{copy.summaryCards[1].code}</p>
              <span className="airs-chip">{copy.summaryCards[1].label}</span>
            </div>
            <div className="space-y-5">
              <h3 className="text-3xl font-semibold leading-tight tracking-[-0.04em] text-white">{copy.summaryTexts.concentrationTitle}</h3>
              <p className="text-4xl font-semibold tracking-[-0.05em] text-white">{formatNumber(summary?.highRiskCount || 0, 0, language)}</p>
              <p className="text-sm leading-7 text-white/55">{concentrationText}</p>
            </div>
          </article>

          <article data-numbered-box className="airs-panel flex min-h-[220px] flex-col gap-6 px-6 py-6">
            <div className="flex items-center justify-between gap-3">
              <p className="airs-kicker">{copy.summaryCards[2].code}</p>
              <span className="airs-chip">{copy.summaryCards[2].label}</span>
            </div>
            <div className="space-y-5">
              <h3 className="text-3xl font-semibold leading-tight tracking-[-0.04em] text-white">{copy.summaryTexts.rewriteTitle}</h3>
              <p className="text-4xl font-semibold tracking-[-0.05em] text-white">
                <span style={getScoreTextStyle(rewriteShare * 100, { highIsDangerous: true, theme })}>
                  {formatPercent(rewriteShare, 0, language)}
                </span>
              </p>
              <p className="text-sm leading-7 text-white/55">{rewriteText}</p>
            </div>
          </article>

          <article data-numbered-box className="airs-panel flex min-h-[220px] flex-col gap-6 px-6 py-6">
            <div className="flex items-center justify-between gap-3">
              <p className="airs-kicker">{copy.summaryCards[3].code}</p>
              <span className="airs-chip">{copy.summaryCards[3].label}</span>
            </div>
            <div className="space-y-5">
              <h3 className="text-3xl font-semibold leading-tight tracking-[-0.04em] text-white">{copy.summaryTexts.signalTitle}</h3>
              <p className="text-xl font-semibold leading-tight text-white">{signalValue}</p>
              <p className="text-sm leading-7 text-white/55">{signalMeta}</p>
            </div>
          </article>
        </section>

        <section className="order-1 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <div data-numbered-box className="airs-panel px-5 py-5 md:px-7 md:py-6 lg:px-8">
            <div className="flex flex-col gap-4 border-b border-white/8 pb-5">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,0.72fr)_minmax(460px,2.06fr)]">
                <label>
                  <select
                    aria-label={copy.group}
                    className="airs-input airs-select appearance-none"
                    value={searchParams.get("majorGroup") || "all"}
                    onChange={(event) =>
                      updateParamState(searchParams, setSearchParams, {
                        majorGroup: event.target.value === "all" ? undefined : event.target.value
                      })
                    }
                  >
                    <option value="all">{copy.allGroups}</option>
                    {groups.map((group) => (
                      <option key={group} value={group}>
                        {groupText(language, group)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <select
                    aria-label={copy.label}
                    className="airs-input airs-select appearance-none"
                    value={searchParams.get("label") || "all"}
                    onChange={(event) =>
                      updateParamState(searchParams, setSearchParams, {
                        label: event.target.value === "all" ? undefined : event.target.value
                      })
                    }
                  >
                    <option value="all">{copy.allLabels}</option>
                    {labels.map((value) => (
                      <option key={value} value={value}>
                        {labelText(language, value)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="md:col-span-2 xl:col-span-1">
                  <SearchCombobox
                    language={language}
                    placeholder={copy.searchPlaceholder}
                    value={query}
                    analyticsSource="desktop-home"
                    buttonPlacement="inline"
                    onQueryChange={setQuery}
                    onCommit={(nextQuery, selection, payload) => {
                      setQuery(nextQuery);
                      void trackSearchEvent({
                        query: nextQuery,
                        source: "desktop-home",
                        language,
                        occupation: selection?.occupation,
                        searchLabel: selection?.label,
                        matchType: payload?.matchType || selection?.matchType,
                        matchedAlias: selection?.matchedAlias,
                        resultCount: payload?.resultCount,
                        isZeroResult: !payload?.primaryResult,
                        didClickResult: Boolean(selection)
                      });
                    }}
                    onSelect={(selection) => {
                      skipNextQuerySyncRef.current = true;
                      navigate(`/occupation/${encodeURIComponent(selection.occupation.socCode)}?lang=${language}&entry=${encodeURIComponent(selection.label)}`);
                    }}
                  />
                </label>
              </div>

              <div className="max-w-[62rem]">
                <p className="airs-kicker">{copy.liveFieldKicker}</p>
                <h2 className="mt-3 text-[2rem] font-semibold leading-tight tracking-[-0.05em] text-white md:text-[3.25rem]">
                  {copy.liveFieldTitle}
                </h2>
              </div>
            </div>

            <div className="mt-5">
              {error ? (
                <div className="airs-panel flex min-h-[480px] items-center justify-center px-6 text-center text-white/50">{error}</div>
              ) : loading ? (
                <div className="airs-panel flex min-h-[480px] items-center justify-center px-6 text-center text-white/50">{copy.loading}</div>
              ) : (
                <UniverseMap
                  occupations={occupations}
                  language={language}
                  selectedSocCode={selectedOccupation?.socCode}
                  onSelect={(occupation) => setSelectedSocCode(occupation?.socCode || null)}
                  emptyText={copy.noData}
                  labels={{
                    zoomIn: copy.zoomIn,
                    zoomOut: copy.zoomOut,
                    resetView: copy.resetView,
                    fullscreenEnter: copy.fullscreenEnter,
                    fullscreenExit: copy.fullscreenExit,
                    axisXTitle: copy.axisXTitle,
                    axisYTitle: copy.axisYTitle,
                    axisX: copy.axisX,
                    axisY: copy.axisY
                  }}
                />
              )}
            </div>
          </div>

          <aside className="grid gap-6">
            <article data-numbered-box className="airs-panel px-6 py-6">
              <p className="airs-kicker">{copy.currentFocus}</p>
              {selectedOccupation ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">
                      {language === "zh" ? selectedOccupation.titleZh || selectedOccupation.title : selectedOccupation.title}
                    </h3>
                    <p className="mt-2 text-sm text-white/45">
                      {selectedOccupation.socCode} · {groupText(language, selectedOccupation.majorGroup)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="airs-chip">{labelText(language, selectedOccupation.label)}</span>
                    <span className="airs-chip">
                      AIRS{" "}
                      <span style={getScoreTextStyle(selectedOccupation.airs || 0, { highIsDangerous: false, theme })}>
                        {formatNumber(selectedOccupation.airs || 0, 1, language)}
                      </span>
                    </span>
                    <span className="airs-chip">{copy.openPostings} {formatNumber(selectedOccupation.postings || 0, 0, language)}</span>
                  </div>
                  <p className="airs-copy">
                    {language === "zh" ? selectedOccupation.summaryZh || selectedOccupation.summary : selectedOccupation.summary}
                  </p>
                  <button
                    type="button"
                    className="airs-button-primary w-full"
                    onClick={() => navigate(`/occupation/${encodeURIComponent(selectedOccupation.socCode)}?lang=${language}`)}
                  >
                    {copy.openDetail}
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-sm text-white/45">{copy.noData}</p>
              )}
            </article>

            <article data-numbered-box className="airs-panel px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="airs-kicker">{copy.localTime}</p>
                  <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">{formatDateTime(now, language)}</p>
                </div>
                <span className="airs-chip">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
              </div>
              <div className="mt-6 grid gap-3">
                <div data-numbered-box className="rounded-[22px] border border-white/8 bg-black/10 px-4 py-4">
                  <p className="text-sm text-white/45">{copy.dataFileUpdatedLabel}</p>
                  <p className="mt-2 text-lg font-medium text-white">
                    {formatDateTimeValue(summary?.fileUpdatedAt || summary?.generatedAt || summary?.updatedAt, language)}
                  </p>
                  <p className="mt-2 text-xs text-white/45">
                    {copy.dataCoverageDateLabel}: {summary?.date || "--"}
                  </p>
                </div>
                <div data-numbered-box className="rounded-[22px] border border-white/8 bg-black/10 px-4 py-4">
                  <p className="text-sm text-white/45">{language === "zh" ? "纳入职业数" : "Occupations in view"}</p>
                  <p className="mt-2 text-lg font-medium text-white">{formatNumber(summary?.occupationCount || occupations.length, 0, language)}</p>
                </div>
              </div>
              <div data-numbered-box className="mt-4">
                <DataFreshnessPanel
                  compact
                  language={language}
                  fileUpdatedAt={summary?.fileUpdatedAt}
                  generatedAt={summary?.generatedAt}
                  sourceUpdatedAt={summary?.sourceUpdatedAt}
                  datasetVersion={summary?.datasetVersion}
                  syncStatus={summary?.syncStatus}
                />
              </div>
              <p className="mt-5 text-sm leading-7 text-white/48">{copy.socSourceNote}</p>
            </article>
          </aside>
        </section>

        <div className="order-3">
          <SiteFooter language={language} />
        </div>
      </div>
    </div>
  );
}
