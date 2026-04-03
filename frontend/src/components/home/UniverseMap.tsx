import { useEffect, useMemo, useRef, useState } from "react";
import { formatNumber } from "../../lib/format";
import { labelText } from "../../lib/i18n";
import type { AppLanguage } from "../../lib/i18n";
import type { OccupationRow } from "../../lib/types";

type ViewMode = "market" | "group" | "label";

interface UniverseMapProps {
  occupations: OccupationRow[];
  language: AppLanguage;
  selectedSocCode?: string;
  onSelect: (occupation: OccupationRow | null) => void;
  emptyText: string;
  labels: {
    zoomIn: string;
    zoomOut: string;
    resetView: string;
    fullscreenEnter: string;
    fullscreenExit: string;
    viewModesKicker: string;
    axisX: string;
    axisY: string;
    modes: Record<ViewMode, string>;
  };
}

interface CameraState {
  scale: number;
  x: number;
  y: number;
}

interface RenderPoint {
  row: OccupationRow;
  x: number;
  y: number;
  radius: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pointColor(row: OccupationRow) {
  if (row.label === "high_risk") return "#ff9a47";
  if (row.label === "restructuring") return "#7ef0b3";
  if (row.label === "augmenting") return "#55e3ff";
  if (row.label === "stable") return "#8bc8ff";
  return "#9ce7d0";
}

export function UniverseMap({
  occupations,
  language,
  selectedSocCode,
  onSelect,
  emptyText,
  labels
}: UniverseMapProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("market");
  const [camera, setCamera] = useState<CameraState>({ scale: 1, x: 0, y: 0 });
  const [viewport, setViewport] = useState({ width: 1, height: 1 });
  const [hoveredSocCode, setHoveredSocCode] = useState<string | null>(null);
  const [dragState, setDragState] = useState<null | { startX: number; startY: number; cameraX: number; cameraY: number }>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const points = useMemo<RenderPoint[]>(() => {
    const majorGroups = [...new Set(occupations.map((occupation) => occupation.majorGroup))];
    const labelsOrder = ["high_risk", "restructuring", "augmenting", "light", "stable"];
    const maxPostings = Math.max(...occupations.map((occupation) => occupation.postings || 0), 1);

    return occupations.map((row, index) => {
      const heat = Math.log1p(row.postings || 0) / Math.log1p(maxPostings);
      const groupIndex = majorGroups.indexOf(row.majorGroup);
      const labelIndex = Math.max(labelsOrder.indexOf(row.label), 0);

      let x = (Number(row.airs || 0) - 50) * 16;
      let y = (heat - 0.5) * 900;

      if (viewMode === "group") {
        const columns = 6;
        const cellX = groupIndex % columns;
        const cellY = Math.floor(groupIndex / columns);
        x = (cellX - 2.5) * 420 + ((index % 11) - 5) * 14;
        y = (cellY - 1.5) * 300 + (Number(row.airs || 0) - 50) * 4;
      }

      if (viewMode === "label") {
        x = (labelIndex - 2) * 430 + ((index % 17) - 8) * 12;
        y = (Number(row.airs || 0) - 50) * 10;
      }

      return {
        row,
        x,
        y,
        radius: clamp(11 + Math.sqrt((row.postings || 0) + 1), 11, 26)
      };
    });
  }, [occupations, viewMode]);

  const bounds = useMemo(() => {
    if (!points.length) {
      return { minX: -300, maxX: 300, minY: -220, maxY: 220 };
    }
    return points.reduce(
      (accumulator, point) => ({
        minX: Math.min(accumulator.minX, point.x - point.radius),
        maxX: Math.max(accumulator.maxX, point.x + point.radius),
        minY: Math.min(accumulator.minY, point.y - point.radius),
        maxY: Math.max(accumulator.maxY, point.y + point.radius)
      }),
      {
        minX: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY
      }
    );
  }, [points]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      setViewport({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      });
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    setHasInteracted(false);
  }, [viewMode]);

