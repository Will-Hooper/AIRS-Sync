import QRCode from "qrcode";
import { formatCurrency, formatDateTimeValue, formatNumber } from "../../lib/format";
import type { AppLanguage } from "../../lib/i18n";
import type { DatasetSourceUpdatedAt, OccupationRow } from "../../lib/types";

interface ShareImageOptions {
  occupation: OccupationRow;
  averageAirs: number;
  language: AppLanguage;
  generatedAt?: string;
  sourceUpdatedAt?: DatasetSourceUpdatedAt;
  siteUrl?: string;
}

function siteUrlFromWindow() {
  if (typeof window === "undefined") return "https://will-hooper.github.io/AIRS-Sync/m/";
  return window.location.href;
}

export async function renderOccupationShareImage({
  occupation,
  averageAirs,
  language,
  generatedAt,
  sourceUpdatedAt,
  siteUrl = siteUrlFromWindow()
}: ShareImageOptions) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("canvas context unavailable");
  }

  const gradient = context.createLinearGradient(0, 0, 1080, 1920);
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
  const breakdown = [
    { label: language === "zh" ? "替代压力" : "Replacement", value: Number(occupation.replacement || 0) },
    { label: language === "zh" ? "岗位改写" : "Augmentation", value: Number(occupation.augmentation || 0) },
    { label: language === "zh" ? "招聘兑现" : "Hiring", value: Number(occupation.hiring || 0) },
    { label: language === "zh" ? "历史累计渗透" : "Historical", value: Number(occupation.historical || 0) }
  ];

  context.fillStyle = "#8ef0cf";
  context.font = "500 30px 'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
  context.fillText("AIRS", 84, 102);

  context.fillStyle = "#f2f6ff";
  context.font = "700 80px 'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
  wrapText(context, title, 84, 190, 760, 92);

  context.fillStyle = "rgba(242,246,255,0.7)";
  context.font = "400 30px 'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
  context.fillText(occupation.socCode, 84, 420);

  drawMetricCard(
    context,
    84,
    490,
    430,
    240,
    language === "zh" ? "当前 AIRS" : "Current AIRS",
    formatNumber(occupation.airs || 0, 1, language),
    language === "zh" ? "越高表示招聘层更稳定" : "Higher means more stable hiring"
  );
  drawMetricCard(
    context,
    566,
    490,
    430,
    240,
    language === "zh" ? "全局平均值" : "Average AIRS",
    formatNumber(averageAirs, 1, language),
    language === "zh" ? "全部职业均值" : "Across all occupations"
  );

  context.fillStyle = "#f2f6ff";
  context.font = "700 42px 'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
  context.fillText(language === "zh" ? "分项拆解" : "Breakdown", 84, 830);

  breakdown.forEach((item, index) => {
    const y = 900 + index * 138;
    context.fillStyle = "rgba(255,255,255,0.9)";
    context.font = "500 28px 'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    context.fillText(item.label, 84, y);
    context.fillStyle = "rgba(255,255,255,0.55)";
    context.font = "500 24px 'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    context.fillText(`${formatNumber(item.value * 100, 0, language)}%`, 928, y);
    context.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(context, 84, y + 28, 848, 16, 8);
    context.fill();
    context.fillStyle = "#8bc8ff";
    roundRect(context, 84, y + 28, Math.max(36, 848 * item.value), 16, 8);
    context.fill();
  });

  const summary = language === "zh"
    ? occupation.summaryZh || occupation.summary
    : occupation.summary;
  context.fillStyle = "#f2f6ff";
  context.font = "700 40px 'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
  context.fillText(language === "zh" ? "职业解读" : "Reading", 84, 1490);
  context.fillStyle = "rgba(242,246,255,0.72)";
  context.font = "400 28px 'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
  wrapText(context, summary, 84, 1550, 660, 44);

  const qrDataUrl = await QRCode.toDataURL(siteUrl, {
    margin: 1,
    width: 220,
    color: {
      dark: "#f2f6ff",
      light: "#0000"
    }
  });

  const qrImage = await loadImage(qrDataUrl);
  context.drawImage(qrImage, 770, 1490, 220, 220);
  context.fillStyle = "rgba(242,246,255,0.8)";
  context.font = "500 22px 'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
  wrapText(context, language === "zh" ? "扫码进入网站" : "Scan to open the site", 770, 1740, 220, 30);

  context.fillStyle = "rgba(242,246,255,0.62)";
  context.font = "400 22px 'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
  context.fillText(
    `${language === "zh" ? "图片生成时间" : "Image generated"}：${formatDateTimeValue(new Date(), language)}`,
    84,
    1840
  );
  context.fillText(
    `${language === "zh" ? "数据更新时间" : "Dataset updated"}：${formatDateTimeValue(
      generatedAt || sourceUpdatedAt?.recruitment || sourceUpdatedAt?.airs,
      language
    )}`,
    84,
    1876
  );

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
  context.fillStyle = "rgba(255,255,255,0.04)";
  roundRect(context, x, y, width, height, 28);
  context.fill();
  context.strokeStyle = "rgba(255,255,255,0.08)";
  context.lineWidth = 2;
  roundRect(context, x, y, width, height, 28);
  context.stroke();

  context.fillStyle = "rgba(242,246,255,0.58)";
  context.font = "500 22px 'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
  context.fillText(label, x + 34, y + 54);
  context.fillStyle = "#f2f6ff";
  context.font = "700 92px 'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
  context.fillText(value, x + 34, y + 150);
  context.fillStyle = "rgba(242,246,255,0.5)";
  context.font = "400 22px 'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
  wrapText(context, note, x + 34, y + 188, width - 68, 30);
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
  const words = text.split(/(?<=\S)\s+/);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const trial = current ? `${current} ${word}` : word;
    if (context.measureText(trial).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = trial;
    }
  });
  if (current) lines.push(current);

  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });
}
