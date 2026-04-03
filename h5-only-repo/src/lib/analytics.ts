import type { OccupationRow } from "./types";

type SearchEventSource =
  | "desktop-home"
  | "desktop-detail"
  | "h5-home"
  | "h5-detail";

interface SearchAnalyticsPayload {
  query: string;
  language: string;
  source: SearchEventSource;
  occupation?: OccupationRow | null;
  pageUrl?: string;
  referrer?: string;
}

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

export async function trackSearchEvent(payload: SearchAnalyticsPayload) {
  const query = payload.query.trim();
  const endpoint = endpointFor("/api/analytics/events/search");
  if (!query || !endpoint) return;

  const body = JSON.stringify({
    query,
    language: payload.language,
    source: payload.source,
    timestamp: new Date().toISOString(),
    pageUrl: payload.pageUrl || (typeof window !== "undefined" ? window.location.href : ""),
    referrer: payload.referrer || (typeof document !== "undefined" ? document.referrer : ""),
    occupation: payload.occupation
      ? {
          socCode: payload.occupation.socCode,
          title: payload.occupation.title,
          titleZh: payload.occupation.titleZh || payload.occupation.title
        }
      : null
  });

  try {
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(endpoint, blob);
      return;
    }

    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true
    });
  } catch {
    // Swallow analytics failures so they never affect the UI.
  }
}
