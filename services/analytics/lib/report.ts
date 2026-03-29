import path from "node:path";
import { analyticsPaths, readSearchEvents, writeHtmlFile, writeJsonFile } from "./storage";
import type {
  AnalyticsReportArtifacts,
  AnalyticsReportModel,
  ReportBarDatum,
  ReportTrendDatum,
  SearchEventRecord
} from "./types";

function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function formatDayKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function countBy(items: string[]) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const key = item.trim();
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function topRows(rows: ReportBarDatum[], limit = 10) {
  return rows.slice(0, limit);
}

function buildTrend(events: SearchEventRecord[], now: Date) {
  const dayCount = 21;
  const start = startOfUtcDay(new Date(now.getTime() - (dayCount - 1) * 24 * 60 * 60 * 1000));
  const buckets = new Map<string, number>();

  for (let index = 0; index < dayCount; index += 1) {
    const current = new Date(start.getTime() + index * 24 * 60 * 60 * 1000);
    buckets.set(formatDayKey(current), 0);
  }

  events.forEach((event) => {
    const key = formatDayKey(new Date(event.occurredAt));
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
  });

  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}

function buildRecentWindow(trend: ReportTrendDatum[]) {
  const lastThree = trend.slice(-3);
  const previousThree = trend.slice(-6, -3);
  const lastThreeDays = lastThree.reduce((sum, row) => sum + row.count, 0);
  const previousThreeDays = previousThree.reduce((sum, row) => sum + row.count, 0);
  const delta = lastThreeDays - previousThreeDays;
  const deltaPercent = previousThreeDays > 0 ? delta / previousThreeDays : null;
  return { lastThreeDays, previousThreeDays, delta, deltaPercent };
}

