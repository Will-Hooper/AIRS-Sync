import fs from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";

const { renderMascotSceneSvg } = await import("../frontend/src/h5/share/share-mascot-renderer.ts");
const { getMascotBandCopy, getMascotScoreBand } = await import("../frontend/src/h5/share/share-mascot-score-map.ts");

const OUTPUT_DIR = path.resolve("output/share-mascot-samples");
const FONT_FAMILY = "'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";

const SAMPLES = [
  {
    score: 95,
    occupation: "中学数学教师",
    summary: "课堂主导权仍在人，AI 更像备课和练习设计的辅助工具。",
    filename: "airs-share-secure-95.svg"
  },
  {
    score: 72,
    occupation: "数据分析师",
    summary: "AI 已经深度进入日常分析流程，但节奏和判断仍然可以被人掌控。",
    filename: "airs-share-steady-72.svg"
  },
  {
    score: 53,
    occupation: "跨境电商直播运营与内容策划专员",
    summary: "自动化工具开始增多，岗位还在，但牛马都得更明显地提着一口气干活。",
    filename: "airs-share-watchful-53.svg"
  },
  {
    score: 31,
    occupation: "内容审核专员",
    summary: "系统压迫感已经明显上升，岗位流程越来越容易被 AI 与规则引擎重写。",
    filename: "airs-share-strained-31.svg"
  },
  {
    score: 12,
    occupation: "电话销售",
    summary: "自动化系统开始主导流程，岗位存在感还在，但主导权正在快速被压缩。",
    filename: "airs-share-critical-12.svg"
  }
];

await fs.mkdir(OUTPUT_DIR, { recursive: true });

for (const sample of SAMPLES) {
  const band = getMascotScoreBand(sample.score);
  const copy = getMascotBandCopy(sample.score, "zh");
  const qrSvg = await QRCode.toString(`https://airsindex.com/h5/share-demo?score=${sample.score}`, {
    type: "svg",
    margin: 1,
    width: 240,
    color: {
      dark: "#0a1220",
      light: "#ffffffff"
    }
  });
  const mascotSvg = renderMascotSceneSvg({
    score: sample.score,
    language: "zh",
    width: 912,
    height: 620
  });
  const content = buildShareCardSvg({
    score: sample.score,
    occupation: sample.occupation,
    summary: sample.summary,
    badge: copy.badge,
    rangeLabel: copy.rangeLabel,
    riskHint: copy.riskHint,
    average: "61.7",
    palette: band.palette,
    mascotDataUrl: svgToDataUrl(mascotSvg),
    qrDataUrl: svgToDataUrl(qrSvg)
  });

  await fs.writeFile(path.join(OUTPUT_DIR, sample.filename), content, "utf8");
}

console.log(`Exported ${SAMPLES.length} share samples to ${OUTPUT_DIR}`);

