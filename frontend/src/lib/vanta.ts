import { useEffect } from "react";
import * as THREE from "three";

type VantaEffect = {
  destroy: () => void;
};

interface VantaDotsOptions {
  color?: number;
  color2?: number;
  backgroundColor?: number;
  spacingDesktop?: number;
  spacingMobile?: number;
  sizeDesktop?: number;
  sizeMobile?: number;
  showLines?: boolean;
}

export function useVantaDots(target: React.RefObject<HTMLElement | null>, options: VantaDotsOptions = {}) {
  useEffect(() => {
    const element = target.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let disposed = false;
    let effect: VantaEffect | null = null;

    (window as typeof window & { THREE?: typeof THREE }).THREE = THREE;

    import("vanta/dist/vanta.dots.min").then((module) => {
      const factory = (module as { default?: (options: Record<string, unknown>) => VantaEffect }).default;
      if (!factory || disposed || !target.current) return;

      effect = factory({
        el: target.current,
        mouseControls: !window.matchMedia("(pointer: coarse)").matches,
        touchControls: true,
        gyroControls: false,
        backgroundColor: options.backgroundColor ?? 0x060b12,
        color: options.color ?? 0x7fc1ff,
        color2: options.color2 ?? 0x6fe3c2,
        spacing: window.innerWidth < 768 ? (options.spacingMobile ?? 30) : (options.spacingDesktop ?? 22),
        size: window.innerWidth < 768 ? (options.sizeMobile ?? 2.2) : (options.sizeDesktop ?? 3.1),
        showLines: options.showLines ?? true
      });
    });

    return () => {
      disposed = true;
      effect?.destroy();
    };
  }, [target, options.backgroundColor, options.color, options.color2, options.showLines, options.sizeDesktop, options.sizeMobile, options.spacingDesktop, options.spacingMobile]);
}
