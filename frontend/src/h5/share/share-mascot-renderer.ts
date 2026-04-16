import type { H5Language } from "../lib/language.ts";
import {
  SHARE_MASCOT_CHARACTERS,
  SHARE_MASCOT_FONT_FAMILY,
  SHARE_MASCOT_SCENE,
  type MascotCharacterConfig,
  type MascotPoseConfig
} from "./share-mascot-config.ts";
import { getMascotBandCopy, getMascotScoreBand } from "./share-mascot-score-map.ts";

export interface MascotSceneRenderOptions {
  score: number;
  language: H5Language;
  width?: number;
  height?: number;
}

export function renderMascotSceneSvg({
  score,
  language,
  width = SHARE_MASCOT_SCENE.width,
  height = SHARE_MASCOT_SCENE.height
}: MascotSceneRenderOptions) {
  const band = getMascotScoreBand(score);
  const copy = getMascotBandCopy(score, language);
  const panelId = `airs-mascot-panel-${band.key}`;
  const glowId = `airs-mascot-glow-${band.key}`;
  const helperPositions = [
    { x: 146, y: 122, size: 38 },
    { x: 770, y: 152, size: 34 },
    { x: 458, y: 118, size: 28 },
    { x: 722, y: 286, size: 26 }
  ].slice(0, band.scene.helperNodes);
  const panelPositions = [
    { x: 88, y: 178, width: 146, height: 92, rotate: -8 },
    { x: 664, y: 174, width: 152, height: 96, rotate: 9 },
    { x: 496, y: 98, width: 172, height: 102, rotate: 4 },
    { x: 238, y: 132, width: 144, height: 88, rotate: -5 },
    { x: 728, y: 322, width: 158, height: 94, rotate: 11 },
    { x: 52, y: 320, width: 150, height: 92, rotate: -10 }
  ].slice(0, band.scene.systemPanels);
  const noteLines = wrapText(language, copy.headline, language === "zh" ? 18 : 34, 2);

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${SHARE_MASCOT_SCENE.width} ${SHARE_MASCOT_SCENE.height}" fill="none" role="img" aria-label="${escapeXml(buildMascotSceneLabel(score, language))}">
  <defs>
    <linearGradient id="${panelId}" x1="86" y1="36" x2="782" y2="618" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${band.palette.panelTop}" />
      <stop offset="100%" stop-color="${band.palette.panelBottom}" />
    </linearGradient>
    <radialGradient id="${glowId}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(456 186) rotate(90) scale(298 452)">
      <stop stop-color="${band.palette.glowSoft}" />
      <stop offset="100%" stop-color="rgba(255,255,255,0)" />
    </radialGradient>
  </defs>

  <rect x="8" y="8" width="896" height="604" rx="38" fill="url(#${panelId})" stroke="${band.palette.panelStroke}" stroke-width="2" />
  <rect x="8" y="8" width="896" height="604" rx="38" fill="url(#${glowId})" />
  <circle cx="748" cy="124" r="${band.scene.dominantSystem ? 128 : 104}" fill="${band.palette.glowSoft}" />
  <circle cx="184" cy="454" r="${band.scene.dominantSystem ? 96 : 74}" fill="${band.palette.helperSoft}" />
  ${renderGrid(band.scene.gridOpacity)}
  ${panelPositions.map((panel) => renderSystemPanel(panel.x, panel.y, panel.width, panel.height, panel.rotate, band.scene.dominantSystem, band.palette.system, band.palette.systemSoft)).join("")}
  ${helperPositions.map((item, index) => renderHelperNode(item.x, item.y, item.size, index % 2 === 0 ? "spark" : "plus", band.palette.helper, band.palette.helperSoft)).join("")}
  ${renderPressureRings(band.scene.pressureRings, band.palette.alert)}
  ${renderFloor(score, band.scene.floorTilt, band.palette.floor, band.palette.floorShadow)}
  ${renderBullCharacter(SHARE_MASCOT_CHARACTERS.bull, band.bullPose, SHARE_MASCOT_SCENE.bullX, SHARE_MASCOT_SCENE.mascotY)}
  ${renderHorseCharacter(SHARE_MASCOT_CHARACTERS.horse, band.horsePose, SHARE_MASCOT_SCENE.horseX, SHARE_MASCOT_SCENE.mascotY + 4)}
  ${renderSystemDominanceOverlay(band.scene.dominantSystem, band.palette.system)}

  <g transform="translate(28 ${SHARE_MASCOT_SCENE.height - SHARE_MASCOT_SCENE.dockHeight})">
    <rect x="0" y="0" width="856" height="${SHARE_MASCOT_SCENE.dockHeight - 20}" rx="28" fill="${band.palette.dockBg}" stroke="${band.palette.dockLine}" />
    <rect x="26" y="22" width="${language === "zh" ? 160 : 178}" height="36" rx="18" fill="${band.palette.badgeBg}" />
    <text x="42" y="46" font-family="${SHARE_MASCOT_FONT_FAMILY}" font-size="20" font-weight="700" fill="${band.palette.badgeText}">
      ${escapeXml(copy.rangeLabel)}
    </text>
    <text x="26" y="84" font-family="${SHARE_MASCOT_FONT_FAMILY}" font-size="34" font-weight="800" fill="${band.palette.textPrimary}">
      ${escapeXml(copy.badge)}
    </text>
    ${noteLines.map((line, index) => `
    <text x="26" y="${index === 0 ? 108 : 130}" font-family="${SHARE_MASCOT_FONT_FAMILY}" font-size="20" font-weight="500" fill="${band.palette.textSecondary}">
      ${escapeXml(line)}
    </text>`).join("")}
    <text x="646" y="40" font-family="${SHARE_MASCOT_FONT_FAMILY}" font-size="16" font-weight="600" fill="${band.palette.textSecondary}">
      ${escapeXml(language === "zh" ? "双角色反应" : "Duo read")}
    </text>
    <text x="646" y="72" font-family="${SHARE_MASCOT_FONT_FAMILY}" font-size="18" font-weight="700" fill="${band.palette.textPrimary}">
      ${escapeXml(copy.duoLine)}
    </text>
    <text x="646" y="98" font-family="${SHARE_MASCOT_FONT_FAMILY}" font-size="15" font-weight="500" fill="${band.palette.textSecondary}">
      ${escapeXml(language === "zh" ? `牛：${copy.bullState}` : `Bull: ${copy.bullState}`)}
    </text>
    <text x="646" y="120" font-family="${SHARE_MASCOT_FONT_FAMILY}" font-size="15" font-weight="500" fill="${band.palette.textSecondary}">
      ${escapeXml(language === "zh" ? `马：${copy.horseState}` : `Horse: ${copy.horseState}`)}
    </text>
  </g>
</svg>`.trim();
}

export function renderMascotSceneDataUrl(options: MascotSceneRenderOptions) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderMascotSceneSvg(options))}`;
}

