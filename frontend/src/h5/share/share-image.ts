import QRCode from "qrcode";
import { formatNumber } from "../../lib/format";
import type { DatasetSourceUpdatedAt, OccupationRow } from "../../lib/types";
import { getH5Copy } from "../lib/copy";
import type { H5Language } from "../lib/language";
import { buildH5OccupationHref } from "../lib/navigation";
import { getMascotBandCopy, getMascotScoreBand } from "./share-mascot-score-map";
import { renderMascotSceneDataUrl } from "./share-mascot-renderer";

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;
const CONTENT_X = 84;
const CONTENT_WIDTH = 912;
const FONT_FAMILY = "'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";

interface ShareImageOptions {
  occupation: OccupationRow;
  averageAirs: number;
  language: H5Language;
  generatedAt?: string;
  sourceUpdatedAt?: DatasetSourceUpdatedAt;
  siteUrl?: string;
}

interface FittedTextLayout {
  lines: string[];
  fontSize: number;
  lineHeight: number;
}

export async function renderOccupationShareImage({
  occupation,
  averageAirs,
  language,
  generatedAt: _generatedAt,
  sourceUpdatedAt: _sourceUpdatedAt,
  siteUrl = buildH5OccupationHref(occupation.socCode, language)
}: ShareImageOptions) {
  const copy = getH5Copy(language);
  const score = Number(occupation.airs || 0);
  const scoreBand = getMascotScoreBand(score);
  const mascotCopy = getMascotBandCopy(score, language);
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("canvas context unavailable");
  }

  const gradient = context.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  gradient.addColorStop(0, scoreBand.palette.canvasTop);
  gradient.addColorStop(0.48, scoreBand.palette.canvasBottom);
  gradient.addColorStop(1, "#050a11");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = scoreBand.palette.glowSoft;
  context.beginPath();
  context.arc(904, 228, 272, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = scoreBand.palette.helperSoft;
  context.beginPath();
  context.arc(146, 1540, 252, 0, Math.PI * 2);
  context.fill();

  const title = language === "zh" ? occupation.titleZh || occupation.title : occupation.title;
  const summary = (
    language === "zh"
      ? occupation.summaryZh || occupation.summary
      : occupation.summary
  ).trim() || copy.noReading;
  const scoreGuide = language === "zh"
    ? "分数越高越稳定，越低越容易受到 AI 冲击。"
    : "Higher scores mean stronger stability and lower AI disruption.";
  const shareInterpretation = buildShareInterpretation(summary, mascotCopy, language);

  context.fillStyle = scoreBand.palette.glow;
  setFont(context, 500, 30);
  context.fillText("AIRS", CONTENT_X, 102);

  drawRangeBadge(context, language, mascotCopy.rangeLabel, scoreBand.palette.badgeBg, scoreBand.palette.badgeText);

  const titleLayout = fitWrappedText(context, title, CONTENT_WIDTH, {
    fontSizes: language === "zh" ? [82, 78, 74, 70, 66, 62] : [76, 72, 68, 64, 60, 56, 52, 48],
    lineHeightMultiplier: 1.12,
    maxLines: 3,
    weight: 700
  });
  context.fillStyle = "#f2f6ff";
  setFont(context, 700, titleLayout.fontSize);
  drawLines(context, titleLayout.lines, CONTENT_X, 184, titleLayout.lineHeight);

  const titleBlockBottom = 184 + titleLayout.lineHeight * titleLayout.lines.length;
  context.fillStyle = "rgba(242,246,255,0.7)";
  setFont(context, 400, 28);
  context.fillText(occupation.socCode, CONTENT_X, titleBlockBottom + 26);
  context.fillStyle = "rgba(242,246,255,0.46)";
  setFont(context, 500, 24);
  context.fillText(scoreGuide, CONTENT_X, titleBlockBottom + 64);

  const heroY = titleBlockBottom + 102;
  const heroHeight = titleLayout.lines.length >= 3 ? 564 : 600;
  const mascotImage = await loadImage(
    renderMascotSceneDataUrl({
      score,
      language,
      width: CONTENT_WIDTH,
      height: heroHeight
    })
  );
  context.drawImage(mascotImage, CONTENT_X, heroY, CONTENT_WIDTH, heroHeight);

  const metricY = heroY + heroHeight + 34;
  const metricHeight = 190;
  drawMetricCard(
    context,
    CONTENT_X,
    metricY,
    434,
    metricHeight,
    copy.currentAirsLabel,
    formatNumber(score, 1, language),
    mascotCopy.badge,
    scoreBand.palette.glow
  );
  drawMetricCard(
    context,
    562,
    metricY,
    434,
    metricHeight,
    copy.globalAverageLabel,
    formatNumber(averageAirs, 1, language),
    language === "zh" ? "用于和全体职业的当前均值做对照。" : "Context against the current all-occupation average.",
    scoreBand.palette.helper
  );

  const insightTitleY = metricY + metricHeight + 72;
  context.fillStyle = "#f2f6ff";
  setFont(context, 700, 40);
  context.fillText(language === "zh" ? "职业解读 / 风险提示" : "Occupation read / Risk", CONTENT_X, insightTitleY);

  const summaryPaddingX = 42;
  const summaryLayout = fitWrappedText(context, shareInterpretation, CONTENT_WIDTH - summaryPaddingX * 2, {
    fontSizes: language === "zh" ? [30, 28, 26, 24] : [30, 28, 26, 24],
    lineHeightMultiplier: 1.45,
    maxLines: 5,
    weight: 400
  });
  const summaryCard = {
    x: CONTENT_X,
    y: insightTitleY + 28,
    width: CONTENT_WIDTH,
    height: 128 + summaryLayout.lines.length * summaryLayout.lineHeight
  };
  drawPanel(context, summaryCard.x, summaryCard.y, summaryCard.width, summaryCard.height, 28);
  context.fillStyle = scoreBand.palette.glow;
  setFont(context, 700, 30);
  context.fillText(mascotCopy.badge, summaryCard.x + summaryPaddingX, summaryCard.y + 52);
  context.fillStyle = "rgba(242,246,255,0.76)";
  setFont(context, 400, summaryLayout.fontSize);
  drawLines(
    context,
    summaryLayout.lines,
    summaryCard.x + summaryPaddingX,
    summaryCard.y + 96,
    summaryLayout.lineHeight
  );

  const qrDataUrl = await QRCode.toDataURL(siteUrl, {
    margin: 1,
    width: 240,
    errorCorrectionLevel: "H",
    color: {
      dark: "#0a1220",
      light: "#ffffffff"
    }
  });

  const qrImage = await loadImage(qrDataUrl);
  const footerY = CANVAS_HEIGHT - 28;
  const qrCardHeight = 176;
  const qrCard = {
    x: CONTENT_X,
    y: Math.max(summaryCard.y + summaryCard.height + 36, footerY - 48 - qrCardHeight),
    width: CONTENT_WIDTH,
    height: qrCardHeight
  };
  drawPanel(context, qrCard.x, qrCard.y, qrCard.width, qrCard.height, 32);
  context.fillStyle = "#ffffff";
  roundRect(context, qrCard.x + 24, qrCard.y + 20, 136, 136, 22);
  context.fill();
  context.drawImage(qrImage, qrCard.x + 28, qrCard.y + 24, 128, 128);

  const qrTextX = qrCard.x + 196;
  context.fillStyle = "#f2f6ff";
  setFont(context, 700, 30);
  context.fillText(copy.appName, qrTextX, qrCard.y + 58);

  const qrNoteLayout = fitWrappedText(context, copy.shareImageQrNote, 650, {
    fontSizes: [28, 26, 24],
    lineHeightMultiplier: 1.28,
    maxLines: 3,
    weight: 500
  });
  context.fillStyle = "rgba(242,246,255,0.84)";
  setFont(context, 500, qrNoteLayout.fontSize);
  drawLines(context, qrNoteLayout.lines, qrTextX, qrCard.y + 102, qrNoteLayout.lineHeight);

  context.textAlign = "center";
  context.fillStyle = "rgba(242,246,255,0.42)";
  setFont(context, 400, 20);
  context.fillText(copy.footerCopyright, canvas.width / 2, footerY);
  context.textAlign = "left";

  return canvas.toDataURL("image/png");
}

