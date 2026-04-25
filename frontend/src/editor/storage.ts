import type { EditorPageConfig } from "./schema";

const STORAGE_PREFIX = "airs-page-config";

function cloneConfig<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getStorageKey(pageId: string) {
  return `${STORAGE_PREFIX}:${pageId}`;
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function getPageConfigApiPaths(pageId: string) {
  return {
    get: `/page-config/${pageId}`,
    put: `/page-config/${pageId}`
  };
}

export async function loadDefaultPageConfig(pageId: string) {
  return fetchJson<EditorPageConfig>(`/page-configs/${pageId}.json`);
}

export async function loadStoredPageConfig(pageId: string) {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(getStorageKey(pageId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as EditorPageConfig;
  } catch {
    window.localStorage.removeItem(getStorageKey(pageId));
    return null;
  }
}

export async function loadPageConfig(pageId: string) {
  const [defaultConfig, storedConfig] = await Promise.all([
    loadDefaultPageConfig(pageId),
    loadStoredPageConfig(pageId)
  ]);

  if (!storedConfig || storedConfig.pageId !== pageId) {
    return {
      defaultConfig: cloneConfig(defaultConfig),
      savedConfig: cloneConfig(defaultConfig)
    };
  }

  return {
    defaultConfig: cloneConfig(defaultConfig),
    savedConfig: cloneConfig(storedConfig)
  };
}

export async function persistPageConfig(config: EditorPageConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(config.pageId), JSON.stringify(config));
}

export async function resetStoredPageConfig(pageId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getStorageKey(pageId));
}

export function exportPageConfig(config: EditorPageConfig) {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${config.pageId}.page-config.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
