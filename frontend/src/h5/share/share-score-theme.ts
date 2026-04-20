import type { H5Language } from "../lib/language";

export interface ShareScoreThemePalette {
  canvasTop: string;
  canvasBottom: string;
  canvasAccent: string;
  panelBg: string;
  panelStroke: string;
  accent: string;
  accentSoft: string;
  textPrimary: string;
  textSecondary: string;
  badgeBg: string;
  badgeText: string;
  breakdownTracks: [string, string, string, string];
}

export interface ShareScoreTheme {
  key: "secure" | "steady" | "watchful" | "strained" | "critical";
  min: number;
  max: number;
  palette: ShareScoreThemePalette;
  rangeLabel: Record<H5Language, string>;
  statusLabel: Record<H5Language, string>;
  headline: Record<H5Language, string>;
}

const SCORE_THEMES: ShareScoreTheme[] = [
  {
    key: "secure",
    min: 81,
    max: 100,
    palette: {
      canvasTop: "#15384e",
      canvasBottom: "#07111b",
      canvasAccent: "rgba(157,255,226,0.18)",
      panelBg: "rgba(7,18,30,0.56)",
      panelStroke: "rgba(255,255,255,0.12)",
      accent: "#9dffe2",
      accentSoft: "rgba(157,255,226,0.16)",
      textPrimary: "#eff8ff",
      textSecondary: "rgba(239,248,255,0.74)",
      badgeBg: "#d8fff1",
      badgeText: "#113647",
      breakdownTracks: ["#9dffe2", "#84d8ff", "#7fd4bc", "#a9c5ff"]
    },
    rangeLabel: {
      zh: "81-100 分 · 高稳定",
      en: "81-100 · Stable"
    },
    statusLabel: {
      zh: "稳定度高",
      en: "High stability"
    },
    headline: {
      zh: "当前更像是 AI 辅助，而不是直接压缩岗位。",
      en: "AI looks more assistive than disruptive right now."
    }
  },
  {
    key: "steady",
    min: 61,
    max: 80,
    palette: {
      canvasTop: "#19364e",
      canvasBottom: "#08111a",
      canvasAccent: "rgba(141,217,255,0.16)",
      panelBg: "rgba(8,19,31,0.58)",
      panelStroke: "rgba(255,255,255,0.11)",
      accent: "#8dd9ff",
      accentSoft: "rgba(141,217,255,0.15)",
      textPrimary: "#eff8ff",
      textSecondary: "rgba(239,248,255,0.72)",
      badgeBg: "#e1f6ff",
      badgeText: "#143447",
      breakdownTracks: ["#8dd9ff", "#9be9d6", "#8abfff", "#f2cb7a"]
    },
    rangeLabel: {
      zh: "61-80 分 · 仍可控",
      en: "61-80 · Controlled"
    },
    statusLabel: {
      zh: "仍在可控区间",
      en: "Still controlled"
    },
    headline: {
      zh: "AI 已进入工作流，但招聘稳定性整体仍然可控。",
      en: "AI is in the workflow, but hiring stability is still manageable."
    }
  },
  {
    key: "watchful",
    min: 41,
    max: 60,
    palette: {
      canvasTop: "#223545",
      canvasBottom: "#0b1118",
      canvasAccent: "rgba(255,208,132,0.14)",
      panelBg: "rgba(11,18,27,0.6)",
      panelStroke: "rgba(255,255,255,0.11)",
      accent: "#ffd084",
      accentSoft: "rgba(255,208,132,0.14)",
      textPrimary: "#f3f7ff",
      textSecondary: "rgba(243,247,255,0.72)",
      badgeBg: "#ffe9c5",
      badgeText: "#4a3420",
      breakdownTracks: ["#ffd084", "#9bb8ff", "#97d3ff", "#f4b278"]
    },
    rangeLabel: {
      zh: "41-60 分 · 开始承压",
      en: "41-60 · Under strain"
    },
    statusLabel: {
      zh: "开始承压",
      en: "Entering pressure"
    },
    headline: {
      zh: "岗位还在，但工作内容和招聘方式已经开始变化。",
      en: "The job remains, but the work and hiring pattern are already shifting."
    }
  },
  {
    key: "strained",
    min: 21,
    max: 40,
    palette: {
      canvasTop: "#2c3042",
      canvasBottom: "#0a0d14",
      canvasAccent: "rgba(255,196,134,0.14)",
      panelBg: "rgba(12,13,21,0.62)",
      panelStroke: "rgba(255,255,255,0.1)",
      accent: "#ffc486",
      accentSoft: "rgba(255,196,134,0.14)",
      textPrimary: "#fff4ee",
      textSecondary: "rgba(255,244,238,0.72)",
      badgeBg: "#ffe1cc",
      badgeText: "#4b281d",
      breakdownTracks: ["#ffc486", "#ff9d7c", "#cab0ff", "#f6cf7d"]
    },
    rangeLabel: {
      zh: "21-40 分 · 压力上来了",
      en: "21-40 · Pressured"
    },
    statusLabel: {
      zh: "明显承压",
      en: "Visible pressure"
    },
    headline: {
      zh: "AI 压力已经明显抬升，岗位结构正在被改写。",
      en: "AI pressure is visibly rising and the role structure is being rewritten."
    }
  },
  {
    key: "critical",
    min: 0,
    max: 20,
    palette: {
      canvasTop: "#2d2134",
      canvasBottom: "#080b12",
      canvasAccent: "rgba(255,152,117,0.16)",
      panelBg: "rgba(12,11,18,0.64)",
      panelStroke: "rgba(255,255,255,0.1)",
      accent: "#ff9875",
      accentSoft: "rgba(255,152,117,0.14)",
      textPrimary: "#fff3f0",
      textSecondary: "rgba(255,243,240,0.72)",
      badgeBg: "#ffd8cf",
      badgeText: "#55241e",
      breakdownTracks: ["#ff9875", "#ff765f", "#d0a1ff", "#ffc27d"]
    },
    rangeLabel: {
      zh: "0-20 分 · 高压预警",
      en: "0-20 · High risk"
    },
    statusLabel: {
      zh: "高压预警",
      en: "High-risk warning"
    },
    headline: {
      zh: "替代和重组风险更高，需要重点观察岗位变化速度。",
      en: "Replacement and restructuring risk are higher here."
    }
  }
];

export function getShareScoreTheme(score: number) {
  const normalizedScore = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
  return SCORE_THEMES.find((item) => normalizedScore >= item.min && normalizedScore <= item.max)
    || SCORE_THEMES[SCORE_THEMES.length - 1];
}
