import type { AppLanguage } from "../shared/language";
import { getDesktopShareCopy } from "./desktop-share-copy";

function upsertMeta(selector: string, attribute: "name" | "property", key: string, content: string) {
  if (typeof document === "undefined") return;

  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

export function applyDesktopShareMetadata(language: AppLanguage) {
  if (typeof document === "undefined") return;

  const shareCopy = getDesktopShareCopy(language);
  document.title = shareCopy;
  upsertMeta('meta[name="description"]', "name", "description", shareCopy);
  upsertMeta('meta[property="og:type"]', "property", "og:type", "website");
  upsertMeta('meta[property="og:title"]', "property", "og:title", shareCopy);
  upsertMeta('meta[property="og:description"]', "property", "og:description", shareCopy);
  upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary");
  upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", shareCopy);
  upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", shareCopy);
}
