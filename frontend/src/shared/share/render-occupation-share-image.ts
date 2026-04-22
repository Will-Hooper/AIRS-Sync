import QRCode from "qrcode";
import { formatNumber } from "../../lib/format";
import type { OccupationRow } from "../../lib/types";
import type { AppLanguage } from "../language";
import { getShareScoreTheme } from "./share-score-theme";

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;
const CONTENT_X = 76;
const CONTENT_WIDTH = 928;
const FONT_FAMILY = "'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";

export interface OccupationShareImageCopy {
  appName: string;
  currentAirsLabel: string;
  globalAverageLabel: string;
  readingTitle: string;
  breakdownTitle: string;
  breakdownLabels: {
    replacement: string;
    augmentation: string;
    hiring: string;
    historical: string;
  };
  noReading: string;
  shareImageQrNote: string;
  footerCopyright: string;
}

export interface RenderOccupationShareImageOptions {
  occupation: OccupationRow;
  averageAirs: number;
  language: AppLanguage;
  copy: OccupationShareImageCopy;
  qrText?: string;
}

interface FittedTextLayout {
  lines: string[];
  fontSize: number;
  lineHeight: number;
}

interface ParagraphLine {
  text: string;
  isParagraphStart: boolean;
}

interface FittedParagraphTextLayout {
  lines: ParagraphLine[];
  fontSize: number;
  lineHeight: number;
  paragraphGap: number;
  height: number;
}