async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawRangeBadge(
  context: CanvasRenderingContext2D,
  language: H5Language,
  label: string,
  background: string,
  textColor: string
) {
  const badgeWidth = language === "zh" ? 218 : 252;
  const badgeX = CANVAS_WIDTH - CONTENT_X - badgeWidth;
  context.fillStyle = "rgba(255,255,255,0.12)";
  roundRect(context, badgeX, 66, badgeWidth, 56, 28);
  context.fill();
  context.fillStyle = background;
  roundRect(context, badgeX + 4, 70, badgeWidth - 8, 48, 24);
  context.fill();
  context.fillStyle = textColor;
  setFont(context, 700, 22);
  context.textAlign = "center";
  context.fillText(label, badgeX + badgeWidth / 2, 102);
  context.textAlign = "left";
}

function drawMetricCard(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
  note: string,
  accent: string
) {
  drawPanel(context, x, y, width, height, 28);
  context.fillStyle = "rgba(255,255,255,0.06)";
  roundRect(context, x + 24, y + 22, 108, 30, 15);
  context.fill();
  context.fillStyle = accent;
  roundRect(context, x + 32, y + 30, 16, 14, 7);
  context.fill();

  context.fillStyle = "rgba(242,246,255,0.58)";
  setFont(context, 500, 20);
  context.fillText(label, x + 58, y + 44);

  context.fillStyle = "#f2f6ff";
  setFont(context, 700, 84);
  context.fillText(value, x + 30, y + 130);

  context.fillStyle = "rgba(242,246,255,0.5)";
  setFont(context, 400, 20);
  wrapText(context, note, x + 30, y + 168, width - 60, 28);
}