export function buildMascotSceneLabel(score: number, language: H5Language) {
  const copy = getMascotBandCopy(score, language);
  return language === "zh"
    ? `AIRS 牛马吉祥物场景，${copy.rangeLabel}，${copy.badge}`
    : `AIRS mascot scene, ${copy.rangeLabel}, ${copy.badge}`;
}

function renderGrid(opacity: number) {
  return `
  <g opacity="${opacity}">
    <path d="M88 122H824" stroke="rgba(255,255,255,0.08)" stroke-dasharray="6 14" />
    <path d="M70 210H844" stroke="rgba(255,255,255,0.08)" stroke-dasharray="6 14" />
    <path d="M52 296H860" stroke="rgba(255,255,255,0.08)" stroke-dasharray="6 14" />
    <path d="M120 112V448" stroke="rgba(255,255,255,0.07)" stroke-dasharray="6 16" />
    <path d="M284 86V472" stroke="rgba(255,255,255,0.07)" stroke-dasharray="6 16" />
    <path d="M456 74V490" stroke="rgba(255,255,255,0.07)" stroke-dasharray="6 16" />
    <path d="M624 86V476" stroke="rgba(255,255,255,0.07)" stroke-dasharray="6 16" />
    <path d="M790 124V452" stroke="rgba(255,255,255,0.07)" stroke-dasharray="6 16" />
  </g>`;
}

