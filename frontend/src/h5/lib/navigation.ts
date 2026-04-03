import type { H5Language } from "./language";

function resolveRootPath(pathname = typeof window !== "undefined" ? window.location.pathname : "/") {
  if (pathname.includes("/m/")) {
    const prefix = pathname.slice(0, pathname.indexOf("/m/"));
    return prefix ? `${prefix}/` : "/";
  }

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

function buildHashHref(entryPath: string, route: string, params: Record<string, string | undefined> = {}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://airsindex.com";
  const baseUrl = new URL(entryPath, origin);
  return `${baseUrl.toString()}#${normalizeRoute(route)}${createSearch(params)}`;
}

export function buildDesktopHomeHref(language?: H5Language) {
  return buildHashHref(resolveRootPath(), "/", { lang: language });
}

export function buildDesktopOccupationHref(socCode: string, language?: H5Language) {
  return buildHashHref(resolveRootPath(), `/occupation/${encodeURIComponent(socCode)}`, { lang: language });
}

export function buildH5HomeHref(language?: H5Language) {
  return buildHashHref(`${resolveRootPath()}m/`, "/", { lang: language });
}

export function buildH5OccupationHref(socCode: string, language?: H5Language) {
  return buildHashHref(`${resolveRootPath()}m/`, `/occupation/${encodeURIComponent(socCode)}`, { lang: language });
}
