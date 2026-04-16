import type { H5Language } from "../lib/language.ts";
import type { MascotPoseConfig, MascotScenePalette } from "./share-mascot-config.ts";

export type MascotScoreBandKey = "secure" | "steady" | "watchful" | "strained" | "critical";

export interface MascotBandCopy {
  rangeLabel: string;
  badge: string;
  headline: string;
  riskHint: string;
  duoLine: string;
  bullState: string;
  horseState: string;
}

export interface MascotSceneIntensity {
  helperNodes: number;
  systemPanels: number;
  pressureRings: number;
  gridOpacity: number;
  dominantSystem: boolean;
  floorTilt: number;
}

export interface MascotScoreBand {
  key: MascotScoreBandKey;
  min: number;
  max: number;
  palette: MascotScenePalette;
  scene: MascotSceneIntensity;
  bullPose: MascotPoseConfig;
  horsePose: MascotPoseConfig;
  copy: Record<H5Language, MascotBandCopy>;
}

const SECURE_PALETTE: MascotScenePalette = {
  canvasTop: "#15384e",
  canvasBottom: "#0a1723",
  panelTop: "#2a5d72",
  panelBottom: "#152738",
  panelStroke: "rgba(255,255,255,0.14)",
  glow: "#9dffe2",
  glowSoft: "rgba(157,255,226,0.24)",
  helper: "#9dffe2",
  helperSoft: "rgba(157,255,226,0.18)",
  system: "#85ccff",
  systemSoft: "rgba(133,204,255,0.14)",
  alert: "#ffd86f",
  floor: "#0f2436",
  floorShadow: "rgba(2,9,18,0.42)",
  badgeBg: "#d8fff1",
  badgeText: "#113647",
  dockBg: "rgba(8,18,30,0.52)",
  dockLine: "rgba(255,255,255,0.12)",
  textPrimary: "#eff8ff",
  textSecondary: "rgba(239,248,255,0.76)"
};

const STEADY_PALETTE: MascotScenePalette = {
  canvasTop: "#18334a",
  canvasBottom: "#0b1521",
  panelTop: "#27485f",
  panelBottom: "#131f31",
  panelStroke: "rgba(255,255,255,0.13)",
  glow: "#8dd9ff",
  glowSoft: "rgba(141,217,255,0.21)",
  helper: "#91f0db",
  helperSoft: "rgba(145,240,219,0.16)",
  system: "#95c5ff",
  systemSoft: "rgba(149,197,255,0.16)",
  alert: "#ffd88c",
  floor: "#0f2135",
  floorShadow: "rgba(3,9,18,0.46)",
  badgeBg: "#e1f6ff",
  badgeText: "#143447",
  dockBg: "rgba(8,18,30,0.54)",
  dockLine: "rgba(255,255,255,0.11)",
  textPrimary: "#eff8ff",
  textSecondary: "rgba(239,248,255,0.75)"
};

const WATCHFUL_PALETTE: MascotScenePalette = {
  canvasTop: "#213446",
  canvasBottom: "#0d131d",
  panelTop: "#37495d",
  panelBottom: "#17222f",
  panelStroke: "rgba(255,255,255,0.13)",
  glow: "#9cc7ff",
  glowSoft: "rgba(156,199,255,0.18)",
  helper: "#ffd084",
  helperSoft: "rgba(255,208,132,0.14)",
  system: "#9ca8ff",
  systemSoft: "rgba(156,168,255,0.18)",
  alert: "#ffcf77",
  floor: "#132031",
  floorShadow: "rgba(3,8,16,0.48)",
  badgeBg: "#ffe9c5",
  badgeText: "#4a3420",
  dockBg: "rgba(9,16,26,0.56)",
  dockLine: "rgba(255,255,255,0.1)",
  textPrimary: "#f3f7ff",
  textSecondary: "rgba(243,247,255,0.74)"
};

