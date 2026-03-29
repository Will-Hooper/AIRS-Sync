import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LanguageSwitch } from "../../components/shared/LanguageSwitch";
import { SiteFooter } from "../../components/shared/SiteFooter";
import { SearchCombobox } from "../../components/shared/SearchCombobox";
import { getSummary } from "../../lib/api";
import { trackSearchEvent } from "../../lib/analytics";
import { formatDateTime, formatNumber } from "../../lib/format";
import { getInitialLanguage, messages, normalizeLanguage, persistLanguage, type AppLanguage } from "../../lib/i18n";
import { MobileBottomHero } from "../components/MobileBottomHero";

export function MobileHomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [language, setLanguage] = useState<AppLanguage>(() =>
    normalizeLanguage(searchParams.get("lang") || getInitialLanguage(window.location.search))
  );
  const [summaryAverage, setSummaryAverage] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(() => new Date());

  const copy = messages[language];

  useEffect(() => {
    persistLanguage(language);
    const next = new URLSearchParams(searchParams);
    next.set("lang", language);
    setSearchParams(next, { replace: true });
  }, [language, searchParams, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    getSummary()
      .then((payload) => {
        if (!cancelled) setSummaryAverage(payload.avgAirs);
      })
      .catch(() => {
        if (!cancelled) setSummaryAverage(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const subtitle = useMemo(
    () => `${formatDateTime(now, language)} · ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
    [language, now]
  );

  return (
    <div className="airs-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col gap-5">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="airs-kicker">AIRS / H5</p>
            <p className="mt-2 text-sm text-white/55">{subtitle}</p>
            <p className="mt-2 max-w-[24rem] text-sm leading-7 text-white/45">{copy.socSourceNote}</p>
          </div>
          <LanguageSwitch language={language} onChange={setLanguage} />
        </header>

        <section className="airs-panel flex flex-1 flex-col justify-between overflow-hidden px-5 py-7 md:px-6">
          <div className="space-y-6 text-center">
            <div className="space-y-3">
              <p className="airs-kicker">{copy.appName}</p>
              <h1 className="text-4xl font-semibold leading-tight tracking-[-0.06em] text-white">
                {copy.h5Title}
              </h1>
              <p className="mx-auto max-w-[32rem] text-sm leading-7 text-white/62">{copy.h5Intro}</p>
            </div>

            <div className="mx-auto max-w-[420px] space-y-4">
              <SearchCombobox
                language={language}
                placeholder={copy.h5SearchPlaceholder}
                value={query}
                onCommit={(nextQuery, occupation) => {
                  setQuery(nextQuery);
                  void trackSearchEvent({
                    query: nextQuery,
                    source: "h5-home",
                    language,
                    occupation
                  });
                }}
                onSelect={(occupation) => {
                  navigate(`/m/occupation/${encodeURIComponent(occupation.socCode)}?lang=${language}`);
                }}
              />
            </div>

            <div className="rounded-[32px] border border-white/10 bg-black/15 px-5 py-8">
              <p className="text-sm text-white/52">{copy.h5AverageLabel}</p>
              <p className="mt-5 text-[5rem] font-semibold leading-none tracking-[-0.08em] text-white">
                {formatNumber(summaryAverage, 1, language)}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button type="button" className="airs-button-primary" onClick={() => navigate(`/?lang=${language}`)}>
                {copy.h5OpenDesktop}
              </button>
            </div>
          </div>

          <MobileBottomHero caption={copy.h5BottomCaption} language={language} />
        </section>

        <SiteFooter language={language} />
      </div>
    </div>
  );
}
