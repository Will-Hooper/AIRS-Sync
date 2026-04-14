import path from "node:path";
import { analyticsPaths, readSearchEvents, readSearchFeedback, writeJsonFile } from "./storage";
import type { ReportBarDatum, SearchEventRecord, SearchFeedbackRecord, SearchQualityReportModel } from "./types";

function countBy(items: string[]) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const key = item.trim();
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, "zh-Hans-CN"));
}

function topRows(rows: ReportBarDatum[], limit = 50) {
  return rows.slice(0, limit);
}

function rate(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Number((numerator / denominator).toFixed(4));
}

function firstSearchesBySession(events: SearchEventRecord[]) {
  const sorted = events
    .slice()
    .sort((left, right) => new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime());
  const firstEvents = new Map<string, SearchEventRecord>();

  sorted.forEach((event) => {
    const sessionKey = event.sessionId || `no-session:${event.id}`;
    if (!firstEvents.has(sessionKey)) {
      firstEvents.set(sessionKey, event);
    }
  });

  return [...firstEvents.values()];
}

export function buildSearchQualityReportModel(
  events: SearchEventRecord[],
  feedback: SearchFeedbackRecord[],
  now = new Date()
): SearchQualityReportModel {
  const normalizedQueries = events.map((event) => event.normalizedQuery || event.query.trim()).filter(Boolean);
  const zeroResultEvents = events.filter((event) => Boolean(event.isZeroResult));
  const noClickEvents = events.filter((event) => Number(event.resultCount || 0) > 0 && !event.didClickResult);
  const firstEvents = firstSearchesBySession(events);
  const firstHitCount = firstEvents.filter((event) => !event.isZeroResult && Number(event.resultCount || 0) > 0).length;

  return {
    generatedAt: now.toISOString(),
    totalSearches: events.length,
    uniqueQueryCount: new Set(normalizedQueries).size,
    firstSearchHitRate: rate(firstHitCount, firstEvents.length),
    zeroResultRate: rate(zeroResultEvents.length, events.length),
    feedbackCount: feedback.length,
    topQueries: topRows(countBy(normalizedQueries)),
    topZeroResultQueries: topRows(countBy(zeroResultEvents.map((event) => event.normalizedQuery || event.query))),
    topNoClickQueries: topRows(countBy(noClickEvents.map((event) => event.normalizedQuery || event.query))),
    matchTypeDistribution: topRows(countBy(events.map((event) => event.matchType || "unknown"))),
    deviceTypeDistribution: topRows(countBy(events.map((event) => event.deviceType || "unknown"))),
    topFeedbackTerms: topRows(countBy(feedback.map((entry) => entry.feedbackText)))
  };
}

export function generateSearchQualityReport(now = new Date()) {
  const model = buildSearchQualityReportModel(readSearchEvents(), readSearchFeedback(), now);
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  const timestampedPath = path.join(analyticsPaths.reportsDir, `search-quality-report-${stamp}.json`);

  writeJsonFile(analyticsPaths.latestSearchQualityJson, model);
  writeJsonFile(timestampedPath, model);

  return {
    model,
    latestJsonPath: analyticsPaths.latestSearchQualityJson,
    timestampedJsonPath: timestampedPath
  };
}
