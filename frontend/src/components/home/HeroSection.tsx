import { useRef } from "react";
import { useVantaDots } from "../../lib/vanta";

interface HeroSectionProps {
  kicker: string;
  titleLines: readonly string[];
  text: string;
}

export function HeroSection({ kicker, titleLines, text }: HeroSectionProps) {
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const isSingleLineTitle = titleLines.length === 1;
  useVantaDots(backgroundRef, {
    spacingDesktop: 22,
    spacingMobile: 34,
    sizeDesktop: 3,
    sizeMobile: 1.9
  });

  return (
    <section className="airs-panel relative isolate overflow-hidden px-6 py-8 md:px-10 md:py-10">
      <div ref={backgroundRef} className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/88 via-slate-950/64 to-slate-950/78" />
      <div className="absolute right-0 top-0 h-full w-[38%] bg-[radial-gradient(circle_at_100%_45%,rgba(255,154,71,0.32),transparent_58%)]" />
      <div className="absolute right-[8%] top-1/2 hidden h-48 w-48 -translate-y-1/2 rounded-full border border-orange-200/15 bg-[radial-gradient(circle,rgba(255,154,71,0.3),transparent_62%)] blur-[2px] md:block" />
      <div className="relative z-10 flex min-h-[280px] flex-col justify-end gap-5 md:min-h-[320px]">
        <div className={isSingleLineTitle ? "max-w-[84rem]" : "max-w-full"}>
          <p className="airs-kicker">{kicker}</p>
          <h1
            className={`airs-title-xl mt-4 ${
              isSingleLineTitle
                ? "max-w-full tracking-[-0.075em] whitespace-nowrap"
                : "max-w-[14ch]"
            }`}
          >
            {titleLines.map((line, index) => (
              <span key={line}>
                {line}
                {index < titleLines.length - 1 && <br />}
              </span>
            ))}
          </h1>
        </div>
        <p className="max-w-[50rem] text-base leading-8 text-white/72 md:text-lg">{text}</p>
      </div>
    </section>
  );
}
