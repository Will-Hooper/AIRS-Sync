import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MoatDetailDrawer } from "../../components/moat/MoatDetailDrawer";
import { MoatFilterBar } from "../../components/moat/MoatFilterBar";
import { MoatLandscapeMap } from "../../components/moat/MoatLandscapeMap";
import { MoatSearchField } from "../../components/moat/MoatSearchField";
import { MoatSummaryCards } from "../../components/moat/MoatSummaryCards";
import { getOccupations, getSummary } from "../../lib/api";
import { trackSearchEvent } from "../../lib/analytics";
import { getReadOnlyConfigText, useReadOnlyPageConfig } from "../../editor/readOnly";
import { formatDateTime, formatNumber } from "../../lib/format";
import { buildMoatGridLayout } from "../../lib/moat-layout";
import { createOccupationMoatNodes, type DominantMoatType } from "../../lib/moat";
import { getMoatThemeTokens } from "../../lib/moat-color";
import { calculateMoatSummary } from "../../lib/moat-summary";
import type { OccupationRow, SummaryPayload } from "../../lib/types";
import { MobileBottomHero } from "../components/MobileBottomHero";
import { H5Footer } from "../components/H5Footer";
import { H5LanguageSwitch } from "../components/H5LanguageSwitch";
import { H5NumberedBox } from "../components/H5NumberedBox";
import { H5SearchCombobox } from "../components/H5SearchCombobox";
import { H5ThemeSwitch } from "../components/H5ThemeSwitch";
import { useH5NumberedBoxes } from "../hooks/useH5NumberedBoxes";
import { getH5Copy } from "../lib/copy";
import { getInitialH5Language, normalizeH5Language, persistH5Language, type H5Language } from "../lib/language";
import { buildDesktopHomeHref } from "../lib/navigation";
import { getScoreTextStyle } from "../../shared/score-color";
import { useAirsTheme } from "../../shared/theme";

