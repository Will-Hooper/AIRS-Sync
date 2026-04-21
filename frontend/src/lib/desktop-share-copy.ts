import type { AppLanguage } from "../shared/language";

export const DESKTOP_SHARE_COPY: Record<AppLanguage, string> = {
  zh: "AI会取代你的工作吗？",
  en: "Will AI replace your job?"
};

export function getDesktopShareCopy(language: AppLanguage) {
  return DESKTOP_SHARE_COPY[language];
}
