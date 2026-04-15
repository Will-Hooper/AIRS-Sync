import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getSummary } from "../lib/api";
import { trackSearchEvent } from "../lib/analytics";
import { formatDateTime, formatNumber } from "../lib/format";
import type { SummaryPayload } from "../lib/types";
import { MobileBottomHero } from "../components/MobileBottomHero";
import { H5Footer } from "../components/H5Footer";
import { H5LanguageSwitch } from "../components/H5LanguageSwitch";
import { H5NumberedBox } from "../components/H5NumberedBox";
import { H5SearchCombobox } from "../components/H5SearchCombobox";
import { useH5NumberedBoxes } from "../hooks/useH5NumberedBoxes";
import { getH5Copy } from "../lib/copy";
import { getInitialH5Language, normalizeH5Language, persistH5Language, type H5Language } from "../lib/language";

export function MobileHomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [language, setLanguage] = useState<H5Language>(() =>
    normalizeH5Language(searchParams.get("lang") || getInitialH5Language(window.location.search))
  );
  const [summary, setSummary] = useState<SummaryPayload | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(() => new Date());

  const copy = getH5Copy(language);

  useEffect(() => {
    persistH5Language(language);
    const next = new URLSearchParams(searchParams);
    next.set("lang", language);
    setSearchParams(next, { replace: true });
  }, [language, searchParams, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    getSummary()
      .then((payload) => {
        if (!cancelled) {
          setSummary(payload);
          setSummaryError(null);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setSummary(null);
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

  useH5NumberedBoxes(pageRef, [language, query, summary?.avgAirs, summary?.generatedAt, summary?.datasetVersion, summaryError]);

  return (
    <div className="h5-shell">
      <div ref={pageRef} className="h5-page">
        <header data-h5-numbered-box className="h5-numbered h5-panel flex items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="h5-kicker">{copy.moduleKicker}</p>
            <p className="mt-2 text-sm text-white/55">{subtitle}</p>
            <p className="mt-2 max-w-[24rem] text-sm leading-7 text-white/45">{copy.sourceNote}</p>
          </div>
          <H5LanguageSwitch language={language} onChange={setLanguage} />
        </header>

        <section data-h5-numbered-box className="h5-numbered h5-panel flex flex-1 flex-col justify-between overflow-hidden px-5 py-7">
          <div className="space-y-6 text-center">
            <div className="space-y-3">
              <p className="h5-kicker">{copy.appName}</p>
              <h1 className="text-4xl font-semibold leading-tight tracking-[-0.06em] text-white">{copy.homeTitle}</h1>
              <p className="mx-auto max-w-[32rem] text-sm leading-7 text-white/62">{copy.homeIntro}</p>
            </div>

            <div className="mx-auto max-w-[420px] space-y-4">
              <H5SearchCombobox
                language={language}
                placeholder={copy.searchPlaceholder}
                analyticsSource="h5-home"
                value={query}
                onQueryChange={setQuery}
                onCommit={(nextQuery, selection, payload) => {
                  setQuery(nextQuery);
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

            <div data-h5-numbered-box className="h5-numbered rounded-[32px] border border-white/10 bg-black/15 px-5 py-8">
              <p className="text-sm text-white/52">{copy.averageLabel}</p>
              <p className="mt-5 text-[5rem] font-semibold leading-none tracking-[-0.08em] text-white">
                {summaryError ? "--" : formatNumber(summary?.avgAirs, 1, language)}
              </p>
              {summaryError && <p className="mt-4 text-sm text-white/45">{copy.loadError}</p>}
            </div>

          </div>

          <H5NumberedBox>
            <MobileBottomHero caption={copy.bottomCaption} language={language} />
          </H5NumberedBox>
        </section>

        <H5NumberedBox>
          <H5Footer language={language} />
        </H5NumberedBox>
      </div>
    </div>
  );
}
