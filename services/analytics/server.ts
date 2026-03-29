import crypto from "node:crypto";
import express from "express";
import geoip from "geoip-lite";
import { sendAnalyticsReportEmail } from "./lib/email";
import { generateAnalyticsReport } from "./lib/report";
import { analyticsPaths, appendSearchEvent, ensureAnalyticsDirs, readSchedulerState, writeSchedulerState } from "./lib/storage";
import type { SearchEventRecord } from "./lib/types";

const REPORT_INTERVAL_MS = 72 * 60 * 60 * 1000;

function getAllowedOrigins() {
  const configured = process.env.ANALYTICS_ALLOWED_ORIGINS?.trim();
  if (!configured) return ["*"];
  return configured
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function applyCors(origin: string | undefined, allowedOrigins: string[]) {
  if (!origin || allowedOrigins.includes("*")) return "*";
  return allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || "*";
}

function getClientIp(req: express.Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0];
  }
  return req.ip || req.socket.remoteAddress || "0.0.0.0";
}

function normalizeLocation(ip: string) {
  const safeIp = ip.replace(/^::ffff:/, "");
  const hit = geoip.lookup(safeIp);
  return {
    country: hit?.country || "Unknown",
    region: hit?.region || "Unknown",
    city: hit?.city || "Unknown"
  };
}

function buildEventRecord(req: express.Request): SearchEventRecord {
  const body = req.body || {};
  const ip = getClientIp(req);
  return {
    id: crypto.randomUUID(),
    occurredAt: body.timestamp || new Date().toISOString(),
    query: String(body.query || "").trim(),
    normalizedQuery: String(body.query || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " "),
    language: String(body.language || "zh"),
    source: String(body.source || "unknown"),
    pageUrl: String(body.pageUrl || req.headers.origin || ""),
    referrer: String(req.headers.referer || body.referrer || ""),
    userAgent: String(req.headers["user-agent"] || ""),
    ip,
    location: normalizeLocation(ip),
    occupation: body.occupation && typeof body.occupation === "object"
      ? {
          socCode: String(body.occupation.socCode || ""),
          title: String(body.occupation.title || ""),
          titleZh: body.occupation.titleZh ? String(body.occupation.titleZh) : undefined
        }
      : null
  };
}

async function runScheduledReportIfDue(force = false) {
  const state = readSchedulerState();
  const lastRunAt = state.lastRunAt ? new Date(state.lastRunAt).getTime() : 0;
  const now = Date.now();
  if (!force && lastRunAt && now - lastRunAt < REPORT_INTERVAL_MS) {
    return { skipped: true };
  }

  try {
    const report = generateAnalyticsReport(new Date(now));
    await sendAnalyticsReportEmail(report);
    writeSchedulerState({
      lastRunAt: new Date(now).toISOString(),
      lastStatus: "success",
      lastError: ""
    });
    return { skipped: false, report };
  } catch (error) {
    writeSchedulerState({
      lastRunAt: new Date(now).toISOString(),
      lastStatus: "failure",
      lastError: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

async function main() {
  ensureAnalyticsDirs();

  const app = express();
  const allowedOrigins = getAllowedOrigins();
  app.use(express.json({ limit: "32kb" }));
  app.use((req, res, next) => {
    const origin = typeof req.headers.origin === "string" ? req.headers.origin : undefined;
    res.setHeader("Access-Control-Allow-Origin", applyCors(origin, allowedOrigins));
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "airs-analytics", reports: analyticsPaths.latestReportHtml });
  });

  app.post("/api/analytics/events/search", (req, res) => {
    const record = buildEventRecord(req);
    if (!record.query) {
      res.status(400).json({ ok: false, error: "query is required" });
      return;
    }
    appendSearchEvent(record);
    res.status(202).json({ ok: true });
  });

  app.get("/api/analytics/reports/latest", (_req, res) => {
    res.sendFile(analyticsPaths.latestReportHtml);
  });

  app.get("/api/analytics/reports/latest.json", (_req, res) => {
    res.sendFile(analyticsPaths.latestReportJson);
  });

  const port = Number(process.env.ANALYTICS_PORT || 8787);
  app.listen(port, () => {
    console.log(`AIRS analytics server listening on http://localhost:${port}`);
  });

  if (String(process.env.ANALYTICS_DISABLE_SCHEDULER || "").toLowerCase() !== "true") {
    void runScheduledReportIfDue().catch((error) => {
      console.error("Initial analytics report run failed:", error);
    });
    setInterval(() => {
      void runScheduledReportIfDue().catch((error) => {
        console.error("Scheduled analytics report run failed:", error);
      });
    }, 60 * 60 * 1000);
  }
}

void main();
