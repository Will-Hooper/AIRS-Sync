import { useBeforeUnload, useBlocker } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { exportPageConfig, loadPageConfig, persistPageConfig } from "./storage";
import type {
  EditorModuleLayout,
  EditorModuleMetrics,
  EditorModuleStyle,
  EditorPageConfig,
  EditorPageModule,
  EditorTextField,
  EditorTextStyle
} from "./schema";

const HISTORY_LIMIT = 20;

function cloneConfig<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso() {
  return new Date().toISOString();
}

function configsEqual(left: EditorPageConfig | null, right: EditorPageConfig | null) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function replaceModule(
  config: EditorPageConfig,
  moduleId: string,
  updater: (current: EditorPageModule) => EditorPageModule
) {
  const updatedAt = nowIso();
  const modules = config.modules.map((module) =>
    module.moduleId === moduleId ? { ...updater(module), updatedAt } : module
  );
  return { ...config, modules, updatedAt };
}

function toCssTextAlign(value?: string): CSSProperties["textAlign"] {
  if (value === "center" || value === "right") return value;
  return "left";
}

function buildTextStyle(style?: EditorTextStyle): CSSProperties {
  if (!style) return {};
  return {
    fontSize: style.fontSize ? `${style.fontSize}px` : undefined,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight ? String(style.lineHeight) : undefined,
    color: style.color,
    textAlign: toCssTextAlign(style.textAlign)
  };
}

function buildModuleStyle(style?: EditorModuleStyle): CSSProperties {
  if (!style) return {};
  return {
    background: style.background,
    borderRadius: typeof style.borderRadius === "number" ? `${style.borderRadius}px` : undefined,
    padding: typeof style.padding === "number" ? `${style.padding}px` : undefined,
    color: style.textColor
  };
}

export interface PageEditorApi {
  ready: boolean;
  loading: boolean;
  isEditMode: boolean;
  dirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  currentConfig: EditorPageConfig | null;
  selectedModuleId: string | null;
  selectedModule: EditorPageModule | null;
  setSelectedModuleId: (moduleId: string | null) => void;
  getModule: (moduleId: string) => EditorPageModule | null;
  getTextField: (moduleId: string, fieldName: string) => EditorTextField | null;
  getTextValue: (moduleId: string, fieldName: string, language: "en" | "zh", fallback: string) => string;
  getTextStyle: (moduleId: string, fieldName: string) => CSSProperties;
  getModuleStyle: (moduleId: string) => CSSProperties;
  getModuleMetrics: (moduleId: string) => EditorModuleMetrics | null;
  setModuleMetrics: (moduleId: string, metrics: EditorModuleMetrics) => void;
  updateTextValue: (moduleId: string, fieldName: string, language: "en" | "zh", value: string) => void;
  updateTextStyle: (moduleId: string, fieldName: string, patch: Partial<EditorTextStyle>) => void;
  updateModuleStyle: (moduleId: string, patch: Partial<EditorModuleStyle>) => void;
  updateModuleLayout: (moduleId: string, patch: Partial<EditorModuleLayout>) => void;
  resetSelectedModule: () => void;
  revertSelectedModule: () => void;
  undo: () => void;
  redo: () => void;
  save: () => Promise<void>;
  exportCurrentConfig: () => void;
  exitEditMode: () => void;
}

interface UsePageEditorOptions {
  pageId: string;
  isEditMode: boolean;
  onExitEditMode: () => void;
}