function renderSystemPanel(
  x: number,
  y: number,
  width: number,
  height: number,
  rotate: number,
  dominant: boolean,
  stroke: string,
  fill: string
) {
  return `
  <g transform="translate(${x} ${y}) rotate(${rotate})">
    <rect width="${width}" height="${height}" rx="24" fill="${fill}" stroke="${stroke}" stroke-width="${dominant ? 2.8 : 1.6}" />
    <rect x="18" y="20" width="${Math.round(width * 0.54)}" height="10" rx="5" fill="${stroke}" opacity="0.6" />
    <rect x="18" y="42" width="${Math.round(width * 0.42)}" height="10" rx="5" fill="${stroke}" opacity="0.42" />
    <rect x="18" y="${height - 30}" width="${Math.round(width * 0.62)}" height="8" rx="4" fill="${stroke}" opacity="0.38" />
    <path d="M${width - 36} 24h10" stroke="${stroke}" stroke-width="3" stroke-linecap="round" />
    <path d="M${width - 36} 24v10" stroke="${stroke}" stroke-width="3" stroke-linecap="round" />
  </g>`;
}

function renderHelperNode(
  x: number,
  y: number,
  size: number,
  kind: "spark" | "plus",
  fill: string,
  halo: string
) {
  return `
  <g transform="translate(${x} ${y})">
    <circle r="${size}" fill="${halo}" />
    <circle r="${Math.round(size * 0.64)}" fill="${fill}" opacity="0.18" />
    <circle r="${Math.round(size * 0.42)}" fill="${fill}" />
    ${kind === "spark"
      ? `<path d="M0 -${Math.round(size * 0.3)}L${Math.round(size * 0.08)} -${Math.round(size * 0.06)}L${Math.round(size * 0.3)} 0L${Math.round(size * 0.08)} ${Math.round(size * 0.06)}L0 ${Math.round(size * 0.3)}L-${Math.round(size * 0.08)} ${Math.round(size * 0.06)}L-${Math.round(size * 0.3)} 0L-${Math.round(size * 0.08)} -${Math.round(size * 0.06)}Z" fill="#0f2330" />`
      : `<path d="M0 -${Math.round(size * 0.22)}V${Math.round(size * 0.22)}" stroke="#0f2330" stroke-width="4" stroke-linecap="round" /><path d="M-${Math.round(size * 0.22)} 0H${Math.round(size * 0.22)}" stroke="#0f2330" stroke-width="4" stroke-linecap="round" />`}
  </g>`;
}

function renderPressureRings(count: number, color: string) {
  const rings = [
    { x: 238, y: 206, rx: 92, ry: 54, rotate: -18 },
    { x: 668, y: 226, rx: 96, ry: 58, rotate: 16 },
    { x: 452, y: 170, rx: 126, ry: 70, rotate: 0 },
    { x: 244, y: 352, rx: 86, ry: 48, rotate: -10 },
    { x: 668, y: 364, rx: 92, ry: 52, rotate: 8 }
  ];
  return rings.slice(0, count).map((ring, index) => `
  <ellipse cx="${ring.x}" cy="${ring.y}" rx="${ring.rx}" ry="${ring.ry}" transform="rotate(${ring.rotate} ${ring.x} ${ring.y})" stroke="${color}" stroke-opacity="${0.1 + index * 0.06}" stroke-width="2" stroke-dasharray="10 12" />`).join("");
}

function renderFloor(score: number, tilt: number, fill: string, shadow: string) {
  const band = getMascotScoreBand(score);
  return `
  <g transform="rotate(${tilt} 456 416)">
    <ellipse cx="456" cy="412" rx="286" ry="${band.scene.dominantSystem ? 96 : 82}" fill="${shadow}" />
    <ellipse cx="456" cy="404" rx="254" ry="${band.scene.dominantSystem ? 78 : 64}" fill="${fill}" />
    <ellipse cx="456" cy="388" rx="168" ry="28" fill="rgba(255,255,255,0.05)" />
  </g>`;
}

function renderSystemDominanceOverlay(enabled: boolean, color: string) {
  if (!enabled) return "";
  return `
  <g opacity="0.38">
    <path d="M82 88H830" stroke="${color}" stroke-width="2" stroke-dasharray="8 14" />
    <path d="M98 104C210 164 330 186 456 186C582 186 702 164 814 104" stroke="${color}" stroke-width="2" />
    <path d="M144 428C260 388 338 372 456 372C574 372 652 388 768 428" stroke="${color}" stroke-width="2" stroke-dasharray="8 14" />
  </g>`;
}

