import type { AppTheme } from "../shared/theme";
import type { DominantMoatType, MoatStrengthLevel } from "./moat";

const MOAT_BASE_COLORS: Record<
  DominantMoatType,
  {
    dark: string;
    light: string;
  }
> = {
  complexJudgment: { dark: "#6ea8ff", light: "#2f6dea" },
  humanTrust: { dark: "#34d59a", light: "#159f70" },
  creativeExpression: { dark: "#bc7cff", light: "#8950f4" },
  fieldAdaptability: { dark: "#ffb254", light: "#e1831f" },
  responsibility: { dark: "#ff7182", light: "#dc4f60" }
};

const THEME_TOKENS = {
  dark: {
    textPrimary: "#f7fbff",
    textSecondary: "rgba(247, 251, 255, 0.68)",
    border: "rgba(255, 255, 255, 0.12)",
    borderStrong: "rgba(255, 255, 255, 0.2)",
    surface: "rgba(7, 14, 24, 0.82)",
    surfaceAlt: "rgba(255, 255, 255, 0.045)",
    surfaceStrong: "rgba(4, 10, 18, 0.94)",
    surfaceRaised: "rgba(10, 18, 30, 0.92)",
    overlay: "rgba(2, 8, 23, 0.58)",
    input: "rgba(255, 255, 255, 0.04)",
    mapBackground:
      "radial-gradient(circle at 14% 16%, rgba(110, 168, 255, 0.12), transparent 30%), radial-gradient(circle at 82% 82%, rgba(255, 113, 130, 0.1), transparent 30%), linear-gradient(150deg, rgba(5, 12, 20, 0.98), rgba(9, 17, 29, 0.96) 48%, rgba(10, 14, 24, 0.98))",
    mapPattern:
      "linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.018) 1px, transparent 1px), radial-gradient(circle at 20% 18%, rgba(110,168,255,0.045), transparent 22%), radial-gradient(circle at 78% 76%, rgba(188,124,255,0.03), transparent 24%)",
    shadow: "0 28px 84px rgba(2, 8, 15, 0.28)",
    shadowStrong: "0 24px 64px rgba(2, 8, 15, 0.3)"
  },
  light: {
    textPrimary: "#162235",
    textSecondary: "rgba(22, 34, 53, 0.66)",
    border: "rgba(88, 118, 154, 0.18)",
    borderStrong: "rgba(88, 118, 154, 0.28)",
    surface: "rgba(255, 255, 255, 0.88)",
    surfaceAlt: "rgba(22, 34, 53, 0.04)",
    surfaceStrong: "rgba(248, 251, 255, 0.98)",
    surfaceRaised: "rgba(255, 255, 255, 0.96)",
    overlay: "rgba(21, 34, 53, 0.14)",
    input: "rgba(255, 255, 255, 0.92)",
    mapBackground:
      "radial-gradient(circle at 14% 16%, rgba(110, 168, 255, 0.16), transparent 30%), radial-gradient(circle at 82% 82%, rgba(255, 113, 130, 0.1), transparent 28%), linear-gradient(152deg, rgba(248, 252, 255, 0.98), rgba(236, 244, 252, 0.98) 46%, rgba(244, 248, 255, 0.98))",
    mapPattern:
      "linear-gradient(90deg, rgba(22,34,53,0.028) 1px, transparent 1px), linear-gradient(180deg, rgba(22,34,53,0.028) 1px, transparent 1px), radial-gradient(circle at 22% 20%, rgba(110,168,255,0.05), transparent 22%), radial-gradient(circle at 78% 76%, rgba(188,124,255,0.03), transparent 24%)",
    shadow: "0 22px 72px rgba(52, 72, 98, 0.12)",
    shadowStrong: "0 22px 52px rgba(52, 72, 98, 0.14)"
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

export function getMoatTypeGlow(type: DominantMoatType, theme: AppTheme, alpha?: number) {
  return withAlpha(getMoatTypeColor(type, theme), alpha ?? (theme === "dark" ? 0.16 : 0.1));
}
