import type { AppTheme } from "../shared/theme";
import type { DominantMoatType, MoatStrengthLevel } from "./moat";

const MOAT_BASE_COLORS: Record<
  DominantMoatType,
  {
    dark: string;
    light: string;
  }
> = {
  complexJudgment: { dark: "#5b8cff", light: "#2f67d6" },
  humanTrust: { dark: "#31c17b", light: "#1c9a61" },
  creativeExpression: { dark: "#9f6bff", light: "#7c4be0" },
  fieldAdaptability: { dark: "#ff9e40", light: "#df7a1a" },
  responsibility: { dark: "#ff6a6a", light: "#d84b4b" }
};

const THEME_TOKENS = {
  dark: {
    textPrimary: "#f7fbff",
    textSecondary: "rgba(247, 251, 255, 0.68)",
    border: "rgba(255, 255, 255, 0.12)",
    borderStrong: "rgba(255, 255, 255, 0.2)",
    surface: "rgba(7, 14, 24, 0.82)",
    surfaceAlt: "rgba(255, 255, 255, 0.04)",
    surfaceStrong: "rgba(4, 10, 18, 0.94)",
    overlay: "rgba(2, 8, 23, 0.58)",
    input: "rgba(255, 255, 255, 0.04)",
    mapBackground:
      "radial-gradient(circle at 15% 18%, rgba(91, 140, 255, 0.18), transparent 30%), radial-gradient(circle at 88% 84%, rgba(255, 106, 106, 0.18), transparent 28%), linear-gradient(140deg, rgba(5, 12, 20, 0.94), rgba(10, 16, 28, 0.92))",
    shadow: "0 28px 84px rgba(2, 8, 15, 0.28)"
  },
  light: {
    textPrimary: "#162235",
    textSecondary: "rgba(22, 34, 53, 0.66)",
    border: "rgba(88, 118, 154, 0.18)",
    borderStrong: "rgba(88, 118, 154, 0.28)",
    surface: "rgba(255, 255, 255, 0.88)",
    surfaceAlt: "rgba(22, 34, 53, 0.04)",
    surfaceStrong: "rgba(248, 251, 255, 0.98)",
    overlay: "rgba(21, 34, 53, 0.14)",
    input: "rgba(255, 255, 255, 0.92)",
    mapBackground:
      "radial-gradient(circle at 15% 18%, rgba(91, 140, 255, 0.2), transparent 30%), radial-gradient(circle at 88% 84%, rgba(255, 126, 126, 0.16), transparent 26%), linear-gradient(140deg, rgba(247, 251, 255, 0.98), rgba(236, 244, 252, 0.98))",
    shadow: "0 22px 72px rgba(52, 72, 98, 0.12)"
  }
} as const;

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const chunk = normalized.length === 3
    ? normalized.split("").map((value) => `${value}${value}`).join("")
    : normalized;
  const value = Number.parseInt(chunk, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

export function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getMoatThemeTokens(theme: AppTheme) {
  return THEME_TOKENS[theme];
}

export function getMoatTypeColor(type: DominantMoatType, theme: AppTheme) {
  return MOAT_BASE_COLORS[type][theme];
}

export function getMoatNodeFill(type: DominantMoatType, level: MoatStrengthLevel, theme: AppTheme) {
  const base = getMoatTypeColor(type, theme);
  const alpha = level === "weak" ? (theme === "dark" ? 0.42 : 0.64) : level === "medium" ? 0.78 : 0.98;
  return withAlpha(base, alpha);
}

export function getMoatNodeStroke(type: DominantMoatType, theme: AppTheme) {
  return withAlpha(getMoatTypeColor(type, theme), theme === "dark" ? 0.9 : 0.82);
}