function renderBullCharacter(config: MascotCharacterConfig, pose: MascotPoseConfig, x: number, y: number) {
  const eyeHeight = Math.max(5, 12 * pose.eyeOpen);
  const browRaise = pose.browTilt * 10;
  const smilePath = buildSmilePath(0, 30, 26, 10, pose.smile);
  const shadowScale = 1 - pose.pressure * 0.12;
  return `
  <g transform="translate(${x} ${y})">
    <ellipse cx="-8" cy="138" rx="${Math.round(92 * shadowScale)}" ry="${Math.round(24 + pose.pressure * 8)}" fill="rgba(4,7,13,0.28)" />
    <g transform="translate(0 ${pose.bodyYOffset}) rotate(${pose.bodyTilt}) scale(${pose.squishX} ${pose.squishY})">
      <path d="M-102 72C-110 26 -74 -32 0 -34C70 -36 106 18 104 66C102 118 74 154 0 154C-68 154 -98 124 -102 72Z" fill="${config.fillShadow}" />
      <path d="M-104 66C-114 18 -76 -44 0 -46C74 -48 112 10 108 66C104 122 72 148 0 148C-72 148 -100 118 -104 66Z" fill="${config.fill}" stroke="${config.outline}" stroke-width="6" />
      <path d="M-68 42C-34 58 34 58 68 42" stroke="rgba(255,255,255,0.16)" stroke-width="8" stroke-linecap="round" />
      <path d="M-90 118C-112 122 -118 146 -108 170" stroke="${config.outline}" stroke-width="7" stroke-linecap="round" />
      <path d="M82 108C110 108 126 118 128 140" stroke="${config.outline}" stroke-width="7" stroke-linecap="round" />
      <rect x="-70" y="124" width="22" height="${48 - pose.foreLegLift}" rx="11" fill="${config.fillShadow}" />
      <rect x="-34" y="130" width="22" height="${42 - Math.round(pose.foreLegLift * 0.5)}" rx="11" fill="${config.fillShadow}" />
      <rect x="12" y="130" width="22" height="${42 - Math.round(pose.hindLegLift * 0.45)}" rx="11" fill="${config.fillShadow}" />
      <rect x="48" y="124" width="22" height="${48 - pose.hindLegLift}" rx="11" fill="${config.fillShadow}" />
      <rect x="-72" y="160" width="26" height="18" rx="9" fill="${config.hoof}" />
      <rect x="-36" y="164" width="26" height="18" rx="9" fill="${config.hoof}" />
      <rect x="10" y="164" width="26" height="18" rx="9" fill="${config.hoof}" />
      <rect x="46" y="160" width="26" height="18" rx="9" fill="${config.hoof}" />
    </g>
    <g transform="translate(0 ${pose.bodyYOffset - 56}) rotate(${pose.headTilt})">
      <path d="M-64 -50C-88 -90 -126 -80 -118 -34C-104 -28 -84 -22 -68 -18" fill="${config.horn}" stroke="${config.outline}" stroke-width="6" stroke-linejoin="round" />
      <path d="M64 -50C88 -90 126 -80 118 -34C104 -28 84 -22 68 -18" fill="${config.horn}" stroke="${config.outline}" stroke-width="6" stroke-linejoin="round" />
      <path d="M-62 -18C-86 -44 -110 -26 -94 8C-78 10 -68 8 -54 0" fill="${config.fillShadow}" stroke="${config.outline}" stroke-width="6" stroke-linejoin="round" />
      <path d="M62 -18C86 -44 110 -26 94 8C78 10 68 8 54 0" fill="${config.fillShadow}" stroke="${config.outline}" stroke-width="6" stroke-linejoin="round" />
      <ellipse cx="0" cy="8" rx="78" ry="68" fill="${config.fill}" stroke="${config.outline}" stroke-width="6" />
      <ellipse cx="0" cy="28" rx="42" ry="28" fill="${config.muzzle}" />
      <circle cx="-36" cy="28" r="12" fill="${config.cheek}" opacity="0.55" />
      <circle cx="36" cy="28" r="12" fill="${config.cheek}" opacity="0.55" />
      <path d="M-46 -20C-22 ${-28 - browRaise} -2 ${-28 + browRaise}" stroke="${config.outline}" stroke-width="6" stroke-linecap="round" />
      <path d="M46 -20C22 ${-28 + browRaise} 2 ${-28 - browRaise}" stroke="${config.outline}" stroke-width="6" stroke-linecap="round" />
      <ellipse cx="-24" cy="-4" rx="10" ry="${eyeHeight}" fill="${config.outline}" />
      <ellipse cx="24" cy="-4" rx="10" ry="${eyeHeight}" fill="${config.outline}" />
      <circle cx="${-20 + pose.pupilOffsetX}" cy="${-3 + pose.pupilOffsetY}" r="3.5" fill="white" opacity="0.82" />
      <circle cx="${28 + pose.pupilOffsetX}" cy="${-3 + pose.pupilOffsetY}" r="3.5" fill="white" opacity="0.82" />
      <path d="${smilePath}" stroke="${config.outline}" stroke-width="5" stroke-linecap="round" fill="none" />
      <circle cx="-14" cy="28" r="4" fill="${config.outline}" opacity="0.54" />
      <circle cx="14" cy="28" r="4" fill="${config.outline}" opacity="0.54" />
      ${renderSweatDrops(-70, -42, pose.sweatDrops, config.accent)}
    </g>
  </g>`;
}

