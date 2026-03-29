import fs from "node:fs";
import path from "node:path";
import type { AnalyticsSchedulerState, SearchEventRecord } from "./types";

const analyticsRoot = path.resolve(process.cwd(), "services", "analytics");
const dataDir = path.join(analyticsRoot, "data");
const reportsDir = path.join(analyticsRoot, "reports");

export const analyticsPaths = {
  analyticsRoot,
  dataDir,
  reportsDir,
  eventsFile: path.join(dataDir, "search-events.ndjson"),
  schedulerStateFile: path.join(dataDir, "scheduler-state.json"),
  latestReportJson: path.join(reportsDir, "latest-report.json"),
  latestReportHtml: path.join(reportsDir, "latest-report.html")
};

export function ensureAnalyticsDirs() {
  fs.mkdirSync(analyticsPaths.dataDir, { recursive: true });
  fs.mkdirSync(analyticsPaths.reportsDir, { recursive: true });
}

export function appendSearchEvent(record: SearchEventRecord) {
  ensureAnalyticsDirs();
  fs.appendFileSync(analyticsPaths.eventsFile, `${JSON.stringify(record)}\n`, "utf8");
}

export function readSearchEvents() {
  ensureAnalyticsDirs();
  if (!fs.existsSync(analyticsPaths.eventsFile)) return [] as SearchEventRecord[];

  return fs
    .readFileSync(analyticsPaths.eventsFile, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as SearchEventRecord;
      } catch {
        return null;
      }
    })
    .filter((record): record is SearchEventRecord => Boolean(record));
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