export async function renderOccupationShareImage({
  occupation,
  averageAirs,
  language,
  copy,
  qrText = "airsindex.com"
}: RenderOccupationShareImageOptions) {
  const score = Number(occupation.airs || 0);
  const theme = getShareScoreTheme(score);
  const summary = (
    language === "zh"
      ? occupation.summaryZh || occupation.summary
      : occupation.summary || occupation.summaryZh
  ).trim() || copy.noReading;
  const title = language === "zh" ? occupation.titleZh || occupation.title : occupation.title;
  const breakdownItems = [
    { label: copy.breakdownLabels.replacement, value: Number(occupation.replacement || 0), color: theme.palette.breakdownTracks[0] },
    { label: copy.breakdownLabels.augmentation, value: Number(occupation.augmentation || 0), color: theme.palette.breakdownTracks[1] },
    { label: copy.breakdownLabels.hiring, value: Number(occupation.hiring || 0), color: theme.palette.breakdownTracks[2] },
    { label: copy.breakdownLabels.historical, value: Number(occupation.historical || 0), color: theme.palette.breakdownTracks[3] }
  ] as const;

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("canvas context unavailable");
  }

  drawBackground(context, theme);

  context.fillStyle = theme.palette.accent;
  setFont(context, 600, 30);
  context.fillText(copy.appName, CONTENT_X, 98);
  drawRangeBadge(context, language, theme.rangeLabel[language], theme.palette.badgeBg, theme.palette.badgeText);

  const titleLayout = fitWrappedText(context, title, CONTENT_WIDTH, {
    fontSizes: language === "zh" ? [86, 82, 78, 72, 68, 62] : [78, 74, 70, 66, 60, 56, 52],
    lineHeightMultiplier: 1.08,
    maxLines: 3,
    weight: 700
  });
  context.fillStyle = theme.palette.textPrimary;
  setFont(context, 700, titleLayout.fontSize);
  drawLines(context, titleLayout.lines, CONTENT_X, 182, titleLayout.lineHeight);

  const titleBottom = 182 + titleLayout.lines.length * titleLayout.lineHeight;
  context.fillStyle = theme.palette.textSecondary;
  setFont(context, 500, 26);
  context.fillText(occupation.socCode, CONTENT_X, titleBottom + 24);

  const headlineLayout = fitWrappedText(context, theme.headline[language], CONTENT_WIDTH, {
    fontSizes: [28, 26, 24],
    lineHeightMultiplier: 1.3,
    maxLines: 2,
    weight: 500
  });
  context.fillStyle = theme.palette.textSecondary;
  setFont(context, 500, headlineLayout.fontSize);
  drawLines(context, headlineLayout.lines, CONTENT_X, titleBottom + 68, headlineLayout.lineHeight);

  const heroCard = {
    x: CONTENT_X,
    y: titleBottom + 132,
    width: CONTENT_WIDTH,
    height: 272
  };
  drawPanel(context, heroCard.x, heroCard.y, heroCard.width, heroCard.height, 34, theme);
  drawHeroCard(context, heroCard.x, heroCard.y, heroCard.width, heroCard.height, {
    language,
    score,
    averageAirs,
    theme,
    currentAirsLabel: copy.currentAirsLabel,
    globalAverageLabel: copy.globalAverageLabel,
    statusLabel: theme.statusLabel[language]
  });

  const readingTitleY = heroCard.y + heroCard.height + 64;
  context.fillStyle = theme.palette.textPrimary;
  setFont(context, 700, 38);
  context.fillText(copy.readingTitle, CONTENT_X, readingTitleY);

  const readingLayout = fitParagraphText(context, summary, CONTENT_WIDTH - 84, {
    fontSizes: language === "zh" ? [32, 30, 28, 26] : [30, 28, 26, 24],
    lineHeightMultiplier: 1.38,
    maxLines: 5,
    paragraphGapMultiplier: 0.5,
    weight: 400
  });
  const readingCard = {
    x: CONTENT_X,
    y: readingTitleY + 26,
    width: CONTENT_WIDTH,
    height: 104 + readingLayout.height
  };
  drawPanel(context, readingCard.x, readingCard.y, readingCard.width, readingCard.height, 32, theme);
  context.fillStyle = theme.palette.accent;
  setFont(context, 700, 26);
  context.fillText(theme.statusLabel[language], readingCard.x + 40, readingCard.y + 54);
  context.fillStyle = theme.palette.textSecondary;
  setFont(context, 400, readingLayout.fontSize);
  drawParagraphLines(
    context,
    readingLayout.lines,
    readingCard.x + 40,
    readingCard.y + 98,
    readingLayout.lineHeight,
    readingLayout.paragraphGap
  );

  const breakdownTitleY = readingCard.y + readingCard.height + 64;
  context.fillStyle = theme.palette.textPrimary;
  setFont(context, 700, 38);
  context.fillText(copy.breakdownTitle, CONTENT_X, breakdownTitleY);

  const breakdownCard = {
    x: CONTENT_X,
    y: breakdownTitleY + 26,
    width: CONTENT_WIDTH,
    height: 320
  };
  drawPanel(context, breakdownCard.x, breakdownCard.y, breakdownCard.width, breakdownCard.height, 32, theme);
  drawBreakdownCard(context, breakdownCard.x, breakdownCard.y, breakdownCard.width, breakdownItems, language, theme);

  const qrDataUrl = await QRCode.toDataURL(qrText, {
    margin: 1,
    width: 240,
    errorCorrectionLevel: "H",
    color: {
      dark: "#08111a",
      light: "#ffffffff"
    }
  });
  const qrImage = await loadImage(qrDataUrl);
  const footerCard = {
    x: CONTENT_X,
    y: CANVAS_HEIGHT - 252,
    width: CONTENT_WIDTH,
    height: 184
  };
  drawPanel(context, footerCard.x, footerCard.y, footerCard.width, footerCard.height, 32, theme);

  context.fillStyle = "#ffffff";
  roundRect(context, footerCard.x + 24, footerCard.y + 24, 132, 132, 22);
  context.fill();
  context.drawImage(qrImage, footerCard.x + 28, footerCard.y + 28, 124, 124);

  const qrTextX = footerCard.x + 194;
  context.fillStyle = theme.palette.textPrimary;
  setFont(context, 700, 30);
  context.fillText(copy.appName, qrTextX, footerCard.y + 58);

  const qrNoteLayout = fitWrappedText(context, copy.shareImageQrNote, 640, {
    fontSizes: [28, 26, 24],
    lineHeightMultiplier: 1.28,
    maxLines: 3,
    weight: 500
  });
  context.fillStyle = theme.palette.textSecondary;
  setFont(context, 500, qrNoteLayout.fontSize);
  drawLines(context, qrNoteLayout.lines, qrTextX, footerCard.y + 102, qrNoteLayout.lineHeight);

  context.textAlign = "center";
  context.fillStyle = theme.palette.textSecondary;
  setFont(context, 400, 20);
  context.fillText(copy.footerCopyright, canvas.width / 2, CANVAS_HEIGHT - 26);
  context.textAlign = "left";

  return canvas.toDataURL("image/png");
}

