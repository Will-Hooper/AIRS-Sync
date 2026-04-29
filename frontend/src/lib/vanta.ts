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

export function useVantaDots(target: React.RefObject<HTMLElement | null>, options: VantaDotsOptions = {}) {
  useEffect(() => {
    const element = target.current;
    if (!element) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouchFirstViewport = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 820;
    if (prefersReducedMotion) {
      return;
    }

    let disposed = false;
    let effect: VantaEffect | null = null;
    let initFrame = 0;

    (window as typeof window & { THREE?: typeof THREE }).THREE = THREE;

    const initialize = () => {
      const currentElement = target.current;
      if (!currentElement || disposed) return;

      if (currentElement.offsetWidth < 2 || currentElement.offsetHeight < 2) {
        initFrame = window.requestAnimationFrame(initialize);
        return;
      }

      import("vanta/dist/vanta.dots.min")
        .then((module) => {
          const factory = resolveVantaFactory(module);
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
        })
        .catch(() => undefined);
    };

    initFrame = window.requestAnimationFrame(initialize);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(initFrame);
      effect?.destroy();
    };
  }, [target, options.backgroundColor, options.color, options.color2, options.showLines, options.sizeDesktop, options.sizeMobile, options.spacingDesktop, options.spacingMobile]);
}
