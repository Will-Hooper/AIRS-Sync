import { useEffect, useState } from "react";

export type AppTheme = "light" | "dark";

const STORAGE_KEY = "airs-theme";

export function normalizeTheme(value: string | null | undefined): AppTheme {
  return value === "light" ? "light" : "dark";
}

export function getInitialTheme() {
  const fromStorage = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  if (fromStorage === "light" || fromStorage === "dark") return fromStorage;
  return "dark";
}

export function applyTheme(theme: AppTheme) {
  if (typeof document === "undefined") return;

  document.documentElement.dataset.airsTheme = theme;
  document.body.dataset.airsTheme = theme;
}

export function persistTheme(theme: AppTheme) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, theme);
}

export function useAirsTheme() {
  const [theme, setTheme] = useState<AppTheme>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  return [theme, setTheme] as const;
}