function drawBackground(context: CanvasRenderingContext2D, theme: ReturnType<typeof getShareScoreTheme>) {
  const gradient = context.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  gradient.addColorStop(0, theme.palette.canvasTop);
  gradient.addColorStop(0.5, theme.palette.canvasBottom);
  gradient.addColorStop(1, "#04070d");
  context.fillStyle = gradient;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  context.fillStyle = theme.palette.canvasAccent;
  context.beginPath();
  context.arc(854, 214, 286, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = theme.palette.accentSoft;
  context.beginPath();
  context.arc(180, 1548, 248, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "rgba(255,255,255,0.06)";
  context.lineWidth = 1.5;
  for (let row = 0; row < 12; row += 1) {
    const y = 118 + row * 138;
    context.beginPath();
    context.moveTo(74, y);
    context.lineTo(CANVAS_WIDTH - 74, y);
    context.stroke();
  }
}

function drawHeroCard(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    language: AppLanguage;
    score: number;
    averageAirs: number;
    theme: ReturnType<typeof getShareScoreTheme>;
    currentAirsLabel: string;
    globalAverageLabel: string;
    statusLabel: string;
  }
) {
  const dividerX = x + width * 0.56;
  context.fillStyle = options.theme.palette.accentSoft;
  roundRect(context, x + 28, y + 24, 156, 34, 17);
  context.fill();
  context.fillStyle = options.theme.palette.accent;
  setFont(context, 700, 20);
  context.fillText(options.statusLabel, x + 44, y + 47);

  context.fillStyle = options.theme.palette.textSecondary;
  setFont(context, 500, 22);
  context.fillText(options.currentAirsLabel, x + 36, y + 96);

  context.fillStyle = options.theme.palette.textPrimary;
  setFont(context, 700, 118);
  context.fillText(formatNumber(options.score, 1, options.language), x + 34, y + 202);

  context.strokeStyle = "rgba(255,255,255,0.08)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(dividerX, y + 36);
  context.lineTo(dividerX, y + height - 36);
  context.stroke();

  context.fillStyle = options.theme.palette.textSecondary;
  setFont(context, 500, 22);
  context.fillText(options.globalAverageLabel, dividerX + 36, y + 96);

  context.fillStyle = options.theme.palette.textPrimary;
  setFont(context, 700, 86);
  context.fillText(formatNumber(options.averageAirs, 1, options.language), dividerX + 34, y + 188);

  const note = options.language === "zh"
    ? "分数越高，当前招聘稳定度越高。"
    : "Higher scores indicate stronger current hiring stability.";
  const noteLayout = fitWrappedText(context, note, width - (dividerX - x) - 72, {
    fontSizes: [24, 22, 20],
    lineHeightMultiplier: 1.3,
    maxLines: 2,
    weight: 500
  });
  context.fillStyle = options.theme.palette.textSecondary;
  setFont(context, 500, noteLayout.fontSize);
  drawLines(context, noteLayout.lines, dividerX + 36, y + 230, noteLayout.lineHeight);
}

function drawBreakdownCard(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  items: ReadonlyArray<{ label: string; value: number; color: string }>,
  language: AppLanguage,
  theme: ReturnType<typeof getShareScoreTheme>
) {
  items.forEach((item, index) => {
    const rowY = y + 38 + index * 72;
    context.fillStyle = theme.palette.textSecondary;
    setFont(context, 500, 24);
    context.fillText(item.label, x + 34, rowY);

    context.textAlign = "right";
    context.fillStyle = theme.palette.textPrimary;
    setFont(context, 600, 24);
    context.fillText(`${formatNumber(item.value * 100, 0, language)}%`, x + width - 34, rowY);
    context.textAlign = "left";

    context.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(context, x + 34, rowY + 20, width - 68, 18, 9);
    context.fill();

    context.fillStyle = item.color;
    roundRect(context, x + 34, rowY + 20, Math.max(52, (width - 68) * Math.max(0, Math.min(1, item.value))), 18, 9);
    context.fill();
  });
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
  language: AppLanguage,
  label: string,
  background: string,
  textColor: string
) {
  const badgeWidth = language === "zh" ? 236 : 252;
  const badgeX = CANVAS_WIDTH - CONTENT_X - badgeWidth;
  context.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(context, badgeX, 56, badgeWidth, 64, 28);
  context.fill();
  context.fillStyle = background;
  roundRect(context, badgeX + 6, 62, badgeWidth - 12, 52, 24);
  context.fill();
  context.fillStyle = textColor;
  setFont(context, 700, 22);
  context.textAlign = "center";
  context.fillText(label, badgeX + badgeWidth / 2, 98);
  context.textAlign = "left";
}

function drawPanel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  theme: ReturnType<typeof getShareScoreTheme>
) {
  context.fillStyle = theme.palette.panelBg;
  roundRect(context, x, y, width, height, radius);
  context.fill();
  context.strokeStyle = theme.palette.panelStroke;
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

function drawParagraphLines(
  context: CanvasRenderingContext2D,
  lines: ParagraphLine[],
  x: number,
  y: number,
  lineHeight: number,
  paragraphGap: number
) {
  let currentY = y;

  lines.forEach((line, index) => {
    if (index > 0 && line.isParagraphStart) {
      currentY += paragraphGap;
    }
    context.fillText(line.text, x, currentY);
    currentY += lineHeight;
  });
}

function wrapLines(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const source = normalizeCanvasInlineText(text);
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
        if (shouldStickToPrevious(fragment)) {
          current = fragmentTrial;
          continue;
        }

        let line = current.trimEnd();
        let carry = fragment;
        while (line.length > 1 && shouldStickToNext(line.slice(-1))) {
          carry = `${line.slice(-1)}${carry}`;
          line = line.slice(0, -1).trimEnd();
        }
        lines.push(line);
        current = carry;
      } else {
        current = fragmentTrial;
      }
    }
  });

  if (current) lines.push(current.trimEnd());
  return lines;
}

