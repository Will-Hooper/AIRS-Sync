import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { formatNumber } from "../../lib/format";
import { labelText } from "../../lib/i18n";
import type { AppLanguage } from "../../lib/i18n";
import type { OccupationRow } from "../../lib/types";

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
    axisXTitle: string;
    axisYTitle: string;
    axisX: string;
    axisY: string;
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
  const [camera, setCamera] = useState<CameraState>({ scale: 1, x: 0, y: 0 });
  const [viewport, setViewport] = useState({ width: 1, height: 1 });
  const [hoveredSocCode, setHoveredSocCode] = useState<string | null>(null);
  const [dragState, setDragState] = useState<null | { startX: number; startY: number; cameraX: number; cameraY: number; pointerId: number }>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const points = useMemo<RenderPoint[]>(() => {
    const maxPostings = Math.max(...occupations.map((occupation) => occupation.postings || 0), 1);

    return occupations.map((row) => {
      const heat = Math.log1p(row.postings || 0) / Math.log1p(maxPostings);
      const x = (Number(row.airs || 0) - 50) * 16;
      const y = (heat - 0.5) * 900;

      return {
        row,
        x,
        y,
        radius: clamp(11 + Math.sqrt((row.postings || 0) + 1), 11, 26)
      };
    });
  }, [occupations]);

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

  const fitToBounds = useCallback(() => {
    if (viewport.width <= 1 || viewport.height <= 1) return;

    const contentWidth = Math.max(bounds.maxX - bounds.minX, 1);
    const contentHeight = Math.max(bounds.maxY - bounds.minY, 1);
    const paddingX = Math.max(84, viewport.width * 0.08);
    const paddingY = Math.max(84, viewport.height * 0.12);
    const nextScale = clamp(
      Math.min((viewport.width - paddingX * 2) / contentWidth, (viewport.height - paddingY * 2) / contentHeight),
      0.28,
      2.8
    );

    setCamera({
      scale: nextScale,
      x: viewport.width / 2 - ((bounds.minX + bounds.maxX) / 2) * nextScale,
      y: viewport.height / 2 - ((bounds.minY + bounds.maxY) / 2) * nextScale
    });
  }, [bounds, viewport.height, viewport.width]);

  useLayoutEffect(() => {
    fitToBounds();
  }, [fitToBounds, occupations]);

  useEffect(() => {
    if (!isFullscreen) return;
    const frame = window.requestAnimationFrame(() => fitToBounds());
    return () => window.cancelAnimationFrame(frame);
  }, [fitToBounds, isFullscreen]);

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

  useEffect(() => {
    setHoveredSocCode(null);
  }, [occupations, selectedSocCode]);

  const projectPoint = useCallback((point: RenderPoint) => ({
    x: point.x * camera.scale + camera.x,
    y: point.y * camera.scale + camera.y
  }), [camera]);

  const activeSocCode = selectedSocCode || hoveredSocCode;
  const selectedPoint = activeSocCode ? points.find((point) => point.row.socCode === activeSocCode) : null;
  const selectedProjection = selectedPoint ? projectPoint(selectedPoint) : null;
  const originX = Math.round(camera.x) + 0.5;
  const originY = Math.round(camera.y) + 0.5;

  const zoomAt = useCallback((factor: number, clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const originXValue = clientX - rect.left;
    const originYValue = clientY - rect.top;
    setCamera((current) => {
      const nextScale = clamp(current.scale * factor, 0.28, 4.5);
      return {
        scale: nextScale,
        x: originXValue - ((originXValue - current.x) / current.scale) * nextScale,
        y: originYValue - ((originYValue - current.y) / current.scale) * nextScale
      };
    });
  }, []);

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
      className={`airs-panel overflow-hidden ${isFullscreen ? "airs-map-host flex h-full flex-col rounded-none border-transparent" : ""}`}
    >
      <div
        ref={containerRef}
        className={`airs-map-stage relative isolate touch-none overflow-hidden overscroll-contain ${isFullscreen ? "min-h-0 flex-1" : "h-[540px] lg:h-[580px]"}`}
        style={{ cursor: dragState ? "grabbing" : "grab" }}
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
          if ((event.target as Element).closest?.("[data-map-point='true']")) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragState({
            startX: event.clientX,
            startY: event.clientY,
            cameraX: camera.x,
            cameraY: camera.y,
            pointerId: event.pointerId
          });
        }}
        onPointerMove={(event) => {
          if (!dragState || dragState.pointerId !== event.pointerId) return;
          setCamera((current) => ({
            ...current,
            x: dragState.cameraX + (event.clientX - dragState.startX),
            y: dragState.cameraY + (event.clientY - dragState.startY)
          }));
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          setDragState(null);
        }}
        onPointerCancel={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          setDragState(null);
        }}
        onPointerLeave={() => {
          if (!dragState) {
            setHoveredSocCode(null);
          }
        }}
        onDoubleClick={() => {
          fitToBounds();
          onSelect(null);
        }}
      >
        <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex justify-end">
          <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-end gap-2 rounded-[24px] border border-white/8 bg-black/20 p-2 shadow-[0_18px_60px_rgba(2,8,23,0.18)] backdrop-blur-xl">
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
                fitToBounds();
                onSelect(null);
              }}
            >
              {labels.resetView}
            </button>
            <span className="airs-chip">{formatNumber(camera.scale * 100, 0, language)}%</span>
          </div>
        </div>

        <svg className="h-full w-full" shapeRendering="geometricPrecision">
          <line
            x1={0}
            x2={viewport.width}
            y1={originY}
            y2={originY}
            stroke="var(--airs-map-axis-line)"
            strokeWidth={1}
            shapeRendering="crispEdges"
            vectorEffect="non-scaling-stroke"
          />
          <line
            y1={0}
            y2={viewport.height}
            x1={originX}
            x2={originX}
            stroke="var(--airs-map-axis-line)"
            strokeWidth={1}
            shapeRendering="crispEdges"
            vectorEffect="non-scaling-stroke"
          />
          <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.scale})`}>
            {points.map((point) => {
              const selected = point.row.socCode === selectedSocCode;
              const dimmed = selectedSocCode ? !selected : false;
              return (
                <g key={point.row.socCode}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={point.radius / camera.scale}
                    fill={pointColor(point.row)}
                    fillOpacity={dimmed ? 0.18 : 0.9}
                    stroke={selected ? "var(--airs-map-selected-stroke)" : "var(--airs-map-point-stroke)"}
                    strokeWidth={selected ? 2.4 : 1.2}
                    vectorEffect="non-scaling-stroke"
                    pointerEvents="none"
                  />
                  <circle
                    data-map-point="true"
                    cx={point.x}
                    cy={point.y}
                    r={Math.max(point.radius / camera.scale, 18 / camera.scale)}
                    fill="transparent"
                    pointerEvents="all"
                    onPointerDown={(event) => event.stopPropagation()}
                    onMouseEnter={() => setHoveredSocCode(point.row.socCode)}
                    onMouseLeave={() => setHoveredSocCode((current) => (current === point.row.socCode ? null : current))}
                    onClick={() => onSelect(selected ? null : point.row)}
                  />
                </g>
              );
            })}
          </g>
        </svg>

        {selectedPoint && selectedProjection && (
          <div
            className="airs-map-tooltip pointer-events-none absolute z-10 max-w-xs rounded-[24px] border px-4 py-3 shadow-2xl backdrop-blur-xl"
            style={{
              left: `${clamp(selectedProjection.x, 32, Math.max(32, viewport.width - 32))}px`,
              top: `${clamp(selectedProjection.y - 18, 32, Math.max(32, viewport.height - 32))}px`,
              transform: "translate(-50%, -100%)"
            }}
          >
            <p className="airs-map-tooltip-title text-sm font-medium">
              {language === "zh" ? selectedPoint.row.titleZh || selectedPoint.row.title : selectedPoint.row.title}
            </p>
            <p className="airs-map-tooltip-meta mt-1 text-xs">
              {selectedPoint.row.socCode} · AIRS {formatNumber(selectedPoint.row.airs || 0, 0, language)}
            </p>
            <p className="airs-map-tooltip-meta mt-2 text-xs">{labelText(language, selectedPoint.row.label)}</p>
          </div>
        )}
      </div>

      <div className="grid gap-3 border-t border-white/8 px-5 py-4 md:grid-cols-2 md:px-6 xl:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]">
        <div className="min-h-[108px] rounded-[22px] border border-white/8 bg-black/10 px-4 py-4">
          <p className="text-sm font-medium text-white/72">{labels.axisXTitle}</p>
          <p className="mt-2 text-sm leading-6 text-white/55">{labels.axisX}</p>
        </div>
        <div className="min-h-[108px] rounded-[22px] border border-white/8 bg-black/10 px-4 py-4">
          <p className="text-sm font-medium text-white/72">{labels.axisYTitle}</p>
          <p className="mt-2 text-sm leading-6 text-white/55">{labels.axisY}</p>
        </div>
      </div>
    </div>
  );
}
