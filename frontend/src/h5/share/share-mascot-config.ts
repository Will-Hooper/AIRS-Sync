export type MascotCharacterId = "bull" | "horse";

export interface MascotPoseConfig {
  bodyTilt: number;
  headTilt: number;
  bodyYOffset: number;
  squishX: number;
  squishY: number;
  eyeOpen: number;
  browTilt: number;
  smile: number;
  foreLegLift: number;
  hindLegLift: number;
  pressure: number;
  sweatDrops: number;
  tailLift: number;
  pupilOffsetX: number;
  pupilOffsetY: number;
}

export interface MascotScenePalette {
  canvasTop: string;
  canvasBottom: string;
  panelTop: string;
  panelBottom: string;
  panelStroke: string;
  glow: string;
  glowSoft: string;
  helper: string;
  helperSoft: string;
  system: string;
  systemSoft: string;
  alert: string;
  floor: string;
  floorShadow: string;
  badgeBg: string;
  badgeText: string;
  dockBg: string;
  dockLine: string;
  textPrimary: string;
  textSecondary: string;
}

export interface MascotCharacterConfig {
  id: MascotCharacterId;
  label: string;
  fill: string;
  fillShadow: string;
  muzzle: string;
  outline: string;
  accent: string;
  cheek: string;
  hoof: string;
  horn?: string;
  mane?: string;
  earInner: string;
}

export const SHARE_MASCOT_FONT_FAMILY = "'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";

export const SHARE_MASCOT_SCENE = {
  width: 912,
  height: 620,
  bullX: 292,
  horseX: 640,
  mascotY: 318,
  dockHeight: 124
} as const;

export const SHARE_MASCOT_CHARACTERS: Record<MascotCharacterId, MascotCharacterConfig> = {
  bull: {
    id: "bull",
    label: "AIRS Bull",
    fill: "#c88956",
    fillShadow: "#a76a3d",
    muzzle: "#f7dfc8",
    outline: "#13283b",
    accent: "#ffd467",
    cheek: "#ffb1a5",
    hoof: "#3a2a2a",
    horn: "#fff4d9",
    earInner: "#f7c0b1"
  },
  horse: {
    id: "horse",
    label: "AIRS Horse",
    fill: "#f0bf95",
    fillShadow: "#d49d72",
    muzzle: "#fff0e0",
    outline: "#13283b",
    accent: "#8ef0cf",
    cheek: "#ffb6b3",
    hoof: "#413030",
    mane: "#6f4d48",
    earInner: "#f7c1bf"
  }
};
