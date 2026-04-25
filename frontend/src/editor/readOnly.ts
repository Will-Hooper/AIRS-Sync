import { useEffect, useState } from "react";
import type { EditorPageConfig } from "./schema";
import { loadPageConfig } from "./storage";

export function useReadOnlyPageConfig(pageId: string) {
  const [config, setConfig] = useState<EditorPageConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadPageConfig(pageId)
      .then(({ savedConfig }) => {
        if (!cancelled) {
          setConfig(savedConfig);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConfig(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pageId]);

  return config;
}

export function getReadOnlyConfigText(
  config: EditorPageConfig | null,
  moduleId: string,
  fieldName: string,
  language: "en" | "zh",
  fallback: string
) {
  return config?.modules.find((module) => module.moduleId === moduleId)?.content[fieldName]?.value?.[language] || fallback;
}
