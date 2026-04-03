const H5_SHARE_COPY = "搜搜看，AI是否会取代你的职业";

function upsertMeta(selector: string, attributeName: "name" | "property", attributeValue: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

export function applyH5ShareMetadata() {
  document.title = H5_SHARE_COPY;

  upsertMeta('meta[name="description"]', "name", "description", H5_SHARE_COPY);
  upsertMeta('meta[property="og:title"]', "property", "og:title", H5_SHARE_COPY);
  upsertMeta('meta[property="og:description"]', "property", "og:description", H5_SHARE_COPY);
  upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", H5_SHARE_COPY);
  upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", H5_SHARE_COPY);
}
