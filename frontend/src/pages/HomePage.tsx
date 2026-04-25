import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UniverseMap } from "../components/home/UniverseMap";
import { LanguageSwitch } from "../components/shared/LanguageSwitch";
import { NumberedBox } from "../components/shared/NumberedBox";
import { SearchCombobox } from "../components/shared/SearchCombobox";
import { SiteFooter } from "../components/shared/SiteFooter";
import { ThemeSwitch } from "../components/shared/ThemeSwitch";
import { useEditorMode } from "../editor/EditorProvider";
import { EditorChrome } from "../editor/components/EditorChrome";
import { usePageEditor } from "../editor/usePageEditor";
import { getOccupations, getSummary, searchOccupations as searchOccupationMatches } from "../lib/api";
import { trackSearchEvent } from "../lib/analytics";
import { applyDesktopShareMetadata } from "../lib/desktop-metadata";
import { formatDateTime, formatNumber, formatPercent } from "../lib/format";
import { getInitialLanguage, groupText, labelText, messages, normalizeLanguage, persistLanguage, type AppLanguage } from "../lib/i18n";
import type { OccupationQueryParams, OccupationRow, SummaryPayload } from "../lib/types";
import { useNumberedBoxes } from "../lib/useNumberedBoxes";
import { useVantaDots } from "../lib/vanta";
import { getScoreAccentColors, getScoreTextStyle } from "../shared/score-color";
import { useAirsTheme } from "../shared/theme";

const HOME_SECTION_IDS = ["home-search", "home-intro", "home-browse", "home-universe"] as const;
const HOME_NAV_LABELS = ["首页", "这是什么？", "随便逛逛", "职业宇宙图"];

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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function sampleOccupations(occupations: OccupationRow[], count: number) {
  return occupations
    .map((occupation) => ({ occupation, sort: Math.random() }))
    .sort((left, right) => left.sort - right.sort)
    .slice(0, count)
    .map((entry) => entry.occupation);
}

function getOccupationTitle(occupation: OccupationRow, language: AppLanguage) {
  return language === "zh" ? occupation.titleZh || occupation.title : occupation.title;
}

function getOccupationSummary(occupation: OccupationRow, language: AppLanguage) {
  return language === "zh" ? occupation.summaryZh || occupation.summary : occupation.summary;
}

function MotionBackground({
  compact = false,
  theme
}: {
  compact?: boolean;
  theme: "light" | "dark";
}) {
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const isLightTheme = theme === "light";
  useVantaDots(backgroundRef, {
    backgroundColor: isLightTheme ? 0xe7f2ff : 0x060b12,
    color: isLightTheme ? 0x0c82ff : 0x2997ff,
    color2: isLightTheme ? 0x54cbff : 0x0071e3,
    spacingDesktop: compact ? 16 : (isLightTheme ? 18 : 22),
    spacingMobile: 30,
    sizeDesktop: compact ? 2.55 : (isLightTheme ? 3.6 : 3),
    sizeMobile: 1.8
  });

  return (
    <div className="airs-motion-background" aria-hidden="true">
      <div ref={backgroundRef} className="absolute inset-0" />
      <div className="airs-motion-background__shade absolute inset-0" />
      <div className="airs-motion-background__grid absolute inset-0" />
    </div>
  );
}