export function usePageEditor({ pageId, isEditMode, onExitEditMode }: UsePageEditorOptions): PageEditorApi {
  const [loading, setLoading] = useState(true);
  const [defaultConfig, setDefaultConfig] = useState<EditorPageConfig | null>(null);
  const [savedConfig, setSavedConfig] = useState<EditorPageConfig | null>(null);
  const [currentConfig, setCurrentConfig] = useState<EditorPageConfig | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [history, setHistory] = useState<EditorPageConfig[]>([]);
  const [future, setFuture] = useState<EditorPageConfig[]>([]);
  const [moduleMetrics, setModuleMetricsState] = useState<Record<string, EditorModuleMetrics>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSelectedModuleId(null);
    setHistory([]);
    setFuture([]);
    setModuleMetricsState({});

    loadPageConfig(pageId)
      .then(({ defaultConfig: nextDefault, savedConfig: nextSaved }) => {
        if (cancelled) return;
        setDefaultConfig(nextDefault);
        setSavedConfig(nextSaved);
        setCurrentConfig(cloneConfig(nextSaved));
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pageId]);

  const dirty = useMemo(() => !configsEqual(currentConfig, savedConfig), [currentConfig, savedConfig]);

  const blocker = useBlocker(isEditMode && dirty);

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    const confirmed = window.confirm("当前页面有未保存改动，确认离开吗？");
    if (confirmed) {
      blocker.proceed();
      return;
    }
    blocker.reset();
  }, [blocker]);

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!isEditMode || !dirty) return;
        event.preventDefault();
        event.returnValue = "";
      },
      [dirty, isEditMode]
    )
  );

  const applyConfigUpdate = useCallback(
    (updater: (config: EditorPageConfig) => EditorPageConfig, trackHistory = true) => {
      setCurrentConfig((current) => {
        if (!current) return current;
        const snapshot = cloneConfig(current);
        const next = updater(snapshot);
        if (trackHistory && JSON.stringify(next) !== JSON.stringify(current)) {
          setHistory((existing) => [...existing.slice(-(HISTORY_LIMIT - 1)), cloneConfig(current)]);
          setFuture([]);
        }
        return next;
      });
    },
    []
  );

  const getModule = useCallback(
    (moduleId: string) => currentConfig?.modules.find((module) => module.moduleId === moduleId) || null,
    [currentConfig]
  );

  const selectedModule = useMemo(
    () => (selectedModuleId ? getModule(selectedModuleId) : null),
    [getModule, selectedModuleId]
  );

  const getTextField = useCallback(
    (moduleId: string, fieldName: string) => getModule(moduleId)?.content[fieldName] || null,
    [getModule]
  );

  const getTextValue = useCallback(
    (moduleId: string, fieldName: string, language: "en" | "zh", fallback: string) =>
      getTextField(moduleId, fieldName)?.value?.[language] || fallback,
    [getTextField]
  );

  const getTextStyle = useCallback(
    (moduleId: string, fieldName: string) => buildTextStyle(getTextField(moduleId, fieldName)?.style),
    [getTextField]
  );

  const getModuleStyle = useCallback((moduleId: string) => buildModuleStyle(getModule(moduleId)?.style), [getModule]);

  const setModuleMetrics = useCallback((moduleId: string, metrics: EditorModuleMetrics) => {
    setModuleMetricsState((current) => {
      const previous = current[moduleId];
      if (previous && previous.width === metrics.width && previous.height === metrics.height) {
        return current;
      }
      return { ...current, [moduleId]: metrics };
    });
  }, []);

  const getModuleMetrics = useCallback((moduleId: string) => moduleMetrics[moduleId] || null, [moduleMetrics]);

  const updateTextValue = useCallback(
    (moduleId: string, fieldName: string, language: "en" | "zh", value: string) => {
      applyConfigUpdate((config) =>
        replaceModule(config, moduleId, (module) => ({
          ...module,
          content: {
            ...module.content,
            [fieldName]: {
              ...module.content[fieldName],
              value: {
                ...module.content[fieldName].value,
                [language]: value
              }
            }
          }
        }))
      );
    },
    [applyConfigUpdate]
  );

  const updateTextStyle = useCallback(
    (moduleId: string, fieldName: string, patch: Partial<EditorTextStyle>) => {
      applyConfigUpdate((config) =>
        replaceModule(config, moduleId, (module) => ({
          ...module,
          content: {
            ...module.content,
            [fieldName]: {
              ...module.content[fieldName],
              style: {
                ...module.content[fieldName].style,
                ...patch
              }
            }
          }
        }))
      );
    },
    [applyConfigUpdate]
  );

  const updateModuleStyle = useCallback(
    (moduleId: string, patch: Partial<EditorModuleStyle>) => {
      applyConfigUpdate((config) =>
        replaceModule(config, moduleId, (module) => ({
          ...module,
          style: {
            ...module.style,
            ...patch
          }
        }))
      );
    },
    [applyConfigUpdate]
  );

  const updateModuleLayout = useCallback(
    (moduleId: string, patch: Partial<EditorModuleLayout>) => {
      applyConfigUpdate((config) =>
        replaceModule(config, moduleId, (module) => ({
          ...module,
          layout: {
            ...module.layout,
            ...patch
          }
        }))
      );
    },
    [applyConfigUpdate]
  );

  const resetSelectedModule = useCallback(() => {
    if (!selectedModuleId || !defaultConfig) return;
    const fallback = defaultConfig.modules.find((module) => module.moduleId === selectedModuleId);
    if (!fallback) return;
    applyConfigUpdate((config) => replaceModule(config, selectedModuleId, () => cloneConfig(fallback)));
  }, [applyConfigUpdate, defaultConfig, selectedModuleId]);

  const revertSelectedModule = useCallback(() => {
    if (!selectedModuleId || !savedConfig) return;
    const fallback = savedConfig.modules.find((module) => module.moduleId === selectedModuleId);
    if (!fallback) return;
    applyConfigUpdate((config) => replaceModule(config, selectedModuleId, () => cloneConfig(fallback)));
  }, [applyConfigUpdate, savedConfig, selectedModuleId]);

  const undo = useCallback(() => {
    setHistory((existing) => {
      if (!existing.length) return existing;
      const previous = existing[existing.length - 1];
      setFuture((current) => (currentConfig ? [cloneConfig(currentConfig), ...current].slice(0, HISTORY_LIMIT) : current));
      setCurrentConfig(cloneConfig(previous));
      return existing.slice(0, -1);
    });
  }, [currentConfig]);

  const redo = useCallback(() => {
    setFuture((existing) => {
      if (!existing.length) return existing;
      const [next, ...rest] = existing;
      setHistory((current) => (currentConfig ? [...current.slice(-(HISTORY_LIMIT - 1)), cloneConfig(currentConfig)] : current));
      setCurrentConfig(cloneConfig(next));
      return rest;
    });
  }, [currentConfig]);

  const save = useCallback(async () => {
    if (!currentConfig) return;
    await persistPageConfig(currentConfig);
    setSavedConfig(cloneConfig(currentConfig));
  }, [currentConfig]);

  const exportCurrentConfig = useCallback(() => {
    if (!currentConfig) return;
    exportPageConfig(currentConfig);
  }, [currentConfig]);

  const exitEditMode = useCallback(() => {
    if (dirty && !window.confirm("当前页面有未保存改动，确认退出编辑模式吗？")) {
      return;
    }
    onExitEditMode();
  }, [dirty, onExitEditMode]);

  return {
    ready: Boolean(currentConfig),
    loading,
    isEditMode,
    dirty,
    canUndo: history.length > 0,
    canRedo: future.length > 0,
    currentConfig,
    selectedModuleId,
    selectedModule,
    setSelectedModuleId,
    getModule,
    getTextField,
    getTextValue,
    getTextStyle,
    getModuleStyle,
    getModuleMetrics,
    setModuleMetrics,
    updateTextValue,
    updateTextStyle,
    updateModuleStyle,
    updateModuleLayout,
    resetSelectedModule,
    revertSelectedModule,
    undo,
    redo,
    save,
    exportCurrentConfig,
    exitEditMode
  };
}