function buildShareCardSvg({
  score,
  occupation,
  summary,
  badge,
  rangeLabel,
  riskHint,
  average,
  palette,
  mascotDataUrl,
  qrDataUrl
}) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920" fill="none">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1080" y2="1920" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${palette.canvasTop}" />
      <stop offset="100%" stop-color="${palette.canvasBottom}" />
    </linearGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#bg)" />
  <circle cx="920" cy="220" r="260" fill="${palette.glowSoft}" />
  <circle cx="140" cy="1560" r="236" fill="${palette.helperSoft}" />

  <text x="84" y="102" fill="${palette.glow}" font-family="${FONT_FAMILY}" font-size="30" font-weight="500">AIRS</text>
  <rect x="778" y="66" width="218" height="56" rx="28" fill="rgba(255,255,255,0.12)" />
  <rect x="782" y="70" width="210" height="48" rx="24" fill="${palette.badgeBg}" />
  <text x="887" y="102" text-anchor="middle" fill="${palette.badgeText}" font-family="${FONT_FAMILY}" font-size="22" font-weight="700">${escapeXml(rangeLabel)}</text>

  <foreignObject x="84" y="150" width="912" height="220">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:${FONT_FAMILY};color:#f2f6ff;">
      <div style="font-size:76px;line-height:1.08;font-weight:700;letter-spacing:-0.06em;">${escapeHtml(occupation)}</div>
      <div style="margin-top:20px;font-size:28px;color:rgba(242,246,255,0.68);">示例分享图 · AIRS ${score.toFixed(1)}</div>
      <div style="margin-top:10px;font-size:24px;color:rgba(242,246,255,0.48);">分数越高越稳定，越低越容易受到 AI 冲击。</div>
    </div>
  </foreignObject>

  <image href="${mascotDataUrl}" x="84" y="392" width="912" height="620" preserveAspectRatio="xMidYMid meet" />

  ${renderMetricCardSvg(84, 1046, "当前 AIRS", score.toFixed(1), badge, palette.glow)}
  ${renderMetricCardSvg(562, 1046, "全局平均值", average, "用于和全体职业做对照", palette.helper)}

  <text x="84" y="1322" fill="#f2f6ff" font-family="${FONT_FAMILY}" font-size="40" font-weight="700">职业解读 / 风险提示</text>
  <rect x="84" y="1350" width="912" height="318" rx="28" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
  <text x="126" y="1402" fill="${palette.glow}" font-family="${FONT_FAMILY}" font-size="30" font-weight="700">${escapeXml(badge)}</text>
  <foreignObject x="126" y="1430" width="828" height="208">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:${FONT_FAMILY};font-size:28px;line-height:1.45;color:rgba(242,246,255,0.76);">
      <p style="margin:0 0 12px 0;">${escapeHtml(riskHint)}</p>
      <p style="margin:0;">${escapeHtml(summary)}</p>
    </div>
  </foreignObject>

  <rect x="84" y="1712" width="912" height="176" rx="32" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
  <rect x="108" y="1732" width="136" height="136" rx="22" fill="white" />
  <image href="${qrDataUrl}" x="112" y="1736" width="128" height="128" preserveAspectRatio="xMidYMid meet" />
  <text x="280" y="1770" fill="#f2f6ff" font-family="${FONT_FAMILY}" font-size="30" font-weight="700">AIRS</text>
  <foreignObject x="280" y="1790" width="640" height="76">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:${FONT_FAMILY};font-size:26px;line-height:1.28;color:rgba(242,246,255,0.84);">
      打开 H5 页面，看看 AI 正在怎样改写这个职业。
    </div>
  </foreignObject>

  <text x="540" y="1892" text-anchor="middle" fill="rgba(242,246,255,0.42)" font-family="${FONT_FAMILY}" font-size="20" font-weight="400">© 2026 airsindex.com, sample mascot share</text>
</svg>`.trim();
}

function renderMetricCardSvg(x, y, label, value, note, accent) {
  return `
  <g transform="translate(${x} ${y})">
    <rect width="434" height="190" rx="28" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
    <rect x="24" y="22" width="108" height="30" rx="15" fill="rgba(255,255,255,0.06)" />
    <rect x="32" y="30" width="16" height="14" rx="7" fill="${accent}" />
    <text x="58" y="44" fill="rgba(242,246,255,0.58)" font-family="${FONT_FAMILY}" font-size="20" font-weight="500">${escapeXml(label)}</text>
    <text x="30" y="130" fill="#f2f6ff" font-family="${FONT_FAMILY}" font-size="84" font-weight="700">${escapeXml(value)}</text>
    <foreignObject x="30" y="146" width="374" height="44">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:${FONT_FAMILY};font-size:20px;line-height:1.35;color:rgba(242,246,255,0.5);">${escapeHtml(note)}</div>
    </foreignObject>
  </g>`;
}

function svgToDataUrl(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeXml(value) {
  return escapeHtml(value).replace(/'/g, "&apos;");
}