function HomeSectionNav({
  activeIndex,
  onSelect
}: {
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const offset = (HOME_NAV_LABELS.length / 2 - 0.5 - activeIndex) * 48;

  return (
    <nav className="airs-home-side-nav" aria-label="Home sections">
      <div className="airs-home-side-nav__rail" />
      <div className="airs-home-side-nav__track" style={{ transform: `translate3d(0, ${offset}px, 0)` }}>
        {HOME_NAV_LABELS.map((label, index) => (
          <button
            key={label}
            type="button"
            className={`airs-home-side-nav__item ${index === activeIndex ? "is-active" : ""}`.trim()}
            onClick={() => onSelect(index)}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function SplitFlapValue({
  value,
  animationKey,
  animated = true,
  className = "",
  characterStyle
}: {
  value: string;
  animationKey: number | string;
  animated?: boolean;
  className?: string;
  characterStyle?: CSSProperties;
}) {
  return (
    <span className={`airs-split-flap-value ${className}`.trim()} aria-label={value}>
      {[...value].map((character, index) => (
        <span
          key={`${animationKey}-${index}-${character}`}
          className={`airs-split-flap-value__cell ${/\d/.test(character) ? "is-digit" : "is-mark"} ${animated ? "is-animated" : "is-static"}`.trim()}
          style={{ "--airs-flap-delay": `${index * 0.08}s` } as CSSProperties}
        >
          <span className="airs-split-flap-value__glyph" style={characterStyle}>{character}</span>
        </span>
      ))}
    </span>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [language, setLanguage] = useState<AppLanguage>(() =>
    normalizeLanguage(searchParams.get("lang") || getInitialLanguage(window.location.search))
  );
  const [summary, setSummary] = useState<SummaryPayload | null>(null);
  const [occupations, setOccupations] = useState<OccupationRow[]>([]);
  const [randomOccupations, setRandomOccupations] = useState<OccupationRow[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [selectedSocCode, setSelectedSocCode] = useState<string | null>(null);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [searchProgress, setSearchProgress] = useState(0);
  const [isResultTransitioning, setIsResultTransitioning] = useState(false);
  const [introAnimationKey, setIntroAnimationKey] = useState(0);
  const [browseAnimationKey, setBrowseAnimationKey] = useState(0);
  const [animatedAverageAirs, setAnimatedAverageAirs] = useState(1);
  const [theme, setTheme] = useAirsTheme();
  const trackedDesktopQueryRef = useRef("");
  const skipNextQuerySyncRef = useRef(false);
  const randomCardsReadyRef = useRef(false);
  const resultTransitionTimerRef = useRef<number | null>(null);
  const introAnimationPlayedRef = useRef(false);
  const browseAnimationPlayedRef = useRef(false);
  const searchProgressRef = useRef(0);
  const activeSectionRef = useRef(0);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const { isEditMode, exitEditMode, withDebugParam } = useEditorMode();

  const editor = usePageEditor({
    pageId: "home",
    isEditMode,
    onExitEditMode: exitEditMode
  });

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
        if (!randomCardsReadyRef.current && listPayload.occupations.length) {
          randomCardsReadyRef.current = true;
          setRandomOccupations(sampleOccupations(listPayload.occupations, 3));
        }
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

  useEffect(() => {
    let frame = 0;
    const updateScrollState = () => {
      frame = 0;
      const viewportHeight = Math.max(window.innerHeight, 1);
      const nextProgress = clamp(window.scrollY / (viewportHeight * 0.72), 0, 1);
      if (Math.abs(nextProgress - searchProgressRef.current) > 0.002 || nextProgress === 0 || nextProgress === 1) {
        searchProgressRef.current = nextProgress;
        setSearchProgress(nextProgress);
      }

      const viewportCenter = viewportHeight / 2;
      const nextActive = sectionRefs.current.reduce(
        (best, section, index) => {
          if (!section) return best;
          const rect = section.getBoundingClientRect();
          const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
          return distance < best.distance ? { index, distance } : best;
        },
        { index: 0, distance: Number.POSITIVE_INFINITY }
      ).index;
      if (activeSectionRef.current !== nextActive) {
        activeSectionRef.current = nextActive;
        setActiveSection(nextActive);
      }
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateScrollState);
    };

    updateScrollState();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (resultTransitionTimerRef.current !== null) {
        window.clearTimeout(resultTransitionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (activeSection >= 1 && !introAnimationPlayedRef.current) {
      introAnimationPlayedRef.current = true;
      setIntroAnimationKey((current) => current + 1);
    }
    if (activeSection >= 2 && occupations.length && !browseAnimationPlayedRef.current) {
      browseAnimationPlayedRef.current = true;
      setBrowseAnimationKey((current) => current + 1);
    }
  }, [activeSection, occupations.length]);

  useNumberedBoxes(pageRef, [
    occupations.length,
    selectedSocCode,
    summary?.avgAirs,
    summary?.highRiskCount,
    summary?.occupationCount,
    language,
    loading,
    error,
    editor.currentConfig?.updatedAt,
    editor.isEditMode
  ]);

  const selectedOccupation = occupations.find((occupation) => occupation.socCode === selectedSocCode) || occupations[0] || null;
  const averageAirs = clamp(Number(summary?.avgAirs || 0), 0, 100);
  const erosionShare = 100 - averageAirs;
  const scoreOrbitStyle = {
    "--airs-score-deg": `${(averageAirs / 100) * 360}deg`,
    "--airs-erosion-deg": `${(erosionShare / 100) * 360}deg`
  } as CSSProperties;

  const rewriteShare = useMemo(() => {
    if (!occupations.length) return 0;
    const matching = occupations.filter((occupation) =>
      occupation.label === "restructuring" || occupation.label === "augmenting"
    ).length;
    return matching / occupations.length;
  }, [occupations]);

  useEffect(() => {
    if (!introAnimationKey) {
      setAnimatedAverageAirs(1);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();
    const startValue = 1;
    const targetValue = averageAirs || 1;

    const animate = (now: number) => {
      const progress = clamp((now - startedAt) / 1380, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setAnimatedAverageAirs(startValue + (targetValue - startValue) * eased);
      if (progress < 1) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [averageAirs, introAnimationKey]);

  const buildOccupationPath = useCallback(
    (occupation: OccupationRow, label?: string) => {
      const params = new URLSearchParams({ lang: language });
      if (label) params.set("entry", label);
      return withDebugParam(`/occupation/${encodeURIComponent(occupation.socCode)}?${params.toString()}`);
    },
    [language, withDebugParam]
  );

  const openOccupation = useCallback(
    (occupation: OccupationRow, label?: string) => {
      if (editor.isEditMode) return;
      skipNextQuerySyncRef.current = true;
      setIsResultTransitioning(true);
      if (resultTransitionTimerRef.current !== null) {
        window.clearTimeout(resultTransitionTimerRef.current);
      }
      resultTransitionTimerRef.current = window.setTimeout(() => {
        navigate(buildOccupationPath(occupation, label));
      }, 430);
    },
    [buildOccupationPath, editor.isEditMode, navigate]
  );

  const scrollToSection = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const refreshRandomOccupations = () => {
    if (!occupations.length) return;
    setRandomOccupations(sampleOccupations(occupations, 3));
    setBrowseAnimationKey((current) => current + 1);
  };

  const searchPlaceholder = language === "zh" ? "输入你的工作，搜搜看" : "Enter your job and see";
  const heroTitle = language === "zh" ? "你的工作会被AI取代吗？" : "Will AI replace your job?";
  const floatingSearchStyle = {
    top: `${45 - searchProgress * 35}vh`,
    transform: `translate3d(-50%, -50%, 0) scale(${1 - searchProgress * 0.14})`
  } as CSSProperties;

  const renderSearch = (suggestionsPlacement: "bottom" | "top" = "bottom") => (
    <SearchCombobox
      language={language}
      placeholder={searchPlaceholder}
      value={query}
      analyticsSource="desktop-home"
      buttonPlacement="inline"
      buttonLabel="Thinking"
      buttonLabelClassName="airs-thinking-label"
      suggestionsPlacement={suggestionsPlacement}
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
      onSelect={(selection) => openOccupation(selection.occupation, selection.label)}
      className="airs-apple-search"
    />
  );

  return (
    <div className={`airs-apple-home ${editor.isEditMode ? "airs-editor-active" : ""} ${isResultTransitioning ? "is-folding" : ""}`.trim()}>
      <EditorChrome editor={editor} language={language} />

      <div className="airs-home-brand">AIRS</div>

      <div className="airs-home-controls">
        <ThemeSwitch compact language={language} theme={theme} onChange={setTheme} />
        <LanguageSwitch compact language={language} onChange={setLanguage} />
      </div>

      <HomeSectionNav activeIndex={activeSection} onSelect={scrollToSection} />

      <div className="airs-floating-search" style={floatingSearchStyle}>
        <h1
          className="airs-floating-search__title"
          style={{
            opacity: clamp(1 - searchProgress * 1.35, 0, 1),
            transform: `translateY(${-searchProgress * 18}px)`,
            maxHeight: `${clamp(1 - searchProgress * 1.25, 0, 1) * 120}px`,
            marginBottom: `${clamp(1 - searchProgress * 1.2, 0, 1) * 1.65}rem`,
            overflow: "hidden",
            pointerEvents: searchProgress > 0.72 ? "none" : "auto"
          }}
        >
          {heroTitle}
        </h1>
        {renderSearch(searchProgress > 0.82 ? "bottom" : "bottom")}
      </div>

      <main ref={pageRef} className="airs-home-linear">
        <section
          id={HOME_SECTION_IDS[0]}
          ref={(element) => {
            sectionRefs.current[0] = element;
          }}
          className="airs-home-section airs-home-section--hero"
          data-numbered-box
        >
          <MotionBackground theme={theme} />
        </section>

        <section
          id={HOME_SECTION_IDS[1]}
          ref={(element) => {
            sectionRefs.current[1] = element;
          }}
          className="airs-home-section airs-home-section--intro"
          data-numbered-box
        >
          <div className="airs-section-content airs-intro-layout">
            <div className="airs-section-copy">
              <p className="airs-kicker">AIRS / AI Recruitment Stability Score</p>
              <h2 className={`airs-intro-title ${language === "zh" ? "is-zh" : ""}`.trim()}>
                {language === "zh" ? "分数越高，被AI替代的可能性越小" : "Higher scores mean a lower chance of AI replacement."}
              </h2>
              <p className="airs-intro-description">
                {language === "zh"
                  ? "AIRS，AI Recruitment Stability Score——AI招聘稳定指数。分数越高，越安全；分数越低，越可能被AI取代。我们以美国的职场为追踪对象，综合AI在各行业的应用现状，呈现AI对当下工作的影响：哪些岗位已经被改变，哪些岗位已经被取代。"
                  : "AIRS, the AI Recruitment Stability Score. Higher scores mean safer work; lower scores mean a higher chance of AI replacement. We track the U.S. labor market and combine it with current AI adoption across industries to show which roles have changed and which have already been displaced."}
              </p>
            </div>

            <div className="airs-intro-visual" aria-label="AIRS scoring explanation">
              <div className={`airs-score-orbit ${introAnimationKey ? "is-awake" : ""}`.trim()} style={scoreOrbitStyle}>
                <div className="airs-score-orbit__sweep" aria-hidden="true" />
                <div className="airs-score-orbit__inner">
                  <span>{formatNumber(animatedAverageAirs, 1, language)}</span>
                </div>
                <small className="airs-score-orbit__label">{language === "zh" ? "当前职业平均AIRS" : "Average occupation AIRS"}</small>
              </div>
              <div className="airs-intro-metrics">
                <article>
                  <span className="airs-intro-metric-value">
                    <SplitFlapValue
                      value={formatNumber(summary?.highRiskCount || 0, 0, language)}
                      animationKey={`intro-risk-${introAnimationKey}`}
                      animated={Boolean(introAnimationKey)}
                    />
                  </span>
                  <p>{language === "zh" ? "职业进入高风险带" : "occupations in the highest-risk band"}</p>
                </article>
                <article>
                  <span className="airs-intro-metric-value">
                    <SplitFlapValue
                      value={formatPercent(rewriteShare, 0, language)}
                      animationKey={`intro-rewrite-${introAnimationKey}`}
                      animated={Boolean(introAnimationKey)}
                    />
                  </span>
                  <p>{language === "zh" ? "职业正在被增强或重构" : "occupations augmenting or restructuring"}</p>
                </article>
              </div>
            </div>

            <div className="airs-intro-cards">
              <article>
                <span>High</span>
                <h3>{language === "zh" ? "更稳定" : "More stable"}</h3>
                <p>{language === "zh" ? "招聘仍有韧性，AI 还没有明显压缩岗位结构。" : "Hiring remains resilient and the role is less compressed by AI."}</p>
              </article>
              <article>
                <span>Low</span>
                <h3>{language === "zh" ? "更危险" : "More exposed"}</h3>
                <p>{language === "zh" ? "招聘、任务或工作流程已经更早出现 AI 冲击。" : "Hiring, tasks, or workflows are already showing AI pressure."}</p>
              </article>
              <article>
                <span>Now</span>
                <h3>{language === "zh" ? "看真实变化" : "Read live shifts"}</h3>
                <p>{language === "zh" ? "用职业数据解释趋势，而不是只问 AI 会不会取代人。" : "Use occupation data to explain movement, not a binary replacement claim."}</p>
              </article>
            </div>
          </div>
        </section>

        <section
          id={HOME_SECTION_IDS[2]}
          ref={(element) => {
            sectionRefs.current[2] = element;
          }}
          className="airs-home-section airs-home-section--browse"
          data-numbered-box
        >
          <div className="airs-section-content">
            <div className="airs-browse-heading">
              <div className="airs-section-copy airs-section-copy--center">
                <h2>{language === "zh" ? "看看AI冲击落在哪" : "See where AI pressure lands."}</h2>
              </div>
              <button type="button" className="airs-refresh-button" onClick={refreshRandomOccupations} disabled={!occupations.length}>
                {language === "zh" ? "刷新" : "Refresh"}
              </button>
            </div>

            <div className="airs-random-card-grid">
              {(randomOccupations.length ? randomOccupations : occupations.slice(0, 3)).map((occupation) => (
                (() => {
                  const scoreCharacterStyle = getScoreTextStyle(occupation.airs || 0, { highIsDangerous: false, theme });
                  const scoreAccent = getScoreAccentColors(occupation.airs || 0, { highIsDangerous: false, theme });
                  return (
                <article
                  key={occupation.socCode}
                  className="airs-random-card"
                  style={{
                    "--airs-score-card-primary": scoreAccent.primary,
                    "--airs-score-card-secondary": scoreAccent.secondary
                  } as CSSProperties}
                >
                  <div>
                    <span className="airs-random-card__label">{labelText(language, occupation.label)}</span>
                    <h3>{getOccupationTitle(occupation, language)}</h3>
                    <div className="airs-random-card__score">
                      <span>
                        <SplitFlapValue
                          value={formatNumber(occupation.airs || 0, 1, language)}
                          animationKey={`${browseAnimationKey}-${occupation.socCode}`}
                          animated={Boolean(browseAnimationKey)}
                          characterStyle={scoreCharacterStyle}
                        />
                      </span>
                      <small>AIRS</small>
                    </div>
                    <p>{getOccupationSummary(occupation, language) || (language === "zh" ? "暂无解读。" : "No reading available yet.")}</p>
                  </div>
                  <button type="button" className="airs-random-card__button" onClick={() => openOccupation(occupation)}>
                    {language === "zh" ? "查看详情" : "View details"}
                  </button>
                </article>
                  );
                })()
              ))}
              {!loading && !occupations.length && (
                <div className="airs-empty-state">{copy.noData}</div>
              )}
              {loading && !occupations.length && (
                <div className="airs-empty-state">{copy.loading}</div>
              )}
            </div>
          </div>
        </section>

        <section
          id={HOME_SECTION_IDS[3]}
          ref={(element) => {
            sectionRefs.current[3] = element;
          }}
          className="airs-home-section airs-home-section--universe"
          data-numbered-box
        >
          <div className="airs-section-content airs-universe-section">
            <div className="airs-universe-header">
              <div>
                <p className="airs-universe-note">
                  {language === "zh"
                    ? "按照美国劳工部的标准职业分类，这里呈现了800多种职业的 AI 替代压力与人的护城河分布。"
                    : "Using the U.S. Department of Labor standard occupation taxonomy, this map plots more than 800 jobs by AI pressure and human moat."}
                </p>
                <h2 className="airs-universe-title">
                  {language === "zh"
                    ? "职业 AI 生存地图"
                    : "AI Career Survival Map"}
                </h2>
                <p className="airs-universe-subtitle">
                  {language === "zh"
                    ? "横向看 AI 替代压力，越往右越危险；纵向看人的护城河，越往上越难被完全替代。"
                    : "Read AI replacement pressure horizontally and human moat vertically. The farther right, the more exposed; the higher up, the harder it is to replace the job completely."}
                </p>
                <p className="airs-universe-explanation">
                  {language === "zh"
                    ? "越往右，AI 替代压力越大；越往下，人的护城河越弱。右下角，是最危险的位置。"
                    : "The farther right, the stronger the AI replacement pressure. The lower the job sits, the weaker its human moat. The bottom-right corner is the danger zone."}
                </p>
              </div>
              <div className="airs-universe-clock">
                <span>{formatDateTime(now, language)}</span>
                <small>{Intl.DateTimeFormat().resolvedOptions().timeZone}</small>
              </div>
            </div>

            <div className="airs-universe-toolbar">
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
            </div>

            <div className="airs-universe-grid">
              <div className="airs-universe-map-shell">
                {error ? (
                  <div className="airs-empty-state">{error}</div>
                ) : loading ? (
                  <div className="airs-empty-state">{copy.loading}</div>
                ) : (
                  <UniverseMap
                    occupations={occupations}
                    language={language}
                    selectedSocCode={selectedOccupation?.socCode}
                    onSelect={(occupation) => setSelectedSocCode(occupation?.socCode || null)}
                    onOpenOccupation={(occupation) => openOccupation(occupation)}
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
                      axisY: copy.axisY,
                      axisXStart: language === "zh" ? "压力较小" : "Lower pressure",
                      axisXEnd: language === "zh" ? "压力更大" : "Higher pressure",
                      axisYStart: language === "zh" ? "必须依赖人" : "Still needs humans",
                      axisYEnd: language === "zh" ? "容易被流程化" : "Easy to standardize",
                      openDetail: copy.openDetail
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="airs-home-footer">
          <NumberedBox>
            <SiteFooter language={language} />
          </NumberedBox>
        </div>
      </main>
    </div>
  );
}
