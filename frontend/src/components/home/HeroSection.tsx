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
    <section className="airs-panel relative isolate overflow-hidden px-6 py-6 md:px-10 md:py-7">
      <div ref={backgroundRef} className="absolute inset-0" />
      <div className="airs-hero-overlay absolute inset-0" />
      <div className="airs-hero-glow absolute right-0 top-0 h-full w-[38%]" />
      <div className="airs-hero-orb absolute right-[8%] top-1/2 hidden h-48 w-48 -translate-y-1/2 rounded-full border blur-[2px] md:block" />
      <div className="relative z-10 flex min-h-[220px] flex-col justify-end gap-4 md:min-h-[250px]">
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
        <p className="airs-hero-copy max-w-[50rem] text-base leading-8 md:text-lg">{text}</p>
      </div>
    </section>
  );
}