  useEffect(() => {
    if (hasInteracted || viewport.width <= 1 || viewport.height <= 1) return;

    const contentWidth = Math.max(bounds.maxX - bounds.minX, 1);
    const contentHeight = Math.max(bounds.maxY - bounds.minY, 1);
    const padding = 90;
    const nextScale = clamp(
      Math.min((viewport.width - padding * 2) / contentWidth, (viewport.height - padding * 2) / contentHeight),
      0.28,
      2.8
    );

    setCamera({
      scale: nextScale,
      x: viewport.width / 2 - ((bounds.minX + bounds.maxX) / 2) * nextScale,
      y: viewport.height / 2 - ((bounds.minY + bounds.maxY) / 2) * nextScale
    });
  }, [bounds, hasInteracted, viewport]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === panelRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const nextOverflow = isFullscreen ? "hidden" : "";
    document.documentElement.style.overflow = nextOverflow;
    document.body.style.overflow = nextOverflow;

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  const projectPoint = (point: RenderPoint) => ({
    x: point.x * camera.scale + camera.x,
    y: point.y * camera.scale + camera.y
  });

  const activeSocCode = selectedSocCode || hoveredSocCode;
  const selectedPoint = activeSocCode ? points.find((point) => point.row.socCode === activeSocCode) : null;
  const selectedProjection = selectedPoint ? projectPoint(selectedPoint) : null;

  const zoomAt = (factor: number, clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const originX = clientX - rect.left;
    const originY = clientY - rect.top;
    setCamera((current) => {
      const nextScale = clamp(current.scale * factor, 0.28, 4.5);
      return {
        scale: nextScale,
        x: originX - ((originX - current.x) / current.scale) * nextScale,
        y: originY - ((originY - current.y) / current.scale) * nextScale
      };
    });
    setHasInteracted(true);
  };

  const toggleFullscreen = async () => {
    const host = panelRef.current;
    if (!host) return;

    if (document.fullscreenElement === host) {
      await document.exitFullscreen();
      return;
    }

    await host.requestFullscreen();
  };

  if (!occupations.length) {
    return (
      <div className="flex min-h-[480px] items-center justify-center rounded-[28px] border border-white/8 bg-black/15 text-white/50">
        {emptyText}
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className={`airs-panel overflow-hidden ${isFullscreen ? "flex h-full flex-col rounded-none border-transparent bg-slate-950/95" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 px-6 py-4">
        <div>
          <p className="airs-kicker">{labels.viewModesKicker}</p>
          <div className="mt-2 inline-flex rounded-full border border-white/10 bg-black/15 p-1">
            {(["market", "group", "label"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  mode === viewMode
                    ? "bg-gradient-to-r from-emerald-200 to-sky-300 text-slate-950"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {labels.modes[mode]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="airs-button" onClick={() => void toggleFullscreen()}>
            {isFullscreen ? labels.fullscreenExit : labels.fullscreenEnter}
          </button>
          <button type="button" className="airs-button" onClick={() => zoomAt(1.18, viewport.width / 2, viewport.height / 2)}>
            {labels.zoomIn}
          </button>
          <button type="button" className="airs-button" onClick={() => zoomAt(1 / 1.18, viewport.width / 2, viewport.height / 2)}>
            {labels.zoomOut}
          </button>
          <button
            type="button"
            className="airs-button"
            onClick={() => {
              setHasInteracted(false);
              onSelect(null);
            }}
          >
            {labels.resetView}
          </button>
          <span className="airs-chip">{formatNumber(camera.scale * 100, 0, language)}%</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`relative isolate touch-none overflow-hidden overscroll-contain bg-[radial-gradient(circle_at_20%_0%,rgba(127,193,255,0.1),transparent_34%),linear-gradient(180deg,rgba(7,13,20,0.5),rgba(7,13,20,0.85))] ${isFullscreen ? "min-h-0 flex-1 h-auto" : "h-[560px]"}`}
        onWheelCapture={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onWheel={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const factor = event.deltaY > 0 ? 1 / 1.12 : 1.12;
          zoomAt(factor, event.clientX, event.clientY);
        }}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          setDragState({
            startX: event.clientX,
            startY: event.clientY,
            cameraX: camera.x,
            cameraY: camera.y
          });
          setHasInteracted(true);
        }}
        onPointerMove={(event) => {
          if (!dragState) return;
          setCamera({
            ...camera,
            x: dragState.cameraX + (event.clientX - dragState.startX),
            y: dragState.cameraY + (event.clientY - dragState.startY)
          });
        }}
        onPointerUp={() => setDragState(null)}
        onPointerLeave={() => {
          setDragState(null);
          setHoveredSocCode(null);
        }}
        onDoubleClick={() => {
          setHasInteracted(false);
          onSelect(null);
        }}
      >
        <svg className="h-full w-full">
          <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.scale})`}>
            <line x1={bounds.minX - 180} x2={bounds.maxX + 180} y1={0} y2={0} stroke="rgba(127,193,255,0.18)" strokeWidth={1 / camera.scale} />
            <line y1={bounds.minY - 180} y2={bounds.maxY + 180} x1={0} x2={0} stroke="rgba(127,193,255,0.18)" strokeWidth={1 / camera.scale} />
            {points.map((point) => {
              const selected = point.row.socCode === selectedSocCode;
              const dimmed = selectedSocCode ? !selected : false;
              return (
                <circle
                  key={point.row.socCode}
                  cx={point.x}
                  cy={point.y}
                  r={point.radius / camera.scale}
                  fill={pointColor(point.row)}
                  fillOpacity={dimmed ? 0.18 : 0.9}
                  stroke={selected ? "#f2f6ff" : "rgba(255,255,255,0.18)"}
                  strokeWidth={selected ? 2.4 / camera.scale : 1 / camera.scale}
                  onMouseEnter={() => setHoveredSocCode(point.row.socCode)}
                  onMouseLeave={() => setHoveredSocCode((current) => (current === point.row.socCode ? null : current))}
                  onClick={() => onSelect(selected ? null : point.row)}
                />
              );
            })}
          </g>
        </svg>

        {selectedPoint && selectedProjection && (
          <div
            className="pointer-events-none absolute z-10 max-w-xs rounded-[24px] border border-white/10 bg-slate-950/92 px-4 py-3 shadow-2xl backdrop-blur-xl"
            style={{
              left: `${selectedProjection.x}px`,
              top: `${selectedProjection.y - 18}px`,
              transform: "translate(-50%, -100%)"
            }}
          >
            <p className="text-sm font-medium text-white">
              {language === "zh" ? selectedPoint.row.titleZh || selectedPoint.row.title : selectedPoint.row.title}
            </p>
            <p className="mt-1 text-xs text-white/45">
              {selectedPoint.row.socCode} · AIRS {formatNumber(selectedPoint.row.airs || 0, 0, language)}
            </p>
            <p className="mt-2 text-xs text-white/65">{labelText(language, selectedPoint.row.label)}</p>
          </div>
        )}

        <div className="pointer-events-none absolute bottom-4 left-6 right-6 flex flex-col gap-2 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
          <span>{labels.axisX}</span>
          <span>{labels.axisY}</span>
        </div>
      </div>
    </div>
  );
}