function normalizeCanvasInlineText(text: string) {
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\f\v\u00a0]+/g, " ")
    .trim();
}

function splitParagraphs(text: string) {
  const source = String(text || "").replace(/\r\n?/g, "\n").trim();
  if (!source) return [""];
  const paragraphs = source
    .split(/\n+/)
    .map((paragraph) => normalizeCanvasInlineText(paragraph))
    .filter(Boolean);
  if (!paragraphs.length) return [""];

  const merged = paragraphs.reduce<string[]>((result, paragraph) => {
    let currentParagraph = paragraph;
    if (result.length) {
      while (currentParagraph && shouldStickToPrevious(currentParagraph[0])) {
        result[result.length - 1] += currentParagraph[0];
        currentParagraph = currentParagraph.slice(1).trimStart();
      }
    }

    if (currentParagraph) {
      result.push(currentParagraph);
    }
    return result;
  }, []);

  return merged.length ? merged : [""];
}

function shouldStickToPrevious(fragment: string) {
  return /^[，。！？；：、,.!?;:）】》〉」』”’%)\]]$/.test(fragment);
}

function shouldStickToNext(fragment: string) {
  return /^[（【《〈「『“‘(\[]$/.test(fragment);
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

function fitParagraphText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  options: {
    fontSizes: number[];
    lineHeightMultiplier: number;
    paragraphGapMultiplier: number;
    maxLines: number;
    weight: number;
  }
): FittedParagraphTextLayout {
  let fitted: FittedParagraphTextLayout | null = null;

  options.fontSizes.forEach((fontSize) => {
    if (fitted) return;
    setFont(context, options.weight, fontSize);
    const lineHeight = Math.round(fontSize * options.lineHeightMultiplier);
    const paragraphGap = Math.round(fontSize * options.paragraphGapMultiplier);
    const lines = buildParagraphLines(context, text, maxWidth);
    if (lines.length <= options.maxLines) {
      fitted = {
        lines,
        fontSize,
        lineHeight,
        paragraphGap,
        height: getParagraphLayoutHeight(lines, lineHeight, paragraphGap)
      };
    }
  });

  if (fitted) return fitted;

  const fontSize = options.fontSizes[options.fontSizes.length - 1];
  setFont(context, options.weight, fontSize);
  const lineHeight = Math.round(fontSize * options.lineHeightMultiplier);
  const paragraphGap = Math.round(fontSize * options.paragraphGapMultiplier);
  const lines = fitParagraphLines(buildParagraphLines(context, text, maxWidth), options.maxLines);

  return {
    lines,
    fontSize,
    lineHeight,
    paragraphGap,
    height: getParagraphLayoutHeight(lines, lineHeight, paragraphGap)
  };
}

function buildParagraphLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) {
  return splitParagraphs(text).flatMap((paragraph) =>
    wrapLines(context, paragraph, maxWidth).map((line, index) => ({
      text: line,
      isParagraphStart: index === 0
    }))
  );
}

function fitParagraphLines(lines: ParagraphLine[], maxLines: number) {
  if (lines.length <= maxLines) return lines;
  const next = lines.slice(0, maxLines).map((line) => ({ ...line }));
  next[maxLines - 1].text = appendEllipsis(next[maxLines - 1].text);
  return next;
}

function getParagraphLayoutHeight(lines: ParagraphLine[], lineHeight: number, paragraphGap: number) {
  if (!lines.length) return lineHeight;

  let height = 0;
  lines.forEach((line, index) => {
    if (index > 0 && line.isParagraphStart) {
      height += paragraphGap;
    }
    height += lineHeight;
  });
  return height;
}

function fitLines(lines: string[], maxLines: number) {
  if (lines.length <= maxLines) return lines;
  const next = lines.slice(0, maxLines);
  next[maxLines - 1] = appendEllipsis(next[maxLines - 1]);
  return next;
}

function appendEllipsis(text: string) {
  return text.replace(/[。！？；，、,.!?;:：]?\s*$/, "") + "…";
}

function setFont(context: CanvasRenderingContext2D, weight: number, size: number) {
  context.font = `${weight} ${size}px ${FONT_FAMILY}`;
}
