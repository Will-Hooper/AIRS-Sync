import { useRef } from "react";
import { useH5VantaDots } from "../animations/useH5VantaDots";
import type { H5Language } from "../lib/language";

interface MobileBottomHeroProps {
  caption: string;
  language: H5Language;
  className?: string;
  contentClassName?: string;
}

export function MobileBottomHero({ caption, language, className = "", contentClassName = "" }: MobileBottomHeroProps) {
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  useH5VantaDots(backgroundRef, {
    spacingDesktop: 26,
    spacingMobile: 38,
    sizeDesktop: 2.8,
    sizeMobile: 1.8,
    showLines: true
  });

  return (
    <div className={`h5-bottom-hero relative isolate min-h-[220px] overflow-hidden rounded-[32px] border border-white/10 bg-black/20 ${className}`.trim()}>
      <div ref={backgroundRef} className="absolute inset-0" />
      <div className="h5-bottom-hero-overlay absolute inset-0" />
      <div className={`h5-bottom-hero-glow absolute inset-y-0 ${language === "zh" ? "right-0" : "left-0"} w-1/2`} />
      <div className={`relative z-10 flex h-full min-h-[220px] items-end p-6 ${contentClassName}`.trim()}>
        <p className="h5-bottom-hero-copy max-w-[18rem] text-sm leading-7">{caption}</p>
      </div>
    </div>
  );
}
