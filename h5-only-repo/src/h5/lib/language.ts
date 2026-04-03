import type { AppLanguage } from "../../shared/language";

export type H5Language = AppLanguage;

const STORAGE_KEY = "airs-language";

export function normalizeH5Language(value: string | null | undefined): H5Language {
  return value === "en" ? "en" : "zh";
}

export function getInitialH5Language(search: string) {
  const params = new URLSearchParams(search);
  const fromQuery = params.get("lang");
  if (fromQuery === "en" || fromQuery === "zh") return fromQuery;

  const fromStorage = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  if (fromStorage === "en" || fromStorage === "zh") return fromStorage;

  if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh")) {
    return "zh";
  }

  return "en";
}

export function persistH5Language(language: H5Language) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, language);
  }
}
