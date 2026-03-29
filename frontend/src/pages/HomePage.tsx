import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HeroSection } from "../components/home/HeroSection";
import { UniverseMap } from "../components/home/UniverseMap";
import { LanguageSwitch } from "../components/shared/LanguageSwitch";
import { SiteFooter } from "../components/shared/SiteFooter";
import { getOccupations, getSummary } from "../lib/api";
import { trackSearchEvent } from "../lib/analytics";
import { formatDateTime, formatNumber, formatPercent } from "../lib/format";
import { getInitialLanguage, groupText, labelText, messages, normalizeLanguage, persistLanguage, type AppLanguage } from "../lib/i18n";
import type { OccupationQueryParams, OccupationRow, SummaryPayload } from "../lib/types";

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
  const [dates, setDates] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [selectedSocCode, setSelectedSocCode] = useState<string | null>(null);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const trackedDesktopQueryRef = useRef("");

  const copy = messages[language];
  const deferredQuery = useDeferredValue(query);
  const filters = useMemo(() => buildFilters(searchParams, deferredQuery), [deferredQuery, searchParams]);

  useEffect(() => {
    persistLanguage(language);
    updateParamState(searchParams, setSearchParams, { lang: language || undefined });
  }, [language]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
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
        setDates(listPayload.dates);
        setRegions(listPayload.regions);
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
    const nextQuery = searchParams.get("q") || "";
    if (nextQuery !== query) {
      setQuery(nextQuery);
    }
  }, [searchParams, query]);

  useEffect(() => {
    updateParamState(searchParams, setSearchParams, { q: deferredQuery.trim() || undefined });
  }, [deferredQuery]);

  useEffect(() => {
    const normalized = deferredQuery.trim();
    if (!normalized || trackedDesktopQueryRef.current === normalized) return;
    trackedDesktopQueryRef.current = normalized;
    void trackSearchEvent({
      query: normalized,
      language,
      source: "desktop-home"
    });
  }, [deferredQuery, language]);

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
      <div className="airs-page">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="airs-kicker">{copy.appName}</p>
            <h2 className="mt-2 text-lg font-medium text-white/80">{copy.liveFieldKicker}</h2>
          </div>
          <LanguageSwitch language={language} onChange={setLanguage} />
        </div>

        <HeroSection kicker={copy.heroKicker} titleLines={copy.heroTitleLines} text={copy.heroText} />

        <section className="grid gap-4 xl:grid-cols-4">
          <article className="airs-panel flex min-h-[220px] flex-col gap-6 px-6 py-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-white/70">{copy.summaryCards[0].label}</p>
              <span className="airs-chip">{copy.summaryCards[0].code}</span>
            </div>
            <div className="space-y-3">
              <p className="text-6xl font-semibold tracking-[-0.06em] text-white">
                {summary ? formatNumber(summary.avgAirs, 1, language) : "--"}
              </p>
              <p className="text-sm leading-7 text-white/55">
                {language === "zh"
                  ? "平均分越高，代表整体招聘稳定度越高。"
                  : "Higher averages mean the hiring layer remains more stable overall."}
              </p>
            </div>
          </article>

          <article className="airs-panel flex min-h-[220px] flex-col gap-6 px-6 py-6">
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

          <article className="airs-panel flex min-h-[220px] flex-col gap-6 px-6 py-6">
            <div className="flex items-center justify-between gap-3">
              <p className="airs-kicker">{copy.summaryCards[2].code}</p>
              <span className="airs-chip">{copy.summaryCards[2].label}</span>
            </div>
            <div className="space-y-5">
              <h3 className="text-3xl font-semibold leading-tight tracking-[-0.04em] text-white">{copy.summaryTexts.rewriteTitle}</h3>
              <p className="text-4xl font-semibold tracking-[-0.05em] text-white">{formatPercent(rewriteShare, 0, language)}</p>
              <p className="text-sm leading-7 text-white/55">{rewriteText}</p>
            </div>
          </article>

          <article className="airs-panel flex min-h-[220px] flex-col gap-6 px-6 py-6">
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

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <div className="airs-panel px-6 py-6 md:px-8">
            <div className="flex flex-col gap-5 border-b border-white/8 pb-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-4xl">
                  <p className="airs-kicker">{copy.liveFieldKicker}</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white md:text-5xl">{copy.liveFieldTitle}</h2>
                </div>
                {selectedOccupation && (
                  <button
                    type="button"
                    className="airs-button-primary"
                    onClick={() => navigate(`/occupation/${encodeURIComponent(selectedOccupation.socCode)}?lang=${language}`)}
                  >
                    {copy.openDetail}
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <label className="flex flex-col gap-2">
                  <span className="text-sm text-white/55">{copy.date}</span>
                  <select
                    className="airs-input appearance-none"
                    value={searchParams.get("date") || ""}
                    onChange={(event) => updateParamState(searchParams, setSearchParams, { date: event.target.value || undefined })}
                  >
                    <option value="">{dates[dates.length - 1] || "--"}</option>
                    {dates.map((date) => (
                      <option key={date} value={date}>
                        {date}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm text-white/55">{copy.region}</span>
                  <select
                    className="airs-input appearance-none"
                    value={searchParams.get("region") || ""}
                    onChange={(event) => updateParamState(searchParams, setSearchParams, { region: event.target.value || undefined })}
                  >
                    <option value="">{regions[0] || "National"}</option>
                    {regions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm text-white/55">{copy.group}</span>
                  <select
                    className="airs-input appearance-none"
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

                <label className="flex flex-col gap-2">
                  <span className="text-sm text-white/55">{copy.label}</span>
                  <select
                    className="airs-input appearance-none"
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

                <label className="flex flex-col gap-2">
                  <span className="text-sm text-white/55">{copy.searchPlaceholder}</span>
                  <input
                    className="airs-input"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={copy.searchPlaceholder}
                  />
                </label>
              </div>
            </div>

            <div className="mt-6">
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
                    axisX: copy.axisX,
                    axisY: copy.axisY,
                    modes: {
                      market: copy.mapModeMarket,
                      group: copy.mapModeGroup,
                      label: copy.mapModeLabel
                    }
                  }}
                />
              )}
            </div>
          </div>

          <aside className="grid gap-6">
            <article className="airs-panel px-6 py-6">
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
                    <span className="airs-chip">AIRS {formatNumber(selectedOccupation.airs || 0, 1, language)}</span>
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

            <article className="airs-panel px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="airs-kicker">{copy.localTime}</p>
                  <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">{formatDateTime(now, language)}</p>
                </div>
                <span className="airs-chip">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
              </div>
              <div className="mt-6 grid gap-3">
                <div className="rounded-[22px] border border-white/8 bg-black/10 px-4 py-4">
                  <p className="text-sm text-white/45">{language === "zh" ? "最新数据日期" : "Latest data date"}</p>
                  <p className="mt-2 text-lg font-medium text-white">{summary?.date || "--"}</p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-black/10 px-4 py-4">
                  <p className="text-sm text-white/45">{language === "zh" ? "纳入职业数" : "Occupations in view"}</p>
                  <p className="mt-2 text-lg font-medium text-white">{formatNumber(summary?.occupationCount || occupations.length, 0, language)}</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-white/48">{copy.socSourceNote}</p>
            </article>
          </aside>
        </section>

        <SiteFooter language={language} />
      </div>
    </div>
  );
}
