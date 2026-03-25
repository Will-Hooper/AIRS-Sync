import { useRef } from "react";
import { useVantaDots } from "../../lib/vanta";

interface HeroSectionProps {
  kicker: string;
  titleLines: readonly string[];
  text: string;
}

export function HeroSection({ kicker, titleLines, text }: HeroSectionProps) {
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  useVantaDots(backgroundRef);

  return (
    <section className="airs-panel relative isolate overflow-hidden px-6 py-8 md:px-10 md:py-10">
      <div ref={backgroundRef} className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/88 via-slate-950/64 to-slate-950/78" />
      <div className="absolute inset-y-0 left-0 w-1/3 bg-[radial-gradient(circle_at_0%_50%,rgba(255,154,71,0.28),transparent_58%)]" />
      <div className="relative z-10 flex min-h-[280px] flex-col justify-end gap-5 md:min-h-[320px]">
        <p className="airs-kicker">{kicker}</p>
        <h1 className="airs-title-xl max-w-[16ch]">
          {titleLines.map((line, index) => (
            <span key={line}>
              {line}
              {index < titleLines.length - 1 && <br />}
            </span>
          ))}
        </h1>
        <p className="max-w-4xl text-base leading-8 text-white/72 md:text-lg">{text}</p>
      </div>
    </section>
  );
}