function renderHorseCharacter(config: MascotCharacterConfig, pose: MascotPoseConfig, x: number, y: number) {
  const eyeHeight = Math.max(5, 12 * pose.eyeOpen);
  const browRaise = pose.browTilt * 11;
  const smilePath = buildSmilePath(12, 24, 24, 10, pose.smile);
  const shadowScale = 1 - pose.pressure * 0.14;
  return `
  <g transform="translate(${x} ${y})">
    <ellipse cx="8" cy="142" rx="${Math.round(86 * shadowScale)}" ry="${Math.round(24 + pose.pressure * 8)}" fill="rgba(4,7,13,0.28)" />
    <g transform="translate(0 ${pose.bodyYOffset}) rotate(${pose.bodyTilt}) scale(${pose.squishX} ${pose.squishY})">
      <path d="M-86 34C-84 -4 -48 -32 6 -32C58 -32 96 -2 96 42C96 98 56 136 4 136C-52 136 -88 96 -86 34Z" fill="${config.fill}" stroke="${config.outline}" stroke-width="6" />
      <path d="M-26 -18C-8 -64 34 -84 70 -62C88 -52 94 -28 86 -8C80 6 66 12 42 12" fill="${config.fill}" stroke="${config.outline}" stroke-width="6" stroke-linejoin="round" />
      <path d="M24 -40C22 -74 48 -92 72 -88C88 -86 94 -70 86 -54C78 -40 54 -28 30 -30" fill="${config.mane}" stroke="${config.outline}" stroke-width="6" stroke-linejoin="round" />
      <path d="M40 -84C56 -122 92 -112 90 -76C80 -60 66 -48 52 -42" fill="${config.fill}" stroke="${config.outline}" stroke-width="6" stroke-linejoin="round" />
      <path d="M62 -80C82 -120 118 -106 112 -66C96 -54 82 -46 68 -40" fill="${config.fill}" stroke="${config.outline}" stroke-width="6" stroke-linejoin="round" />
      <ellipse cx="56" cy="-10" rx="54" ry="58" fill="${config.fill}" stroke="${config.outline}" stroke-width="6" />
      <ellipse cx="70" cy="10" rx="30" ry="24" fill="${config.muzzle}" />
      <circle cx="28" cy="14" r="12" fill="${config.cheek}" opacity="0.55" />
      <circle cx="84" cy="20" r="12" fill="${config.cheek}" opacity="0.5" />
      <path d="M24 -26C40 ${-34 - browRaise} 54 ${-26 + browRaise}" stroke="${config.outline}" stroke-width="6" stroke-linecap="round" />
      <path d="M92 -16C78 ${-24 + browRaise} 62 ${-14 - browRaise}" stroke="${config.outline}" stroke-width="6" stroke-linecap="round" />
      <ellipse cx="44" cy="-6" rx="9" ry="${eyeHeight}" fill="${config.outline}" />
      <ellipse cx="78" cy="2" rx="8.5" ry="${Math.max(5, eyeHeight - 1)}" fill="${config.outline}" />
      <circle cx="${48 + pose.pupilOffsetX}" cy="${-5 + pose.pupilOffsetY}" r="3.2" fill="white" opacity="0.82" />
      <circle cx="${82 + pose.pupilOffsetX}" cy="${2 + pose.pupilOffsetY}" r="3" fill="white" opacity="0.82" />
      <path d="${smilePath}" stroke="${config.outline}" stroke-width="5" stroke-linecap="round" fill="none" />
      <circle cx="60" cy="12" r="3.8" fill="${config.outline}" opacity="0.54" />
      <path d="M-76 78C-104 ${56 - pose.tailLift} -112 30 -92 8" stroke="${config.mane}" stroke-width="10" stroke-linecap="round" />
      <path d="M-96 10C-120 6 -130 30 -118 48" stroke="${config.mane}" stroke-width="10" stroke-linecap="round" />
      <rect x="-48" y="108" width="22" height="${50 - pose.foreLegLift}" rx="11" fill="${config.fillShadow}" />
      <rect x="-14" y="114" width="22" height="${44 - Math.round(pose.foreLegLift * 0.65)}" rx="11" fill="${config.fillShadow}" />
      <rect x="20" y="116" width="22" height="${42 - Math.round(pose.hindLegLift * 0.55)}" rx="11" fill="${config.fillShadow}" />
      <rect x="52" y="112" width="22" height="${46 - pose.hindLegLift}" rx="11" fill="${config.fillShadow}" />
      <rect x="-50" y="146" width="26" height="18" rx="9" fill="${config.hoof}" />
      <rect x="-16" y="150" width="26" height="18" rx="9" fill="${config.hoof}" />
      <rect x="18" y="150" width="26" height="18" rx="9" fill="${config.hoof}" />
      <rect x="50" y="148" width="26" height="18" rx="9" fill="${config.hoof}" />
      ${renderSweatDrops(108, -44, pose.sweatDrops, config.accent)}
    </g>
  </g>`;
}

