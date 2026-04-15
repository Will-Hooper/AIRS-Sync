import type { OccupationRow, OccupationSearchMatchType } from "./types";

export type SearchEventSource =
  | "h5-home"
  | "h5-detail";

interface SearchAnalyticsPayload {
  query: string;
  language: string;
  source: SearchEventSource;
  occupation?: OccupationRow | null;
  searchLabel?: string;
  matchType?: OccupationSearchMatchType;
  resultCount?: number;
  matchedAlias?: string;
  isZeroResult?: boolean;
  didClickResult?: boolean;
  pageUrl?: string;
  referrer?: string;
}

interface SearchFeedbackPayload {
  query: string;
  feedbackText: string;
  source: SearchEventSource;
  language?: string;
  matchType?: OccupationSearchMatchType;
  resultCount?: number;
  pageUrl?: string;
  referrer?: string;
}

const SEARCH_SESSION_KEY = "airs-search-session-id";

function normalizeBaseUrl() {
  const configured = (import.meta.env.VITE_ANALYTICS_BASE_URL as string | undefined)?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:8787";
  }

  return "";
}

function endpointFor(path: string) {
  const base = normalizeBaseUrl();
  if (!base) return "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function getSearchSessionId() {
  if (typeof window === "undefined") return "server";

  const existing = window.sessionStorage.getItem(SEARCH_SESSION_KEY);
  if (existing) return existing;

  const next = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  window.sessionStorage.setItem(SEARCH_SESSION_KEY, next);
  return next;
}

function getDeviceType(source: SearchEventSource) {
  if (source.startsWith("h5")) return "mobile";
  if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) return "mobile";
  return "desktop";
}

async function postAnalytics(path: string, body: Record<string, unknown>) {
  const endpoint = endpointFor(path);
  if (!endpoint) return;

  const payload = JSON.stringify(body);

  try {
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(endpoint, blob);
      return;
    }

    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true
    });
  } catch {
    // Swallow analytics failures so they never affect the UI.
  }
}

export async function trackSearchEvent(payload: SearchAnalyticsPayload) {
  const query = payload.query.trim();
  if (!query) return;

  await postAnalytics("/api/analytics/events/search", {
    query,
    normalizedQuery: query.toLowerCase().replace(/\s+/g, " "),
    language: payload.language,
    source: payload.source,
    timestamp: new Date().toISOString(),
    pageUrl: payload.pageUrl || (typeof window !== "undefined" ? window.location.href : ""),
    referrer: payload.referrer || (typeof document !== "undefined" ? document.referrer : ""),
    searchLabel: payload.searchLabel || "",
    matchType: payload.matchType || "",
    matchedAlias: payload.matchedAlias || payload.searchLabel || "",
    resultCount: Number(payload.resultCount || (payload.occupation ? 1 : 0)),
    clickedOccupationId: payload.didClickResult ? payload.occupation?.socCode || "" : "",
    matchedOccupationId: payload.occupation?.socCode || "",
    didClickResult: Boolean(payload.didClickResult),
    isZeroResult: Boolean(payload.isZeroResult ?? !payload.occupation),
    deviceType: getDeviceType(payload.source),
    sessionId: getSearchSessionId(),
    occupation: payload.occupation
      ? {
          socCode: payload.occupation.socCode,
          title: payload.occupation.title,
          titleZh: payload.occupation.titleZh || payload.occupation.title
        }
      : null
  });
}

export async function trackSearchFeedback(payload: SearchFeedbackPayload) {
  const query = payload.query.trim();
  const feedbackText = payload.feedbackText.trim();
  if (!query || !feedbackText) return;

  await postAnalytics("/api/analytics/events/search-feedback", {
    query,
    normalizedQuery: query.toLowerCase().replace(/\s+/g, " "),
    feedbackText,
    language: payload.language || "zh",
    source: payload.source,
    timestamp: new Date().toISOString(),
    pageUrl: payload.pageUrl || (typeof window !== "undefined" ? window.location.href : ""),
    referrer: payload.referrer || (typeof document !== "undefined" ? document.referrer : ""),
    matchType: payload.matchType || "",
    resultCount: Number(payload.resultCount || 0),
    deviceType: getDeviceType(payload.source),
    sessionId: getSearchSessionId()
  });
}
