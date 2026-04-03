import { useRef } from "react";
import { useH5VantaDots } from "../animations/useH5VantaDots";
import type { H5Language } from "../lib/language";

interface MobileBottomHeroProps {
  caption: string;
  language: H5Language;
}

export function MobileBottomHero({ caption, language }: MobileBottomHeroProps) {
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  useH5VantaDots(backgroundRef, {
    spacingDesktop: 26,
    spacingMobile: 38,
    sizeDesktop: 2.8,
    sizeMobile: 1.8,
    showLines: true
  });

  return (
    <div className="relative isolate min-h-[220px] overflow-hidden rounded-[32px] border border-white/10 bg-black/20">
      <div ref={backgroundRef} className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/78 to-slate-950/46" />
      <div className={`absolute inset-y-0 ${language === "zh" ? "right-0" : "left-0"} w-1/2 bg-[radial-gradient(circle_at_100%_50%,rgba(255,154,71,0.24),transparent_58%)]`} />
      <div className="relative z-10 flex h-full min-h-[220px] items-end p-6">
        <p className="max-w-[18rem] text-sm leading-7 text-white/72">{caption}</p>
      </div>
    </div>
  );
}