function renderSweatDrops(x: number, y: number, count: number, fill: string) {
  if (!count) return "";
  return Array.from({ length: count }, (_, index) => {
    const dropX = x + index * 14;
    const dropY = y + index * 12;
    return `<path d="M${dropX} ${dropY}C${dropX + 8} ${dropY - 18} ${dropX + 16} ${dropY - 2} ${dropX + 8} ${dropY + 8}C${dropX + 2} ${dropY + 12} ${dropX - 4} ${dropY + 2} ${dropX} ${dropY}Z" fill="${fill}" opacity="${0.78 - index * 0.08}" />`;
  }).join("");
}

function buildSmilePath(x: number, y: number, width: number, height: number, smile: number) {
  const endX = x + width;
  const controlY = y + height * smile;
  return `M${x} ${y}Q${x + width / 2} ${controlY} ${endX} ${y}`;
}

function escapeXml(value: string) {
  return String(value || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wrapText(language: H5Language, value: string, maxCharsPerLine: number, maxLines: number) {
  const source = String(value || "").trim();
  if (!source) return [""];
  if (language === "zh") {
    const glyphs = Array.from(source);
    const lines: string[] = [];
    for (let index = 0; index < glyphs.length; index += maxCharsPerLine) {
      lines.push(glyphs.slice(index, index + maxCharsPerLine).join(""));
    }
    return limitLines(lines, maxLines);
  }

  const words = source.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharsPerLine || !current) {
      current = next;
      return;
    }
    lines.push(current);
    current = word;
  });
  if (current) lines.push(current);
  return limitLines(lines, maxLines);
}

function limitLines(lines: string[], maxLines: number) {
  if (lines.length <= maxLines) return lines;
  const limited = lines.slice(0, maxLines);
  limited[maxLines - 1] = limited[maxLines - 1].replace(/[。！？；，,.!?;:]?$/, "…");
  return limited;
}
