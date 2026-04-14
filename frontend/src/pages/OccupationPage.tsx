import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { LanguageSwitch } from "../components/shared/LanguageSwitch";
import { NumberedBox } from "../components/shared/NumberedBox";
import { SearchCombobox } from "../components/shared/SearchCombobox";
import { DataFreshnessPanel } from "../components/shared/DataFreshnessPanel";
import { SiteFooter } from "../components/shared/SiteFooter";
import { getOccupationDetail } from "../lib/api";
import { trackSearchEvent } from "../lib/analytics";
import { formatCurrency, formatNumber } from "../lib/format";
import { getInitialLanguage, labelText, messages, normalizeLanguage, persistLanguage, type AppLanguage } from "../lib/i18n";
import type { OccupationDetailPayload } from "../lib/types";
import { useNumberedBoxes } from "../lib/useNumberedBoxes";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function OccupationPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [language, setLanguage] = useState<AppLanguage>(() =>
    normalizeLanguage(searchParams.get("lang") || getInitialLanguage(window.location.search))
  );
  const [payload, setPayload] = useState<OccupationDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [socCode]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getOccupationDetail(socCode, { region, date })
      .then((nextPayload) => {
        if (cancelled) return;
        setPayload(nextPayload);
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
        { key: "replacement", label: language === "zh" ? "替代压力" : "Replacement", value: Number(occupation.replacement || 0) },
        { key: "augmentation", label: language === "zh" ? "岗位改写" : "Augmentation", value: Number(occupation.augmentation || 0) },
        { key: "hiring", label: language === "zh" ? "招聘兑现" : "Hiring realization", value: Number(occupation.hiring || 0) },
        { key: "historical", label: language === "zh" ? "历史累计渗透" : "Historical exposure", value: Number(occupation.historical || 0) }
      ]
    : [];

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
        <header data-numbered-box className="airs-panel sticky top-4 z-20 flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="airs-button" onClick={() => navigate("/")}>
              {copy.backToUniverse}
            </button>
            <nav className="flex items-center gap-2 text-sm text-white/55">
              <button type="button" className="rounded-full px-3 py-2 hover:bg-white/5 hover:text-white" onClick={() => scrollToSection("overview")}>
                {language === "zh" ? "概览" : "Overview"}
              </button>
              <button type="button" className="rounded-full px-3 py-2 hover:bg-white/5 hover:text-white" onClick={() => scrollToSection("breakdown")}>
                {language === "zh" ? "分项" : "Breakdown"}
              </button>
              <button type="button" className="rounded-full px-3 py-2 hover:bg-white/5 hover:text-white" onClick={() => scrollToSection("evidence")}>
                {language === "zh" ? "证据" : "Evidence"}
              </button>
            </nav>
          </div>

          <div className="flex flex-col gap-3 md:min-w-[460px] md:flex-row md:items-center md:justify-end">
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
              className="md:min-w-[320px]"
            />
            <LanguageSwitch language={language} onChange={setLanguage} />
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
                  <p className="airs-kicker">{copy.breakdownTitle}</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">{copy.breakdownTitle}</h2>
                </div>
                {occupation && <span className="airs-chip">AIRS {formatNumber(occupation.airs || 0, 1, language)}</span>}
              </div>
              <div className="mt-8 grid gap-4">
                {breakdown.map((item) => (
                  <div key={item.key} data-numbered-box className="rounded-[24px] border border-white/8 bg-black/10 px-5 py-5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-white/65">{item.label}</span>
                      <span className="text-sm font-medium text-white">{formatNumber(item.value * 100, 0, language)}%</span>
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

              <div data-numbered-box className="mt-10 rounded-[28px] border border-white/8 bg-black/10 px-5 py-5">
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
              <p className="airs-kicker">{copy.evidenceTitle}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">{copy.evidenceTitle}</h2>
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
                  <p className="airs-kicker">{copy.tasksTitle}</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">{copy.tasksTitle}</h2>
                  <p className="mt-4 text-sm leading-8 text-white/55">{copy.tasksIntro}</p>
                </div>
                <span className="airs-chip">
                  {formatNumber(tasks.length, 0, language)} {copy.taskCountSuffix}
                </span>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {tasks.length ? (
                  tasks.map((task, index) => (
                    <article key={`${task.name}-${index}`} data-numbered-box className="rounded-[24px] border border-white/8 bg-black/10 px-5 py-5">
                      <p className="text-sm text-white/45">{language === "zh" ? "工作内容" : "Task"}</p>
                      <h3 className="mt-4 text-2xl font-semibold leading-tight tracking-[-0.03em] text-white">
                        {language === "zh" ? task.nameZh || task.name : task.name}
                      </h3>
                      <p className="mt-5 text-xl text-white/65">
                        {copy.impactExposure} {formatNumber(task.score ?? 0, 2, language)}
                      </p>
                    </article>
                  ))
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
                {occupation ? formatNumber(occupation.airs || 0, 0, language) : "--"}
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
