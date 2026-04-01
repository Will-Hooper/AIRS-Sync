import type { AppLanguage } from "./i18n";

export function formatNumber(value: number | null | undefined, digits = 0, language: AppLanguage = "zh") {
  if (value == null || Number.isNaN(value)) return "--";
  return new Intl.NumberFormat(language === "zh" ? "zh-CN" : "en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(value);
}

export function formatPercent(value: number | null | undefined, digits = 0, language: AppLanguage = "zh") {
  if (value == null || Number.isNaN(value)) return "--";
  return `${formatNumber(value * 100, digits, language)}%`;
}

export function formatCurrency(value: number | null | undefined, language: AppLanguage = "zh") {
  if (value == null || Number.isNaN(value)) return "--";
  return new Intl.NumberFormat(language === "zh" ? "zh-CN" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDateTime(value: Date, language: AppLanguage = "zh") {
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(value);
}

export function formatDateTimeValue(
  value: string | number | Date | null | undefined,
  language: AppLanguage = "zh"
) {
  if (value == null || value === "") return "--";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return formatDateTime(date, language);
}