const STRAINED_PALETTE: MascotScenePalette = {
  canvasTop: "#2c3042",
  canvasBottom: "#0d1018",
  panelTop: "#4f4050",
  panelBottom: "#1c1a26",
  panelStroke: "rgba(255,255,255,0.12)",
  glow: "#ffc486",
  glowSoft: "rgba(255,196,134,0.2)",
  helper: "#ffbf73",
  helperSoft: "rgba(255,191,115,0.16)",
  system: "#c8afff",
  systemSoft: "rgba(200,175,255,0.18)",
  alert: "#ff8e6f",
  floor: "#181e2d",
  floorShadow: "rgba(4,6,12,0.54)",
  badgeBg: "#ffe1cc",
  badgeText: "#4b281d",
  dockBg: "rgba(9,12,20,0.6)",
  dockLine: "rgba(255,255,255,0.1)",
  textPrimary: "#fff4ee",
  textSecondary: "rgba(255,244,238,0.74)"
};

const CRITICAL_PALETTE: MascotScenePalette = {
  canvasTop: "#2d2134",
  canvasBottom: "#090c13",
  panelTop: "#4f3245",
  panelBottom: "#18131f",
  panelStroke: "rgba(255,255,255,0.11)",
  glow: "#ff9875",
  glowSoft: "rgba(255,152,117,0.2)",
  helper: "#ff9f78",
  helperSoft: "rgba(255,159,120,0.16)",
  system: "#d0a1ff",
  systemSoft: "rgba(208,161,255,0.2)",
  alert: "#ff765f",
  floor: "#181623",
  floorShadow: "rgba(3,5,10,0.6)",
  badgeBg: "#ffd8cf",
  badgeText: "#55241e",
  dockBg: "rgba(9,11,18,0.62)",
  dockLine: "rgba(255,255,255,0.08)",
  textPrimary: "#fff3f0",
  textSecondary: "rgba(255,243,240,0.74)"
};

