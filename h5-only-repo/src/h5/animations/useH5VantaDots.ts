import { useEffect } from "react";
import * as THREE from "three";

type VantaEffect = {
  destroy: () => void;
};

type VantaFactory = (options: Record<string, unknown>) => VantaEffect;

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

function resolveVantaFactory(module: unknown): VantaFactory | null {
  const candidates = [
    module,
    (module as { default?: unknown } | undefined)?.default,
    (module as { default?: { default?: unknown } } | undefined)?.default?.default
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "function") {
      return candidate as VantaFactory;
    }
  }

  return null;
}

export function useH5VantaDots(target: React.RefObject<HTMLElement | null>, options: VantaDotsOptions = {}) {
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
      const factory = resolveVantaFactory(module);
      if (!factory || disposed || !target.current) return;

      effect = factory({
        el: target.current,
        mouseControls: !window.matchMedia("(pointer: coarse)").matches,
        touchControls: true,
        gyroControls: false,
        backgroundColor: options.backgroundColor ?? 0x060b12,
        color: options.color ?? 0xf08b46,
        color2: options.color2 ?? 0x7bcfff,
        spacing: window.innerWidth < 768 ? (options.spacingMobile ?? 34) : (options.spacingDesktop ?? 24),
        size: window.innerWidth < 768 ? (options.sizeMobile ?? 2.1) : (options.sizeDesktop ?? 3),
        showLines: options.showLines ?? true
      });
    });

    return () => {
      disposed = true;
      effect?.destroy();
    };
  }, [target, options.backgroundColor, options.color, options.color2, options.showLines, options.sizeDesktop, options.sizeMobile, options.spacingDesktop, options.spacingMobile]);
}
