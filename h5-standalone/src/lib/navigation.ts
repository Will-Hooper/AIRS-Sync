import type { H5Language } from "./language";

function resolveRootPath(pathname = typeof window !== "undefined" ? window.location.pathname : "/") {
  if (pathname.endsWith("/")) return pathname;
  const lastSlash = pathname.lastIndexOf("/");
  return lastSlash >= 0 ? pathname.slice(0, lastSlash + 1) : "/";
}

function createSearch(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  const search = searchParams.toString();
  return search ? `?${search}` : "";
}

function normalizeRoute(route: string) {
  if (!route) return "/";
  return route.startsWith("/") ? route : `/${route}`;
}

function buildHashHref(route: string, params: Record<string, string | undefined> = {}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://airsindex.com";
  const baseUrl = new URL(resolveRootPath(), origin);
  return `${baseUrl.toString()}#${normalizeRoute(route)}${createSearch(params)}`;
}

export function buildHomeHref(language?: H5Language) {
  return buildHashHref("/", { lang: language });
}

export function buildOccupationHref(socCode: string, language?: H5Language) {
  return buildHashHref(`/occupation/${encodeURIComponent(socCode)}`, { lang: language });
}