export const SHARE_MASCOT_SCORE_BANDS: MascotScoreBand[] = [
  {
    key: "secure",
    min: 81,
    max: 100,
    palette: SECURE_PALETTE,
    scene: { helperNodes: 4, systemPanels: 2, pressureRings: 1, gridOpacity: 0.16, dominantSystem: false, floorTilt: -2 },
    bullPose: {
      bodyTilt: -4, headTilt: -6, bodyYOffset: -2, squishX: 1, squishY: 1, eyeOpen: 1, browTilt: -0.1, smile: 0.92,
      foreLegLift: 16, hindLegLift: 4, pressure: 0.08, sweatDrops: 0, tailLift: 14, pupilOffsetX: 0, pupilOffsetY: 0
    },
    horsePose: {
      bodyTilt: 3, headTilt: 8, bodyYOffset: -10, squishX: 0.98, squishY: 1.03, eyeOpen: 1, browTilt: -0.2, smile: 0.88,
      foreLegLift: 24, hindLegLift: 12, pressure: 0.06, sweatDrops: 0, tailLift: 24, pupilOffsetX: 2, pupilOffsetY: -1
    },
    copy: {
      zh: {
        rangeLabel: "81-100 分 · 高稳定",
        badge: "稳稳拿捏",
        headline: "AI 更像辅助工具，整体节奏还在牛马手里。",
        riskHint: "高分代表岗位更稳定，牛更松弛可靠，马更轻快自信，周围 AI 元素只在打辅助。",
        duoLine: "牛更松弛，马更轻快",
        bullState: "可靠、笃定、松弛",
        horseState: "机灵、轻快、自信"
      },
      en: {
        rangeLabel: "81-100 · Stable",
        badge: "In control",
        headline: "AI behaves more like a helper than a boss here.",
        riskHint: "Higher scores mean stronger stability. The bull stays loose and dependable, while the horse stays bright and nimble.",
        duoLine: "Bull stays loose, horse stays light",
        bullState: "steady, reliable, loose",
        horseState: "nimble, bright, confident"
      }
    }
  },
  {
    key: "steady",
    min: 61,
    max: 80,
    palette: STEADY_PALETTE,
    scene: { helperNodes: 4, systemPanels: 3, pressureRings: 2, gridOpacity: 0.18, dominantSystem: false, floorTilt: 0 },
    bullPose: {
      bodyTilt: -2, headTilt: -2, bodyYOffset: 2, squishX: 1, squishY: 0.99, eyeOpen: 0.92, browTilt: 0.04, smile: 0.4,
      foreLegLift: 8, hindLegLift: 2, pressure: 0.18, sweatDrops: 0, tailLift: 8, pupilOffsetX: 0, pupilOffsetY: 0
    },
    horsePose: {
      bodyTilt: 4, headTilt: 6, bodyYOffset: -2, squishX: 1, squishY: 1, eyeOpen: 0.94, browTilt: 0.1, smile: 0.3,
      foreLegLift: 12, hindLegLift: 6, pressure: 0.16, sweatDrops: 0, tailLift: 16, pupilOffsetX: 1, pupilOffsetY: 0
    },
    copy: {
      zh: {
        rangeLabel: "61-80 分 · 仍可控",
        badge: "还能控场",
        headline: "AI 已经进场，但更多像加速器，不是压顶系统。",
        riskHint: "这个区间已经出现一定 AI 介入，但整体仍在可控范围。牛偏稳着扛，马偏提速应对。",
        duoLine: "牛先稳住，马先提速",
        bullState: "平稳、专注、能扛住节奏",
        horseState: "专注、轻快、反应敏捷"
      },
      en: {
        rangeLabel: "61-80 · Controlled",
        badge: "Still pacing it",
        headline: "AI is in the room, but it still feels like an assistive layer.",
        riskHint: "This band already shows visible AI involvement, but the pace is still manageable for both mascots.",
        duoLine: "Bull grounds it, horse speeds up",
        bullState: "steady, focused, durable",
        horseState: "focused, agile, responsive"
      }
    }
  },
  {
    key: "watchful",
    min: 41,
    max: 60,
    palette: WATCHFUL_PALETTE,
    scene: { helperNodes: 3, systemPanels: 4, pressureRings: 3, gridOpacity: 0.22, dominantSystem: false, floorTilt: 2 },
    bullPose: {
      bodyTilt: -3, headTilt: -4, bodyYOffset: 10, squishX: 1.03, squishY: 0.96, eyeOpen: 0.74, browTilt: 0.24, smile: -0.18,
      foreLegLift: -6, hindLegLift: -2, pressure: 0.42, sweatDrops: 1, tailLift: 0, pupilOffsetX: -1, pupilOffsetY: 1
    },
    horsePose: {
      bodyTilt: 5, headTilt: 10, bodyYOffset: 8, squishX: 1.02, squishY: 0.95, eyeOpen: 0.86, browTilt: 0.36, smile: -0.32,
      foreLegLift: -6, hindLegLift: 0, pressure: 0.46, sweatDrops: 1, tailLift: -2, pupilOffsetX: 2, pupilOffsetY: 2
    },
    copy: {
      zh: {
        rangeLabel: "41-60 分 · 开始承压",
        badge: "得提着一口气",
        headline: "自动化感明显变强，牛马都开始感到紧张。",
        riskHint: "中间分段已经不再轻松。牛开始显沉重，马会更快露出紧绷和疲惫感。",
        duoLine: "牛开始沉，马先紧",
        bullState: "开始沉重、略显疲惫、还在硬撑",
        horseState: "开始紧张、情绪外露、明显承压"
      },
      en: {
        rangeLabel: "41-60 · Under strain",
        badge: "Holding the line",
        headline: "Automation is now obvious, and both mascots feel the weight.",
        riskHint: "This middle zone is no longer relaxed. The bull looks heavier; the horse shows stress faster.",
        duoLine: "Bull gets heavy, horse gets tense",
        bullState: "heavier, tired, still bracing",
        horseState: "tense, emotional, visibly strained"
      }
    }
  },
  {
    key: "strained",
    min: 21,
    max: 40,
    palette: STRAINED_PALETTE,
    scene: { helperNodes: 2, systemPanels: 5, pressureRings: 4, gridOpacity: 0.26, dominantSystem: true, floorTilt: 4 },
    bullPose: {
      bodyTilt: -8, headTilt: -10, bodyYOffset: 20, squishX: 1.08, squishY: 0.9, eyeOpen: 0.56, browTilt: 0.5, smile: -0.62,
      foreLegLift: -16, hindLegLift: -10, pressure: 0.7, sweatDrops: 2, tailLift: -8, pupilOffsetX: -2, pupilOffsetY: 3
    },
    horsePose: {
      bodyTilt: 9, headTilt: 16, bodyYOffset: 22, squishX: 1.08, squishY: 0.88, eyeOpen: 0.72, browTilt: 0.7, smile: -0.76,
      foreLegLift: -22, hindLegLift: -14, pressure: 0.78, sweatDrops: 3, tailLift: -12, pupilOffsetX: 4, pupilOffsetY: 4
    },
    copy: {
      zh: {
        rangeLabel: "21-40 分 · 压力上来了",
        badge: "被系统追着跑",
        headline: "AI 压力已经明显抬头，画面开始往系统那边倾斜。",
        riskHint: "低分区间要传达更强的挤压感。牛像在死扛，马更容易出现焦虑和失衡姿态。",
        duoLine: "牛在死扛，马先炸毛",
        bullState: "沉重、迟缓、被压住但还在扛",
        horseState: "焦虑、疲惫、姿态失衡"
      },
      en: {
        rangeLabel: "21-40 · Pressured",
        badge: "Chased by the system",
        headline: "System pressure is now obvious and starts to dominate the scene.",
        riskHint: "Lower scores need a visible squeeze. The bull looks like it is grinding through it, while the horse loses balance sooner.",
        duoLine: "Bull grinds, horse rattles",
        bullState: "heavy, slow, pinned but bracing",
        horseState: "anxious, tired, off-balance"
      }
    }
  },
  {
    key: "critical",
    min: 0,
    max: 20,
    palette: CRITICAL_PALETTE,
    scene: { helperNodes: 1, systemPanels: 6, pressureRings: 5, gridOpacity: 0.32, dominantSystem: true, floorTilt: 6 },
    bullPose: {
      bodyTilt: -10, headTilt: -12, bodyYOffset: 28, squishX: 1.1, squishY: 0.84, eyeOpen: 0.44, browTilt: 0.82, smile: -0.92,
      foreLegLift: -24, hindLegLift: -18, pressure: 0.94, sweatDrops: 3, tailLift: -18, pupilOffsetX: -3, pupilOffsetY: 5
    },
    horsePose: {
      bodyTilt: 12, headTilt: 18, bodyYOffset: 32, squishX: 1.12, squishY: 0.82, eyeOpen: 0.62, browTilt: 0.96, smile: -1,
      foreLegLift: -28, hindLegLift: -20, pressure: 1, sweatDrops: 4, tailLift: -22, pupilOffsetX: 5, pupilOffsetY: 6
    },
    copy: {
      zh: {
        rangeLabel: "0-20 分 · 高压预警",
        badge: "系统压脸了",
        headline: "自动化系统已经占主导，但画面还得保留一点传播感和黑色幽默。",
        riskHint: "极低分要表现高压和高替代风险。牛被压得更沉，马则更慌张、更明显地情绪外露。",
        duoLine: "牛更闷扛，马更慌张",
        bullState: "非常疲惫、被压住、还在硬撑",
        horseState: "明显慌张、紧绷、快被系统裹住"
      },
      en: {
        rangeLabel: "0-20 · High risk",
        badge: "System overload",
        headline: "Automation dominates the frame, but the tone stays shareable instead of grim.",
        riskHint: "The lowest band should feel high-pressure and high-risk. The bull is crushed but bracing; the horse is visibly panicked.",
        duoLine: "Bull keeps grinding, horse panics first",
        bullState: "exhausted, pinned, still bracing",
        horseState: "panicked, tense, boxed in"
      }
    }
  }
];

export function getMascotScoreBand(score: number) {
  const normalizedScore = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
  return SHARE_MASCOT_SCORE_BANDS.find((item) => normalizedScore >= item.min && normalizedScore <= item.max)
    || SHARE_MASCOT_SCORE_BANDS[SHARE_MASCOT_SCORE_BANDS.length - 1];
}

export function getMascotBandCopy(score: number, language: H5Language) {
  return getMascotScoreBand(score).copy[language];
}
