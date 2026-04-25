import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";

interface EditorModeContextValue {
  debugEnabled: boolean;
  isEditMode: boolean;
  enterEditMode: () => void;
  exitEditMode: () => void;
  toggleEditMode: () => void;
  withDebugParam: (href: string) => string;
}

const EditorModeContext = createContext<EditorModeContextValue | null>(null);

function getHashSearch(hash: string) {
  const normalized = hash.startsWith("#") ? hash.slice(1) : hash;
  const queryIndex = normalized.indexOf("?");
  if (queryIndex < 0) return "";
  return normalized.slice(queryIndex);
}

export function isEditorDebugEnabledFromLocation(locationLike: Pick<Location, "search" | "hash"> = window.location) {
  const rootParams = new URLSearchParams(locationLike.search || "");
  const hashParams = new URLSearchParams(getHashSearch(locationLike.hash || ""));
  return rootParams.get("debug") === "1" || hashParams.get("debug") === "1";
}

export function EditorProvider({ children }: PropsWithChildren) {
  const [debugEnabled, setDebugEnabled] = useState(() => isEditorDebugEnabledFromLocation());
  const [isEditMode, setIsEditMode] = useState(() => isEditorDebugEnabledFromLocation());
  const previousDebugEnabledRef = useRef(debugEnabled);

  useEffect(() => {
    const syncFromLocation = () => {
      const nextDebugEnabled = isEditorDebugEnabledFromLocation();
      setDebugEnabled(nextDebugEnabled);
      setIsEditMode((current) => {
        if (!nextDebugEnabled) return false;
        if (!previousDebugEnabledRef.current && nextDebugEnabled) return true;
        return current;
      });
      previousDebugEnabledRef.current = nextDebugEnabled;
    };

    syncFromLocation();
    window.addEventListener("hashchange", syncFromLocation);
    window.addEventListener("popstate", syncFromLocation);

    return () => {
      window.removeEventListener("hashchange", syncFromLocation);
      window.removeEventListener("popstate", syncFromLocation);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!debugEnabled) return;
      if (!(event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "e")) return;
      event.preventDefault();
      setIsEditMode((current) => !current);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [debugEnabled]);

  const enterEditMode = useCallback(() => {
    if (debugEnabled) {
      setIsEditMode(true);
    }
  }, [debugEnabled]);

  const exitEditMode = useCallback(() => {
    setIsEditMode(false);
  }, []);

  const toggleEditMode = useCallback(() => {
    if (debugEnabled) {
      setIsEditMode((current) => !current);
    }
  }, [debugEnabled]);

  const withDebugParam = useCallback(
    (href: string) => {
      if (!debugEnabled) return href;
      const url = new URL(href, "https://airsindex.local");
      url.searchParams.set("debug", "1");
      return `${url.pathname}${url.search}${url.hash}`;
    },
    [debugEnabled]
  );

  const value = useMemo<EditorModeContextValue>(
    () => ({
      debugEnabled,
      isEditMode: debugEnabled && isEditMode,
      enterEditMode,
      exitEditMode,
      toggleEditMode,
      withDebugParam
    }),
    [debugEnabled, isEditMode, enterEditMode, exitEditMode, toggleEditMode, withDebugParam]
  );

  return <EditorModeContext.Provider value={value}>{children}</EditorModeContext.Provider>;
}

export function useEditorMode() {
  const context = useContext(EditorModeContext);
  if (!context) {
    throw new Error("useEditorMode must be used within EditorProvider");
  }
  return context;
}
