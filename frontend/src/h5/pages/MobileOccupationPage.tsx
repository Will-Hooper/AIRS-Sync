import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { LanguageSwitch } from "../../components/shared/LanguageSwitch";
import { SearchCombobox } from "../../components/shared/SearchCombobox";
import { SiteFooter } from "../../components/shared/SiteFooter";
import { getOccupationDetail, getSummary } from "../../lib/api";
import { trackSearchEvent } from "../../lib/analytics";
import { formatNumber } from "../../lib/format";
import { getInitialLanguage, labelText, messages, normalizeLanguage, persistLanguage, type AppLanguage } from "../../lib/i18n";
import type { OccupationDetailPayload, OccupationRow } from "../../lib/types";
import { MobileBottomHero } from "../components/MobileBottomHero";
import { renderOccupationShareImage } from "../lib/share-image";

export function MobileOccupationPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [language, setLanguage] = useState<AppLanguage>(() =>
    normalizeLanguage(searchParams.get("lang") || getInitialLanguage(window.location.search))
  );
  const [payload, setPayload] = useState<OccupationDetailPayload | null>(null);
  const [averageAirs, setAverageAirs] = useState<number>(0);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const socCode = decodeURIComponent(params.socCode || "");
  const copy = messages[language];

  useEffect(() => {
    persistLanguage(language);
    const next = new URLSearchParams(searchParams);
    next.set("lang", language);
    setSearchParams(next, { replace: true });
  }, [language, searchParams, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getOccupationDetail(socCode), getSummary()])
      .then(([detail, summary]) => {
        if (cancelled) return;
        setPayload(detail);
        setAverageAirs(summary.avgAirs);
      })
      .catch(() => {
        if (!cancelled) setPayload(null);
      });
    return () => {
      cancelled = true;
    };
  }, [socCode]);

  useEffect(() => {
    return () => {
      if (shareImageUrl) {
        URL.revokeObjectURL(shareImageUrl);
      }
    };
  }, [shareImageUrl]);

  const occupation = payload?.occupation || null;
  const breakdown = useMemo(
    () =>
      occupation
        ? [
            { label: language === "zh" ? "替代压力" : "Replacement", value: Number(occupation.replacement || 0) },
            { label: language === "zh" ? "岗位改写" : "Augmentation", value: Number(occupation.augmentation || 0) },
            { label: language === "zh" ? "招聘兑现" : "Hiring", value: Number(occupation.hiring || 0) },
            { label: language === "zh" ? "历史累计渗透" : "Historical", value: Number(occupation.historical || 0) }
          ]
        : [],
    [language, occupation]
  );

  const createShareImage = async () => {
    if (!occupation) return;
    setGenerating(true);
    try {
      const dataUrl = await renderOccupationShareImage({
        occupation,
        averageAirs,
        language,
        siteUrl: typeof window !== "undefined" ? window.location.href : undefined
      });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      if (shareImageUrl) URL.revokeObjectURL(shareImageUrl);
      const objectUrl = URL.createObjectURL(blob);
      setShareImageUrl(objectUrl);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="airs-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col gap-5">
        <header className="airs-panel flex flex-col gap-4 px-5 py-5">
          <div className="flex items-center justify-between gap-4">
            <button type="button" className="airs-button" onClick={() => navigate(`/m?lang=${language}`)}>
              {copy.backToUniverse}
            </button>
            <LanguageSwitch language={language} onChange={setLanguage} />
          </div>
          <SearchCombobox
            language={language}
            placeholder={copy.h5SearchPlaceholder}
            onCommit={(query, selected) => {
              void trackSearchEvent({
                query,
                source: "h5-detail",
                language,
                occupation: selected
              });
            }}
            onSelect={(nextOccupation: OccupationRow) => {
              navigate(`/m/occupation/${encodeURIComponent(nextOccupation.socCode)}?lang=${language}`);
            }}
          />
        </header>

        <section className="airs-panel flex flex-col gap-6 px-5 py-6">
          {occupation ? (
            <>
              <div className="space-y-3">
                <p className="airs-kicker">{copy.h5ResultTitle}</p>
                <h1 className="text-4xl font-semibold leading-tight tracking-[-0.06em] text-white">
                  {language === "zh" ? occupation.titleZh || occupation.title : occupation.title}
                </h1>
                <div className="flex flex-wrap gap-2">
                  <span className="airs-chip">{occupation.socCode}</span>
                  <span className="airs-chip">{labelText(language, occupation.label)}</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-black/15 px-5 py-6">
                  <p className="text-sm text-white/52">{copy.h5ResultAverage}</p>
                  <p className="mt-4 text-[4rem] font-semibold leading-none tracking-[-0.08em] text-white">
                    {formatNumber(occupation.airs || 0, 1, language)}
                  </p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-black/15 px-5 py-6">
                  <p className="text-sm text-white/52">{copy.h5ResultGlobalAverage}</p>
                  <p className="mt-4 text-[4rem] font-semibold leading-none tracking-[-0.08em] text-white">
                    {formatNumber(averageAirs, 1, language)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="airs-kicker">{copy.shareImageBreakdown}</p>
                <div className="grid gap-3">
                  {breakdown.map((item) => (
                    <div key={item.label} className="rounded-[24px] border border-white/10 bg-black/15 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-white/68">{item.label}</span>
                        <span className="text-sm font-medium text-white">{formatNumber(item.value * 100, 0, language)}%</span>
                      </div>
                      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-200 to-sky-300"
                          style={{ width: `${Math.max(4, item.value * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" className="airs-button-primary flex-1" onClick={() => void createShareImage()}>
                  {generating ? copy.loading : copy.h5ShareButton}
                </button>
                {shareImageUrl && (
                  <a
                    href={shareImageUrl}
                    download={`airs-share-${occupation.socCode}.png`}
                    className="airs-button flex-1 text-center"
                  >
                    {copy.h5SaveImage}
                  </a>
                )}
              </div>

              {shareImageUrl && (
                <div className="rounded-[28px] border border-white/10 bg-black/15 p-3">
                  <img src={shareImageUrl} alt={copy.shareImageTitle} className="w-full rounded-[22px]" />
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-white/55">{copy.h5NoSelection}</p>
          )}
        </section>

        <div className="rounded-[32px] border border-white/10 bg-black/10 px-5 py-4 text-sm leading-7 text-white/62">
          {copy.socSourceNote}
        </div>

        <MobileBottomHero caption={copy.h5BottomCaption} language={language} />
        <SiteFooter language={language} />
      </div>
    </div>
  );
}