function drawPanel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.fillStyle = "rgba(255,255,255,0.04)";
  roundRect(context, x, y, width, height, radius);
  context.fill();
  context.strokeStyle = "rgba(255,255,255,0.08)";
  context.lineWidth = 2;
  roundRect(context, x, y, width, height, radius);
  context.stroke();
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  drawLines(context, wrapLines(context, text, maxWidth), x, y, lineHeight);
}

function drawLines(
  context: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number
) {
  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });
}

function wrapLines(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const source = String(text || "").trim().replace(/\s+/g, " ");
  if (!source) return [""];

  const tokens = source.split(/(\s+)/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  tokens.forEach((token) => {
    if (/^\s+$/.test(token)) {
      if (current && !current.endsWith(" ")) current += " ";
      return;
    }

    const trial = current ? `${current}${token}` : token;
    if (context.measureText(trial).width <= maxWidth) {
      current = trial;
      return;
    }

    if (current) {
      lines.push(current.trimEnd());
      current = "";
    }

    if (context.measureText(token).width <= maxWidth) {
      current = token;
      return;
    }

    for (const fragment of Array.from(token)) {
      const fragmentTrial = current ? `${current}${fragment}` : fragment;
      if (context.measureText(fragmentTrial).width > maxWidth && current) {
        lines.push(current.trimEnd());
        current = fragment;
      } else {
        current = fragmentTrial;
      }
    }
  });

  if (current) lines.push(current.trimEnd());
  return lines;
}

function fitWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  options: {
    fontSizes: number[];
    lineHeightMultiplier: number;
    maxLines: number;
    weight: number;
  }
): FittedTextLayout {
  let fitted: FittedTextLayout | null = null;

  options.fontSizes.forEach((fontSize) => {
    if (fitted) return;
    setFont(context, options.weight, fontSize);
    const lines = wrapLines(context, text, maxWidth);
    if (lines.length <= options.maxLines) {
      fitted = {
        lines,
        fontSize,
        lineHeight: Math.round(fontSize * options.lineHeightMultiplier)
      };
    }
  });

  if (fitted) return fitted;

  const fontSize = options.fontSizes[options.fontSizes.length - 1];
  setFont(context, options.weight, fontSize);
  return {
    lines: fitLines(wrapLines(context, text, maxWidth), options.maxLines),
    fontSize,
    lineHeight: Math.round(fontSize * options.lineHeightMultiplier)
  };
}

function fitLines(lines: string[], maxLines: number) {
  if (lines.length <= maxLines) return lines;
  const next = lines.slice(0, maxLines);
  next[maxLines - 1] = next[maxLines - 1].replace(/[。！？；，、,.!?;:：]?\s*$/, "") + "…";
  return next;
}

function setFont(context: CanvasRenderingContext2D, weight: number, size: number) {
  context.font = `${weight} ${size}px ${FONT_FAMILY}`;
}

function buildShareInterpretation(
  summary: string,
  mascotCopy: ReturnType<typeof getMascotBandCopy>,
  language: H5Language
) {
  return language === "zh"
    ? `${mascotCopy.riskHint} ${summary}`
    : `${mascotCopy.riskHint} ${summary}`;
}
