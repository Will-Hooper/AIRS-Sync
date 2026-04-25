import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject
} from "react";
import type { EditorGuideLine, EditorModuleLayout } from "../schema";
import type { PageEditorApi } from "../usePageEditor";

const GRID_COLUMNS = 12;
const GRID_GAP = 24;
const GRID_ROW_HEIGHT = 108;

interface EditorGridSectionContextValue {
  editor: PageEditorApi;
  sectionId: string;
  sectionRef: RefObject<HTMLDivElement | null>;
  columns: number;
  gap: number;
  rowHeight: number;
  setGuides: (guides: EditorGuideLine[]) => void;
}

const EditorGridSectionContext = createContext<EditorGridSectionContextValue | null>(null);

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildGuides(
  layout: EditorModuleLayout,
  sectionWidth: number,
  sectionHeight: number,
  columns: number,
  gap: number,
  rowHeight: number
) {
  const columnWidth = (sectionWidth - gap * (columns - 1)) / columns;
  const left = (layout.colStart - 1) * (columnWidth + gap);
  const right = left + columnWidth * layout.colSpan + gap * Math.max(0, layout.colSpan - 1);
  const top = (layout.rowStart - 1) * (rowHeight + gap);
  const bottom = top + layout.minHeight;

  return [
    { orientation: "vertical" as const, start: left, end: sectionHeight },
    { orientation: "vertical" as const, start: right, end: sectionHeight },
    { orientation: "horizontal" as const, start: top, end: sectionWidth },
    { orientation: "horizontal" as const, start: bottom, end: sectionWidth }
  ];
}

export function EditorGridSection({
  editor,
  sectionId,
  className = "",
  children
}: {
  editor: PageEditorApi;
  sectionId: string;
  className?: string;
  children: ReactNode;
}) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [guides, setGuides] = useState<EditorGuideLine[]>([]);

  const contextValue = useMemo<EditorGridSectionContextValue>(
    () => ({
      editor,
      sectionId,
      sectionRef,
      columns: GRID_COLUMNS,
      gap: GRID_GAP,
      rowHeight: GRID_ROW_HEIGHT,
      setGuides
    }),
    [editor, sectionId]
  );

  return (
    <EditorGridSectionContext.Provider value={contextValue}>
      <div ref={sectionRef} className={`airs-editor-grid ${className}`.trim()}>
        {children}
        {editor.isEditMode &&
          guides.map((guide, index) => (
            <div
              key={`${guide.orientation}-${guide.start}-${index}`}
              className={`airs-editor-guide is-${guide.orientation}`}
              style={
                guide.orientation === "vertical"
                  ? ({ left: `${guide.start}px`, height: `${guide.end}px` } as CSSProperties)
                  : ({ top: `${guide.start}px`, width: `${guide.end}px` } as CSSProperties)
              }
            />
          ))}
      </div>
    </EditorGridSectionContext.Provider>
  );
}