export function MobileHomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [language, setLanguage] = useState<H5Language>(() =>
    normalizeH5Language(searchParams.get("lang") || getInitialH5Language(window.location.search))
  );
  const [summary, setSummary] = useState<SummaryPayload | null>(null);
  const [occupations, setOccupations] = useState<OccupationRow[]>([]);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [selectedSocCode, setSelectedSocCode] = useState<string | null>(null);
  const [moatSearchQuery, setMoatSearchQuery] = useState("");
  const [moatMajorGroup, setMoatMajorGroup] = useState("all");
  const [moatDominantType, setMoatDominantType] = useState<DominantMoatType | "all">("all");
  const [moatSearchNoResult, setMoatSearchNoResult] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [theme, setTheme] = useAirsTheme();
  const pageConfig = useReadOnlyPageConfig("home");

  const copy = getH5Copy(language);
  const moatThemeTokens = getMoatThemeTokens(theme);
  const homeTitle = getReadOnlyConfigText(pageConfig, "home-hero", "title", language, copy.homeTitle);
  const sourceNote = getReadOnlyConfigText(pageConfig, "home-data-panel", "note", language, copy.sourceNote);

  useEffect(() => {
    persistH5Language(language);
    const next = new URLSearchParams(searchParams);
    next.set("lang", language);
    setSearchParams(next, { replace: true });
  }, [language, searchParams, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getSummary(), getOccupations()])
      .then(([summaryPayload, listPayload]) => {
        if (!cancelled) {
          setSummary(summaryPayload);
          setOccupations(listPayload.occupations);
          setSummaryError(null);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setSummary(null);
          setOccupations([]);
          setSummaryError(reason instanceof Error ? reason.message : copy.loadError);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [copy.loadError]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const subtitle = useMemo(
    () => `${formatDateTime(now, language)} · ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
    [language, now]
  );

  const moatTitle = language === "zh" ? "职业护城河全景图" : "Human Moat Landscape Map";
  const moatSubtitle = language === "zh"
    ? "这不是一个总分榜，而是一张职业世界中人仍然不可替代在哪里的地图。"
    : "This is not a ranking. It is a map of where humans still remain hard to replace across occupations.";
  const moatEmptyText = language === "zh" ? "暂无符合条件的职业，请调整筛选条件。" : "No occupations match the current filter. Please adjust the filters.";
  const moatSearchNoResultText = language === "zh"
    ? "暂未找到该职业，可以尝试输入更通用的职业名称。"
    : "No matching occupation yet. Try a broader occupation name.";
  const moatDataNote = language === "zh"
    ? "护城河展示的是职业中更依赖人的能力结构，不代表职业安全排名，也不等同于 AIRS 分数。"
    : "The moat view shows which human capabilities occupations still depend on. It is not a job safety ranking and it is not the same as the AIRS score.";
  const moatNodes = useMemo(() => createOccupationMoatNodes(occupations), [occupations]);
  const moatLayout = useMemo(() => buildMoatGridLayout(moatNodes), [moatNodes]);
  const moatGroupOptions = useMemo(
    () => [...new Set(moatNodes.map((node) => node.majorGroup))].map((group) => ({
      value: group,
      label: language === "zh"
        ? moatNodes.find((node) => node.majorGroup === group)?.majorGroupCn || group
        : group
    })),
    [language, moatNodes]
  );
  const moatVisibleNodes = useMemo(
    () => (moatMajorGroup === "all" ? moatNodes : moatNodes.filter((node) => node.majorGroup === moatMajorGroup)),
    [moatMajorGroup, moatNodes]
  );
  const moatMatchedNodes = useMemo(
    () => (
      moatDominantType === "all"
        ? moatVisibleNodes
        : moatVisibleNodes.filter((node) => node.dominantMoatType === moatDominantType)
    ),
    [moatDominantType, moatVisibleNodes]
  );
  const moatSummaryItems = useMemo(() => calculateMoatSummary(moatMatchedNodes), [moatMatchedNodes]);
  const selectedMoatNode = useMemo(
    () => moatNodes.find((node) => node.occupationId === selectedSocCode) || null,
    [moatNodes, selectedSocCode]
  );

  useEffect(() => {
    if (selectedSocCode && !moatVisibleNodes.some((node) => node.occupationId === selectedSocCode)) {
      setSelectedSocCode(null);
    }
  }, [moatVisibleNodes, selectedSocCode]);

  useH5NumberedBoxes(pageRef, [language, summary?.avgAirs, summary?.generatedAt, summary?.datasetVersion, summaryError, occupations.length, selectedSocCode]);

  return (
    <div className="h5-shell">
      <div ref={pageRef} className="h5-page">
        <header data-h5-numbered-box className="h5-numbered h5-panel flex items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="h5-kicker">{copy.moduleKicker}</p>
            <p className="mt-2 text-sm text-white/55">{subtitle}</p>
            <p className="mt-2 max-w-[24rem] text-sm leading-7 text-white/45">{sourceNote}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <H5ThemeSwitch language={language} theme={theme} onChange={setTheme} />
            <H5LanguageSwitch language={language} onChange={setLanguage} />
          </div>
        </header>

        <section data-h5-numbered-box className="h5-numbered h5-panel flex flex-1 flex-col justify-between overflow-hidden px-5 py-7">
          <div className="space-y-4 text-center">
            <div className="space-y-2">
              <p className="h5-kicker">{copy.appName}</p>
              <h1 className="text-4xl font-semibold leading-tight tracking-[-0.06em] text-white">{homeTitle}</h1>
            </div>

            <div className="mx-auto max-w-[420px] space-y-4">
              <H5SearchCombobox
                language={language}
                placeholder={copy.searchPlaceholder}
                analyticsSource="h5-home"
                onCommit={(nextQuery, selection, payload) => {
                  void trackSearchEvent({
                    query: nextQuery,
                    source: "h5-home",
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
                  navigate(`/occupation/${encodeURIComponent(selection.occupation.socCode)}?lang=${language}&entry=${encodeURIComponent(selection.label)}`);
                }}
              />
            </div>

            <div className="pt-1">
              <button type="button" className="h5-button-primary w-full" onClick={() => window.location.assign(buildDesktopHomeHref(language))}>
                {copy.openDesktopHome}
              </button>
            </div>
          </div>

          <H5NumberedBox className="h5-panel overflow-hidden">
            <div className="flex h-full flex-col gap-5 px-5 pb-5 pt-7">
              <div className="space-y-3 pr-12 text-center">
                <p className="text-sm text-white/52">{copy.averageLabel}</p>
                <p className="text-[5rem] font-semibold leading-none tracking-[-0.08em] text-white">
                  <span style={getScoreTextStyle(summary?.avgAirs || 0, { highIsDangerous: false, theme })}>
                    {summaryError ? "--" : formatNumber(summary?.avgAirs, 1, language)}
                  </span>
                </p>
                {summaryError && <p className="text-sm leading-6 text-white/45">{copy.loadError}</p>}
              </div>
              <div className="h-px bg-white/8" />
              <div className="flex-1 overflow-hidden rounded-[28px] bg-black/10">
                <MobileBottomHero
                  caption={copy.bottomCaption}
                  language={language}
                  className="h-full min-h-[188px] rounded-[28px] border-0 bg-transparent"
                  contentClassName="min-h-[188px] p-6"
                />
              </div>
              <div className="h-px bg-white/8" />
              <H5Footer language={language} embedded />
            </div>
          </H5NumberedBox>
        </section>

        <section data-h5-numbered-box className="h5-numbered h5-panel overflow-hidden px-4 py-5">
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="h5-kicker">{language === "zh" ? "职业护城河地图" : "Human moat landscape"}</p>
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.05em] text-white">{moatTitle}</h2>
              <p className="text-sm leading-7 text-white/55">{moatSubtitle}</p>
              <div
                className="rounded-[20px] border px-4 py-3 text-[13px] leading-6"
                style={{
                  color: moatThemeTokens.textSecondary,
                  borderColor: moatThemeTokens.border,
                  background: moatThemeTokens.surfaceAlt
                }}
              >
                {moatDataNote}
              </div>
            </div>

            {summaryError ? (
              <div className="h5-empty-state">{summaryError}</div>
            ) : (
              <div className="space-y-3">
                <MoatSummaryCards items={moatSummaryItems} language={language} theme={theme} />
                <MoatFilterBar
                  language={language}
                  theme={theme}
                  compact
                  searchSlot={(
                    <MoatSearchField
                      language={language}
                      theme={theme}
                      nodes={moatNodes}
                      compact
                      placeholder={language === "zh" ? "搜索职业名称" : "Search occupation name"}
                      value={moatSearchQuery}
                      noResultText={moatSearchNoResultText}
                      onQueryChange={setMoatSearchQuery}
                      onNoResultChange={setMoatSearchNoResult}
                      onSelect={(selection) => {
                        setMoatSearchNoResult(null);
                        setMoatSearchQuery(selection.label);
                        setMoatMajorGroup("all");
                        setMoatDominantType("all");
                        setSelectedSocCode(selection.node.occupationId);
                        void trackSearchEvent({
                          query: moatSearchQuery.trim() || selection.label,
                          source: "h5-home",
                          language,
                          occupation: selection.node.occupation,
                          searchLabel: selection.label,
                          matchType: selection.matchType,
                          matchedAlias: selection.matchedAlias,
                          resultCount: 1,
                          isZeroResult: false,
                          didClickResult: true
                        });
                      }}
                    />
                  )}
                  groupOptions={moatGroupOptions}
                  majorGroupValue={moatMajorGroup}
                  dominantMoatValue={moatDominantType}
                  onMajorGroupChange={setMoatMajorGroup}
                  onDominantMoatChange={setMoatDominantType}
                  matchedCount={moatMatchedNodes.length}
                  totalCount={moatNodes.length}
                  noResultText={moatSearchNoResult}
                />

                {!moatMatchedNodes.length ? (
                  <div className="h5-empty-state">{moatEmptyText}</div>
                ) : (
                  <div className="relative">
                    <MoatLandscapeMap
                      layout={moatLayout}
                      language={language}
                      theme={theme}
                      selectedOccupationId={selectedSocCode}
                      visibleMajorGroup={moatMajorGroup}
                      dominantMoatFilter={moatDominantType}
                      emptyText={moatEmptyText}
                      resetViewLabel={language === "zh" ? "回到全局视图" : "Reset view"}
                      onSelect={(node) => {
                        setMoatSearchNoResult(null);
                        setSelectedSocCode(node.occupationId);
                      }}
                      onClearSelection={() => setSelectedSocCode(null)}
                    />
                    <MoatDetailDrawer
                      node={selectedMoatNode}
                      language={language}
                      theme={theme}
                      onClose={() => setSelectedSocCode(null)}
                      onOpenOccupation={(node) => {
                        navigate(`/occupation/${encodeURIComponent(node.occupation.socCode)}?lang=${language}`);
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