function svgTrend(trend: ReportTrendDatum[]) {
  const width = 820;
  const height = 220;
  const padding = 20;
  const max = Math.max(...trend.map((row) => row.count), 1);
  const points = trend.map((row, index) => {
    const x = padding + (index / Math.max(trend.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (row.count / max) * (height - padding * 2);
    return `${x},${y}`;
  });

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Search trend chart" class="chart">
      <rect width="${width}" height="${height}" rx="18" fill="rgba(255,255,255,0.02)"></rect>
      <polyline fill="none" stroke="#8bc8ff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="${points.join(" ")}"></polyline>
      ${trend
        .map((row, index) => {
          const [x, y] = points[index].split(",");
          return `<circle cx="${x}" cy="${y}" r="4" fill="#8ef0cf"><title>${row.date}: ${row.count}</title></circle>`;
        })
        .join("")}
    </svg>
  `;
}

function barList(title: string, rows: ReportBarDatum[], empty = "暂无数据") {
  if (!rows.length) {
    return `<section class="card"><h3>${title}</h3><p class="empty">${empty}</p></section>`;
  }
  const max = Math.max(...rows.map((row) => row.count), 1);
  return `
    <section class="card">
      <h3>${title}</h3>
      <div class="bars">
        ${rows
          .map(
            (row) => `
          <div class="bar-row">
            <div class="bar-meta">
              <span class="bar-label">${row.label}</span>
              <span class="bar-value">${row.count}</span>
            </div>
            <div class="bar-track"><span class="bar-fill" style="width:${Math.max(6, (row.count / max) * 100)}%"></span></div>
          </div>`
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderReportHtml(model: AnalyticsReportModel) {
  const deltaText =
    model.recentWindow.deltaPercent === null
      ? "缺少上一个 3 天窗口的数据，暂不计算变化率。"
      : `最近 3 天较前 3 天 ${model.recentWindow.delta >= 0 ? "上升" : "下降"} ${Math.abs(model.recentWindow.delta)} 次（${Math.abs(
          model.recentWindow.deltaPercent * 100
        ).toFixed(1)}%）。`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AIRS 三日统计报表</title>
  <style>
    :root{color-scheme:dark}
    body{margin:0;background:#09111a;color:#f2f6ff;font-family:"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}
    .wrap{max-width:1280px;margin:0 auto;padding:40px 24px 80px}
    .hero{padding:28px 30px;border:1px solid rgba(139,200,255,.12);border-radius:28px;background:linear-gradient(180deg,rgba(15,23,33,.94),rgba(10,17,27,.88));box-shadow:0 30px 80px rgba(2,8,15,.36)}
    .kicker{font-size:12px;letter-spacing:.32em;text-transform:uppercase;color:#8ef0cf}
    h1{font-size:56px;line-height:1.02;letter-spacing:-.06em;margin:14px 0 14px}
    .sub{font-size:16px;line-height:1.9;color:rgba(242,246,255,.68)}
    .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin-top:24px}
    .metric,.card{padding:22px 24px;border:1px solid rgba(139,200,255,.12);border-radius:24px;background:rgba(11,18,28,.82)}
    .metric-label{font-size:13px;color:rgba(242,246,255,.55)}
    .metric-value{margin-top:14px;font-size:46px;font-weight:700;letter-spacing:-.06em}
    .stack{display:grid;grid-template-columns:1.2fr .8fr;gap:18px;margin-top:22px}
    h2,h3{margin:0 0 16px}
    h2{font-size:30px;letter-spacing:-.04em}
    h3{font-size:20px;letter-spacing:-.03em}
    .chart{width:100%;height:auto}
    .bars{display:grid;gap:12px}
    .bar-row{display:grid;gap:8px}
    .bar-meta{display:flex;align-items:center;justify-content:space-between;gap:12px}
    .bar-label{font-size:14px;color:rgba(242,246,255,.76)}
    .bar-value{font-size:14px;color:#f2f6ff}
    .bar-track{height:10px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}
    .bar-fill{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#8ef0cf,#8bc8ff)}
    .empty{color:rgba(242,246,255,.5)}
    .footer{margin-top:18px;color:rgba(242,246,255,.45);font-size:14px}
    @media (max-width: 980px){.grid,.stack{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <div class="kicker">AIRS Analytics</div>
      <h1>每 3 天一次的搜索与地域统计报表</h1>
      <p class="sub">生成时间：${model.generatedAt}。这份报表聚焦职业输入次数排行、IP 地域分布、趋势变化和总输入次数，供 AIRS 站点运营与传播分析使用。</p>
    </section>

    <section class="grid">
      <article class="metric">
        <div class="metric-label">总输入次数</div>
        <div class="metric-value">${model.totalInputCount}</div>
      </article>
      <article class="metric">
        <div class="metric-label">唯一输入词数</div>
        <div class="metric-value">${model.uniqueQueryCount}</div>
      </article>
      <article class="metric">
        <div class="metric-label">最近 3 天</div>
        <div class="metric-value">${model.recentWindow.lastThreeDays}</div>
      </article>
      <article class="metric">
        <div class="metric-label">前 3 天</div>
        <div class="metric-value">${model.recentWindow.previousThreeDays}</div>
      </article>
    </section>

    <section class="stack">
      <article class="card">
        <h2>趋势变化</h2>
        ${svgTrend(model.trend)}
        <p class="footer">${deltaText}</p>
      </article>
      <article class="card">
        <h2>IP 地域分布</h2>
        ${barList("国家 / 地区", model.countries, "还没有国家分布数据。")}
      </article>
    </section>

    <section class="stack">
      ${barList("职业输入次数排行", model.topQueries, "还没有职业输入数据。")}
      ${barList("已识别职业排行", model.topResolvedOccupations, "还没有识别到职业点击或命中数据。")}
    </section>

    <section class="stack">
      ${barList("省州 / 区域分布", model.regions, "还没有省州级分布数据。")}
      ${barList("城市分布", model.cities, "还没有城市级分布数据。")}
    </section>
  </div>
</body>
</html>`;
}

export function buildAnalyticsReportModel(events: SearchEventRecord[], now = new Date()): AnalyticsReportModel {
  const trend = buildTrend(events, now);
  const recentWindow = buildRecentWindow(trend);

  const topQueries = topRows(
    countBy(
      events.map((event) => {
        if (event.occupation?.titleZh) return event.occupation.titleZh;
        if (event.occupation?.title) return event.occupation.title;
        return event.query;
      })
    )
  );

  const topResolvedOccupations = topRows(
    countBy(
      events
        .map((event) => {
          if (!event.occupation) return "";
          const title = event.occupation.titleZh || event.occupation.title;
          return title ? `${title} (${event.occupation.socCode})` : event.occupation.socCode;
        })
        .filter(Boolean)
    )
  );

  const countries = topRows(countBy(events.map((event) => event.location.country || "未知")));
  const regions = topRows(
    countBy(
      events.map((event) => {
        const country = event.location.country || "未知";
        const region = event.location.region || "未知区域";
        return `${country} / ${region}`;
      })
    )
  );
  const cities = topRows(
    countBy(
      events.map((event) => {
        const country = event.location.country || "未知";
        const city = event.location.city || "未知城市";
        return `${country} / ${city}`;
      })
    )
  );

  return {
    generatedAt: now.toISOString(),
    totalInputCount: events.length,
    uniqueQueryCount: new Set(events.map((event) => event.normalizedQuery || event.query.trim())).size,
    topQueries,
    topResolvedOccupations,
    countries,
    regions,
    cities,
    trend,
    recentWindow
  };
}

export function generateAnalyticsReport(now = new Date()): AnalyticsReportArtifacts {
  const events = readSearchEvents();
  const model = buildAnalyticsReportModel(events, now);
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  const timestampedJsonPath = path.join(analyticsPaths.reportsDir, `analytics-report-${stamp}.json`);
  const timestampedHtmlPath = path.join(analyticsPaths.reportsDir, `analytics-report-${stamp}.html`);
  const html = renderReportHtml(model);

  writeJsonFile(analyticsPaths.latestReportJson, model);
  writeJsonFile(timestampedJsonPath, model);
  writeHtmlFile(analyticsPaths.latestReportHtml, html);
  writeHtmlFile(timestampedHtmlPath, html);

  return {
    model,
    latestJsonPath: analyticsPaths.latestReportJson,
    latestHtmlPath: analyticsPaths.latestReportHtml,
    timestampedJsonPath,
    timestampedHtmlPath
  };
}