export function EditorGridItem({
  editor,
  moduleId,
  children,
  enableDrag = true,
  enableResize = true
}: {
  editor: PageEditorApi;
  moduleId: string;
  children: ReactNode;
  enableDrag?: boolean;
  enableResize?: boolean;
}) {
  const context = useContext(EditorGridSectionContext);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [previewLayout, setPreviewLayout] = useState<EditorModuleLayout | null>(null);
  const previewLayoutRef = useRef<EditorModuleLayout | null>(null);
  const module = editor.getModule(moduleId);

  useEffect(() => {
    const target = wrapperRef.current;
    if (!target) return;

    const observer = new ResizeObserver(() => {
      editor.setModuleMetrics(moduleId, {
        width: Math.round(target.offsetWidth),
        height: Math.round(target.offsetHeight)
      });
    });

    observer.observe(target);
    editor.setModuleMetrics(moduleId, {
      width: Math.round(target.offsetWidth),
      height: Math.round(target.offsetHeight)
    });

    return () => observer.disconnect();
  }, [editor, moduleId]);

  if (!context || !module) {
    return <>{children}</>;
  }

  const activeLayout = previewLayout || module.layout;
  const selected = editor.selectedModuleId === moduleId;
  const widthEstimate = editor.getModuleMetrics(moduleId)?.width || 0;
  const heightEstimate = previewLayout?.minHeight || editor.getModuleMetrics(moduleId)?.height || activeLayout.minHeight;

  const startGesture = (mode: "move" | "resize", event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!editor.isEditMode) return;
    event.preventDefault();
    event.stopPropagation();
    editor.setSelectedModuleId(moduleId);

    const sectionRect = context.sectionRef.current?.getBoundingClientRect();
    if (!sectionRect) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const startLayout = module.layout;
    const columnWidth = (sectionRect.width - context.gap * (context.columns - 1)) / context.columns;
    const columnStep = columnWidth + context.gap;
    const rowStep = context.rowHeight + context.gap;

    const handleMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      if (mode === "move") {
        const colDelta = Math.round(deltaX / columnStep);
        const rowDelta = Math.round(deltaY / rowStep);
        const nextLayout: EditorModuleLayout = {
          ...startLayout,
          colStart: clamp(startLayout.colStart + colDelta, 1, context.columns - startLayout.colSpan + 1),
          rowStart: clamp(startLayout.rowStart + rowDelta, 1, 24)
        };
        previewLayoutRef.current = nextLayout;
        setPreviewLayout(nextLayout);
        context.setGuides(buildGuides(nextLayout, sectionRect.width, sectionRect.height + 400, context.columns, context.gap, context.rowHeight));
        return;
      }

      const minColSpan = startLayout.minColSpan || 1;
      const maxColSpan = startLayout.maxColSpan || context.columns;
      const minRowSpan = startLayout.minRowSpan || 1;
      const maxRowSpan = startLayout.maxRowSpan || 8;
      const nextColSpan = clamp(startLayout.colSpan + Math.round(deltaX / columnStep), minColSpan, maxColSpan);
      const nextRowSpan = clamp(startLayout.rowSpan + Math.round(deltaY / rowStep), minRowSpan, maxRowSpan);
      const nextMinHeight = clamp(startLayout.minHeight + Math.round(deltaY), 160, 1200);

      const nextLayout = {
        ...startLayout,
        colSpan: clamp(nextColSpan, minColSpan, context.columns - startLayout.colStart + 1),
        rowSpan: nextRowSpan,
        minHeight: nextMinHeight
      };
      previewLayoutRef.current = nextLayout;
      setPreviewLayout(nextLayout);
      context.setGuides(buildGuides(nextLayout, sectionRect.width, sectionRect.height + 400, context.columns, context.gap, context.rowHeight));
    };

    const handleUp = () => {
      const nextLayout = previewLayoutRef.current || startLayout;
      previewLayoutRef.current = null;
      setPreviewLayout(null);
      context.setGuides([]);
      if (JSON.stringify(nextLayout) !== JSON.stringify(startLayout)) {
        editor.updateModuleLayout(moduleId, nextLayout);
      }
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
  };

  return (
    <div
      ref={wrapperRef}
      data-numbered-box
      className={`airs-editor-grid-item ${selected ? "is-selected" : ""} ${editor.isEditMode ? "is-editable" : ""}`.trim()}
      style={
        {
          "--editor-col-start": activeLayout.colStart,
          "--editor-row-start": activeLayout.rowStart,
          "--editor-col-span": activeLayout.colSpan,
          "--editor-row-span": activeLayout.rowSpan,
          "--editor-min-height": `${activeLayout.minHeight}px`,
          zIndex: selected ? 18 : 1
        } as CSSProperties
      }
      onClick={() => {
        if (editor.isEditMode) {
          editor.setSelectedModuleId(moduleId);
        }
      }}
    >
      {children}

      {editor.isEditMode && (
        <>
          {enableDrag && (
            <button type="button" className="airs-editor-drag-handle" onPointerDown={(event) => startGesture("move", event)}>
              拖拽
            </button>
          )}
          {selected && (
            <div className="airs-editor-dimension-tag">
              {widthEstimate || "--"} x {heightEstimate || "--"}
            </div>
          )}
          {enableResize && (
            <button type="button" className="airs-editor-resize-handle" onPointerDown={(event) => startGesture("resize", event)} aria-label="Resize module" />
          )}
        </>
      )}
    </div>
  );
}
