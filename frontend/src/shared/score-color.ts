import type { CSSProperties } from "react";
import type { AppTheme } from "./theme";

interface ScoreColorOptions {
  max?: number;
  min?: number;
  highIsDangerous?: boolean;
  theme?: AppTheme;
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface ScoreAccentColors {
  primary: string;
  secondary: string;
}

const DARK_SAFE_PRIMARY = "#67b7ff";
const DARK_SAFE_SECONDARY = "#c5ebff";
const DARK_DANGER_PRIMARY = "#ff7272";
const DARK_DANGER_SECONDARY = "#ffc1b6";

const LIGHT_SAFE_PRIMARY = "#2d6de2";
const LIGHT_SAFE_SECONDARY = "#93c9ff";
const LIGHT_DANGER_PRIMARY = "#d84d69";
const LIGHT_DANGER_SECONDARY = "#ffba9c";

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function hexToRgb(hex: string): RgbColor {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((item) => item + item).join("")
    : normalized;
  const parsed = Number.parseInt(value, 16);
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255
  };
}

function mixColors(left: string, right: string, ratio: number) {
  const normalizedRatio = clamp01(ratio);
  const leftRgb = hexToRgb(left);
  const rightRgb = hexToRgb(right);
  return `rgb(${Math.round(leftRgb.r + (rightRgb.r - leftRgb.r) * normalizedRatio)} ${Math.round(leftRgb.g + (rightRgb.g - leftRgb.g) * normalizedRatio)} ${Math.round(leftRgb.b + (rightRgb.b - leftRgb.b) * normalizedRatio)})`;
}

export function getScoreDangerRatio(value: number, options: ScoreColorOptions = {}) {
  const { min = 0, max = 100, highIsDangerous = true } = options;
  const numericValue = Number.isFinite(value) ? value : min;
  const normalized = clamp01((numericValue - min) / Math.max(max - min, 1));
  return highIsDangerous ? normalized : 1 - normalized;
}

export function getScoreAccentColors(value: number, options: ScoreColorOptions = {}): ScoreAccentColors {
  const theme = options.theme || "dark";
  const dangerRatio = getScoreDangerRatio(value, options);
  const safePrimary = theme === "light" ? LIGHT_SAFE_PRIMARY : DARK_SAFE_PRIMARY;
  const safeSecondary = theme === "light" ? LIGHT_SAFE_SECONDARY : DARK_SAFE_SECONDARY;
  const dangerPrimary = theme === "light" ? LIGHT_DANGER_PRIMARY : DARK_DANGER_PRIMARY;
  const dangerSecondary = theme === "light" ? LIGHT_DANGER_SECONDARY : DARK_DANGER_SECONDARY;

  return {
    primary: mixColors(safePrimary, dangerPrimary, dangerRatio),
    secondary: mixColors(safeSecondary, dangerSecondary, dangerRatio)
  };
}

export function getScoreTextStyle(value: number, options: ScoreColorOptions = {}): CSSProperties {
  const colors = getScoreAccentColors(value, options);
  return {
    backgroundImage: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
    display: "inline-block"
  };
}
