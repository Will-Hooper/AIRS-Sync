import fs from "node:fs";
import path from "node:path";
import type { AnalyticsSchedulerState, SearchEventRecord, SearchFeedbackRecord } from "./types";

const analyticsRoot = path.resolve(process.cwd(), "services", "analytics");
const dataDir = path.join(analyticsRoot, "data");
const reportsDir = path.join(analyticsRoot, "reports");

export const analyticsPaths = {
  analyticsRoot,
  dataDir,
  reportsDir,
  eventsFile: path.join(dataDir, "search-events.ndjson"),
  feedbackFile: path.join(dataDir, "search-feedback.ndjson"),
  schedulerStateFile: path.join(dataDir, "scheduler-state.json"),
  latestReportJson: path.join(reportsDir, "latest-report.json"),
  latestReportHtml: path.join(reportsDir, "latest-report.html"),
  latestSearchQualityJson: path.join(reportsDir, "latest-search-quality.json")
};

export function ensureAnalyticsDirs() {
  fs.mkdirSync(analyticsPaths.dataDir, { recursive: true });
  fs.mkdirSync(analyticsPaths.reportsDir, { recursive: true });
}

export function appendSearchEvent(record: SearchEventRecord) {
  ensureAnalyticsDirs();
  fs.appendFileSync(analyticsPaths.eventsFile, `${JSON.stringify(record)}\n`, "utf8");
}

export function appendSearchFeedback(record: SearchFeedbackRecord) {
  ensureAnalyticsDirs();
  fs.appendFileSync(analyticsPaths.feedbackFile, `${JSON.stringify(record)}\n`, "utf8");
}

function readNdjsonFile<T>(filePath: string) {
  ensureAnalyticsDirs();
  if (!fs.existsSync(filePath)) return [] as T[];

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as T;
      } catch {
        return null;
      }
    })
    .filter((record): record is T => Boolean(record));
}

export function readSearchEvents() {
  return readNdjsonFile<SearchEventRecord>(analyticsPaths.eventsFile);
}

export function readSearchFeedback() {
  return readNdjsonFile<SearchFeedbackRecord>(analyticsPaths.feedbackFile);
}

export function readSchedulerState(): AnalyticsSchedulerState {
  ensureAnalyticsDirs();
  if (!fs.existsSync(analyticsPaths.schedulerStateFile)) return {};
  try {
    return JSON.parse(fs.readFileSync(analyticsPaths.schedulerStateFile, "utf8")) as AnalyticsSchedulerState;
  } catch {
    return {};
  }
}

export function writeSchedulerState(state: AnalyticsSchedulerState) {
  ensureAnalyticsDirs();
  fs.writeFileSync(analyticsPaths.schedulerStateFile, JSON.stringify(state, null, 2), "utf8");
}

export function writeJsonFile(filePath: string, value: unknown) {
  ensureAnalyticsDirs();
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

export function writeHtmlFile(filePath: string, html: string) {
  ensureAnalyticsDirs();
  fs.writeFileSync(filePath, html, "utf8");
}
