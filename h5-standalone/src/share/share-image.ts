import QRCode from "qrcode";
import { formatNumber } from "../lib/format";
import type { DatasetSourceUpdatedAt, OccupationRow } from "../lib/types";
import { getH5Copy } from "../lib/copy";
import type { H5Language } from "../lib/language";
import { buildOccupationHref } from "../lib/navigation";

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
  siteUrl = buildOccupationHref(occupation.socCode, language)
}: ShareImageOptions) {
  const copy = getH5Copy(language);
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("canvas context unavailable");
  }

  const gradient = context.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  gradient.addColorStop(0, "#081018");
  gradient.addColorStop(0.52, "#0b1520");
  gradient.addColorStop(1, "#050a11");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(127,193,255,0.12)";
  context.beginPath();
  context.arc(920, 220, 260, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(255,154,71,0.08)";
  context.beginPath();
  context.arc(120, 1580, 240, 0, Math.PI * 2);
  context.fill();

  const title = language === "zh" ? occupation.titleZh || occupation.title : occupation.title;
  const summary = (
    language === "zh"
      ? occupation.summaryZh || occupation.summary
      : occupation.summary
  ).trim() || copy.noReading;
  const breakdown = [
    { label: copy.breakdownLabels.replacement, value: Number(occupation.replacement || 0) },
    { label: copy.breakdownLabels.augmentation, value: Number(occupation.augmentation || 0) },
    { label: copy.breakdownLabels.hiring, value: Number(occupation.hiring || 0) },
    { label: copy.breakdownLabels.historical, value: Number(occupation.historical || 0) }
  ];

  context.fillStyle = "#8ef0cf";
  setFont(context, 500, 30);
  context.fillText("AIRS", CONTENT_X, 102);

  const titleLayout = fitWrappedText(context, title, CONTENT_WIDTH, {
    fontSizes: language === "zh" ? [80, 76, 72, 68, 64] : [76, 72, 68, 64, 60, 56, 52, 48, 44],
    lineHeightMultiplier: 1.12,
    maxLines: 3,
    weight: 700
  });
  context.fillStyle = "#f2f6ff";
  setFont(context, 700, titleLayout.fontSize);
  drawLines(context, titleLayout.lines, CONTENT_X, 184, titleLayout.lineHeight);

  context.fillStyle = "rgba(242,246,255,0.7)";
  setFont(context, 400, 28);
  const titleBlockBottom = 184 + titleLayout.lineHeight * titleLayout.lines.length;
  const socY = titleBlockBottom + 18;
  context.fillText(occupation.socCode, CONTENT_X, socY);

  const metricY = socY + 44;
  const metricHeight = 208;
  drawMetricCard(
    context,
    CONTENT_X,
    metricY,
    430,
    metricHeight,
    copy.currentAirsLabel,
    formatNumber(occupation.airs || 0, 1, language),
    language === "zh" ? "越高表示招聘层更稳定" : "Higher means more stable hiring"
  );
  drawMetricCard(
    context,
    566,
    metricY,
    430,
    metricHeight,
    copy.globalAverageLabel,
    formatNumber(averageAirs, 1, language),
    language === "zh" ? "全部职业均值" : "Across all occupations"
  );

  const breakdownTitleY = metricY + metricHeight + 84;
  context.fillStyle = "#f2f6ff";
  setFont(context, 700, 40);
  context.fillText(copy.breakdownTitle, CONTENT_X, breakdownTitleY);

  const breakdownRowHeight = 96;
  const breakdownRowGap = 12;
  const breakdownPanel = {
    x: CONTENT_X,
    y: breakdownTitleY + 30,
    width: CONTENT_WIDTH,
    height: 36 + breakdown.length * breakdownRowHeight + (breakdown.length - 1) * breakdownRowGap
  };
  drawPanel(context, breakdownPanel.x, breakdownPanel.y, breakdownPanel.width, breakdownPanel.height, 30);

  breakdown.forEach((item, index) => {
    const rowY = breakdownPanel.y + 18 + index * (breakdownRowHeight + breakdownRowGap);
    const rowX = breakdownPanel.x + 18;
    const rowWidth = breakdownPanel.width - 36;
    const barX = rowX + 28;
    const barWidth = rowWidth - 56;

    context.fillStyle = "rgba(255,255,255,0.03)";
    roundRect(context, rowX, rowY, rowWidth, breakdownRowHeight, 24);
    context.fill();

    context.fillStyle = "rgba(255,255,255,0.92)";
    setFont(context, 500, 28);
    context.fillText(item.label, rowX + 28, rowY + 34);

    context.textAlign = "right";
    context.fillStyle = "rgba(255,255,255,0.66)";
    setFont(context, 600, 24);
    context.fillText(`${formatNumber(item.value * 100, 0, language)}%`, rowX + rowWidth - 28, rowY + 34);
    context.textAlign = "left";

    context.fillStyle = "rgba(255,255,255,0.1)";
    roundRect(context, barX, rowY + 56, barWidth, 14, 7);
    context.fill();

    const fillWidth = Math.max(48, Math.min(barWidth, barWidth * clamp(item.value, 0, 1)));
    context.fillStyle = "#8bc8ff";
    roundRect(context, barX, rowY + 56, fillWidth, 14, 7);
    context.fill();
  });

  const summaryTitleY = breakdownPanel.y + breakdownPanel.height + 64;
  context.fillStyle = "#f2f6ff";
  setFont(context, 700, 38);
  context.fillText(copy.readingTitle, CONTENT_X, summaryTitleY);

  const summaryPaddingX = 42;
  const summaryPaddingTop = 50;
  const summaryPaddingBottom = 38;
  const summaryLayout = fitWrappedText(context, summary, CONTENT_WIDTH - summaryPaddingX * 2, {
    fontSizes: language === "zh" ? [26, 24, 22] : [28, 26, 24],
    lineHeightMultiplier: 1.45,
    maxLines: 5,
    weight: 400
  });
  const summaryCard = {
    x: CONTENT_X,
    y: summaryTitleY + 28,
    width: CONTENT_WIDTH,
    height: summaryPaddingTop + summaryPaddingBottom + summaryLayout.lines.length * summaryLayout.lineHeight
  };
  drawPanel(context, summaryCard.x, summaryCard.y, summaryCard.width, summaryCard.height, 28);
  context.fillStyle = "rgba(242,246,255,0.76)";
  setFont(context, 400, summaryLayout.fontSize);
  drawLines(
    context,
    summaryLayout.lines,
    summaryCard.x + summaryPaddingX,
    summaryCard.y + summaryPaddingTop,
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

function drawMetricCard(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
  note: string
) {
  drawPanel(context, x, y, width, height, 28);

  context.fillStyle = "rgba(242,246,255,0.58)";
  setFont(context, 500, 20);
  context.fillText(label, x + 30, y + 44);

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
      if (current && !current.endsWith(" ")) {
        current += " ";
      }
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
  let fallback: FittedTextLayout | null = null;

  options.fontSizes.forEach((fontSize) => {
    if (fallback) return;
    setFont(context, options.weight, fontSize);
    const lines = wrapLines(context, text, maxWidth);
    if (lines.length <= options.maxLines) {
      fallback = {
        lines,
        fontSize,
        lineHeight: Math.round(fontSize * options.lineHeightMultiplier)
      };
    }
  });

  if (fallback) return fallback;

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
  const last = next[maxLines - 1] || "";
  next[maxLines - 1] = last.replace(/[。！？；，、,.!?;:：]?\s*$/, "") + "…";
  return next;
}

function setFont(context: CanvasRenderingContext2D, weight: number, size: number) {
  context.font = `${weight} ${size}px ${FONT_FAMILY}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
