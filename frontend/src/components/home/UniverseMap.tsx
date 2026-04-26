import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { formatNumber } from "../../lib/format";
import {
  AI_REPLACEMENT_PRESSURE_QUADRANT_THRESHOLD,
  HUMAN_MOAT_QUADRANT_THRESHOLD,
  getOccupationUniverseMetrics,
  type OccupationQuadrantKey
} from "../../lib/human-moat";
import { labelText } from "../../lib/i18n";
import type { AppLanguage } from "../../lib/i18n";
import type { OccupationRow } from "../../lib/types";

interface UniverseMapProps {
  occupations: OccupationRow[];
  language: AppLanguage;
  selectedSocCode?: string;
  onSelect: (occupation: OccupationRow | null) => void;
  onOpenOccupation?: (occupation: OccupationRow) => void;
  emptyText: string;
  labels: {
    resetView: string;
    fullscreenEnter: string;
    fullscreenExit: string;
    axisXTitle: string;
    axisYTitle: string;
    axisXStart: string;
    axisXEnd: string;
    axisYStart: string;
    axisYEnd: string;
    openDetail: string;
  };
}

interface CameraState {
  scale: number;
  x: number;
  y: number;
}

interface PointerSnapshot {
  clientX: number;
  clientY: number;
  localX: number;
  localY: number;
}

type GestureState =
  | {
      type: "pan";
      pointerId: number;
      startX: number;
      startY: number;
      cameraX: number;
      cameraY: number;
    }
  | {
      type: "pinch";
      pointerIds: [number, number];
      startDistance: number;
      startScale: number;
      worldX: number;
      worldY: number;
    };

interface RenderPoint {
  row: OccupationRow;
  x: number;
  y: number;
  radius: number;
  airs: number;
  aiReplacementPressure: number;
  humanMoatScore: number;
  humanMoatLabel: string;
  quadrant: ReturnType<typeof getOccupationUniverseMetrics>["quadrant"];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function stableHash(input: string) {
  return [...input].reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) % 100003;
  }, 17);
}

function pointColor(point: RenderPoint) {
  const pressureRatio = point.aiReplacementPressure / 100;
  const humanMoatRatio = point.humanMoatScore / 100;

  if (point.quadrant.key === "danger_zone") {
    return `hsl(${8 + (1 - humanMoatRatio) * 10} 90% ${54 - pressureRatio * 8}%)`;
  }
  if (point.quadrant.key === "tug_zone") {
    return `hsl(${18 + humanMoatRatio * 18} 82% ${60 - pressureRatio * 6}%)`;
  }
  if (point.quadrant.key === "automation_zone") {
    return `hsl(${34 - pressureRatio * 8} 76% ${58 - (1 - humanMoatRatio) * 10}%)`;
  }
  return `hsl(${198 - pressureRatio * 14} 78% ${56 + humanMoatRatio * 8}%)`;
}

export function UniverseMap({
  occupations,
  language,
  selectedSocCode,
  onSelect,
  onOpenOccupation,
  emptyText,
  labels
}: UniverseMapProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [camera, setCamera] = useState<CameraState>({ scale: 1, x: 0, y: 0 });
  const [viewport, setViewport] = useState({ width: 1, height: 1 });
  const [hoveredSocCode, setHoveredSocCode] = useState<string | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const cameraRef = useRef<CameraState>({ scale: 1, x: 0, y: 0 });
  const pointerStateRef = useRef<Map<number, PointerSnapshot>>(new Map());
  const gestureRef = useRef<GestureState | null>(null);

  const points = useMemo<RenderPoint[]>(() => {
    return occupations.map((row) => {
      const metrics = getOccupationUniverseMetrics(row, language);
      const xHash = stableHash(row.socCode);
      const yHash = stableHash(`${row.socCode}:${row.title}`);
      const xOffset = ((xHash % 13) - 6) * 4;
      const yOffset = ((yHash % 13) - 6) * 4;
      const x = (metrics.aiReplacementPressure - AI_REPLACEMENT_PRESSURE_QUADRANT_THRESHOLD) * 15.2 + xOffset;
      const y = (HUMAN_MOAT_QUADRANT_THRESHOLD - metrics.humanMoatScore) * 13.6 + yOffset;

      return {
        row,
        x,
        y,
        radius: clamp(11 + Math.sqrt((row.postings || 0) + 1), 11, 26),
        airs: metrics.airs,
        aiReplacementPressure: metrics.aiReplacementPressure,
        humanMoatScore: metrics.humanMoatScore,
        humanMoatLabel: metrics.humanMoatLabel,
        quadrant: metrics.quadrant
      };
    });
  }, [language, occupations]);

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
    cameraRef.current = camera;
  }, [camera]);

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
  const quadrantCards: OccupationQuadrantKey[] = ["human_moat_zone", "tug_zone", "automation_zone", "danger_zone"];
  const selectedMeta = selectedPoint?.quadrant || null;
  const selectedIsPinned = Boolean(selectedSocCode && selectedPoint?.row.socCode === selectedSocCode);
  const splitX = clamp(originX, Math.max(72, viewport.width * 0.2), Math.max(72, viewport.width * 0.8));
  const splitY = clamp(originY, Math.max(72, viewport.height * 0.18), Math.max(72, viewport.height * 0.82));

  useEffect(() => {
    if (!selectedSocCode || viewport.width <= 1 || viewport.height <= 1) return;
    const point = points.find((entry) => entry.row.socCode === selectedSocCode);
    if (!point) return;

    setCamera((current) => {
      const projectedX = point.x * current.scale + current.x;
      const projectedY = point.y * current.scale + current.y;
      const safeMarginX = Math.max(120, viewport.width * 0.18);
      const safeMarginY = Math.max(120, viewport.height * 0.18);

      if (
        projectedX >= safeMarginX &&
        projectedX <= viewport.width - safeMarginX &&
        projectedY >= safeMarginY &&
        projectedY <= viewport.height - safeMarginY
      ) {
        return current;
      }

      return {
        ...current,
        x: viewport.width / 2 - point.x * current.scale,
        y: viewport.height / 2 - point.y * current.scale
      };
    });
  }, [points, selectedSocCode, viewport.height, viewport.width]);

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

  const getLocalPoint = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: clientX, y: clientY };
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  const beginPanGesture = useCallback((pointerId: number, point: PointerSnapshot, nextCamera: CameraState) => {
    gestureRef.current = {
      type: "pan",
      pointerId,
      startX: point.clientX,
      startY: point.clientY,
      cameraX: nextCamera.x,
      cameraY: nextCamera.y
    };
    setIsInteracting(true);
  }, []);

  const beginPinchGesture = useCallback((nextCamera: CameraState) => {
    const activePointers = [...pointerStateRef.current.entries()];
    if (activePointers.length < 2) return;

    const [[firstId, firstPointer], [secondId, secondPointer]] = activePointers;
    const centerX = (firstPointer.localX + secondPointer.localX) / 2;
    const centerY = (firstPointer.localY + secondPointer.localY) / 2;
    const distance = Math.max(
      Math.hypot(secondPointer.localX - firstPointer.localX, secondPointer.localY - firstPointer.localY),
      1
    );

    gestureRef.current = {
      type: "pinch",
      pointerIds: [firstId, secondId],
      startDistance: distance,
      startScale: nextCamera.scale,
      worldX: (centerX - nextCamera.x) / nextCamera.scale,
      worldY: (centerY - nextCamera.y) / nextCamera.scale
    };
    setIsInteracting(true);
  }, []);

  const syncGestureAfterPointerRemoval = useCallback(() => {
    const activePointers = [...pointerStateRef.current.entries()];
    if (!activePointers.length) {
      gestureRef.current = null;
      setIsInteracting(false);
      return;
    }

    if (activePointers.length === 1) {
      const [[pointerId, point]] = activePointers;
      beginPanGesture(pointerId, point, cameraRef.current);
      return;
    }

    beginPinchGesture(cameraRef.current);
  }, [beginPanGesture, beginPinchGesture]);

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
        style={{ cursor: isInteracting ? "grabbing" : "grab" }}
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
          const localPoint = getLocalPoint(event.clientX, event.clientY);
          const snapshot: PointerSnapshot = {
            clientX: event.clientX,
            clientY: event.clientY,
            localX: localPoint.x,
            localY: localPoint.y
          };
          event.currentTarget.setPointerCapture(event.pointerId);
          pointerStateRef.current.set(event.pointerId, snapshot);

          if (pointerStateRef.current.size >= 2) {
            beginPinchGesture(cameraRef.current);
            return;
          }

          beginPanGesture(event.pointerId, snapshot, cameraRef.current);
        }}
        onPointerMove={(event) => {
          if (!pointerStateRef.current.has(event.pointerId)) return;

          const localPoint = getLocalPoint(event.clientX, event.clientY);
          pointerStateRef.current.set(event.pointerId, {
            clientX: event.clientX,
            clientY: event.clientY,
            localX: localPoint.x,
            localY: localPoint.y
          });

          const gesture = gestureRef.current;
          if (!gesture) return;

          if (gesture.type === "pan") {
            if (gesture.pointerId !== event.pointerId) return;
            setCamera((current) => ({
              ...current,
              x: gesture.cameraX + (event.clientX - gesture.startX),
              y: gesture.cameraY + (event.clientY - gesture.startY)
            }));
            return;
          }

          const firstPointer = pointerStateRef.current.get(gesture.pointerIds[0]);
          const secondPointer = pointerStateRef.current.get(gesture.pointerIds[1]);
          if (!firstPointer || !secondPointer) return;

          const centerX = (firstPointer.localX + secondPointer.localX) / 2;
          const centerY = (firstPointer.localY + secondPointer.localY) / 2;
          const distance = Math.max(
            Math.hypot(secondPointer.localX - firstPointer.localX, secondPointer.localY - firstPointer.localY),
            1
          );
          const nextScale = clamp((distance / gesture.startDistance) * gesture.startScale, 0.28, 4.5);

          setCamera({
            scale: nextScale,
            x: centerX - gesture.worldX * nextScale,
            y: centerY - gesture.worldY * nextScale
          });
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          pointerStateRef.current.delete(event.pointerId);
          syncGestureAfterPointerRemoval();
        }}
        onPointerCancel={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          pointerStateRef.current.delete(event.pointerId);
          syncGestureAfterPointerRemoval();
        }}
        onPointerLeave={() => {
          if (!isInteracting) {
            setHoveredSocCode(null);
          }
        }}
        onDoubleClick={() => {
          fitToBounds();
          onSelect(null);
        }}
      >
        <div className="airs-map-quadrants pointer-events-none absolute inset-0 z-0">
          {quadrantCards.map((quadrantKey) => {
            const style =
              quadrantKey === "human_moat_zone"
                ? { left: 0, top: 0, width: `${splitX}px`, height: `${splitY}px` }
                : quadrantKey === "tug_zone"
                  ? { left: `${splitX}px`, top: 0, right: 0, height: `${splitY}px` }
                  : quadrantKey === "automation_zone"
                    ? { left: 0, top: `${splitY}px`, width: `${splitX}px`, bottom: 0 }
                    : { left: `${splitX}px`, top: `${splitY}px`, right: 0, bottom: 0 };
            return <div key={quadrantKey} className={`airs-map-quadrant airs-map-quadrant--${quadrantKey}`} style={style} />;
          })}
        </div>

        <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex justify-end">
          <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-end gap-2 rounded-[24px] border border-white/8 bg-black/20 p-2 shadow-[0_18px_60px_rgba(2,8,23,0.18)] backdrop-blur-xl">
            <button type="button" className="airs-button" onClick={() => void toggleFullscreen()}>
              {isFullscreen ? labels.fullscreenExit : labels.fullscreenEnter}
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

        <svg className="relative z-10 h-full w-full" shapeRendering="geometricPrecision">
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
                    fill={pointColor(point)}
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
            className="airs-map-tooltip absolute z-30 max-w-[320px] rounded-[24px] border px-4 py-3 shadow-2xl backdrop-blur-xl"
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
              {selectedPoint.row.socCode} · {selectedMeta?.label}
            </p>
            <div className="airs-map-tooltip__metrics mt-3">
              <div>
                <span>AIRS</span>
                <strong>{formatNumber(selectedPoint.airs, 0, language)}</strong>
              </div>
              <div>
                <span>{labels.axisXTitle}</span>
                <strong>{formatNumber(selectedPoint.aiReplacementPressure, 0, language)}</strong>
              </div>
              <div>
                <span>{labels.axisYTitle}</span>
                <strong>{formatNumber(selectedPoint.humanMoatScore, 0, language)}</strong>
              </div>
              <div>
                <span>{language === "zh" ? "护城河等级" : "Moat level"}</span>
                <strong>{selectedPoint.humanMoatLabel}</strong>
              </div>
            </div>
            <p className="airs-map-tooltip-meta mt-3 text-xs">{selectedMeta?.tooltipConclusion}</p>
            <p className="airs-map-tooltip-meta mt-2 text-xs">{labelText(language, selectedPoint.row.label)}</p>
            {selectedIsPinned && onOpenOccupation && (
              <button
                type="button"
                className="airs-map-tooltip__action mt-3"
                onClick={() => onOpenOccupation(selectedPoint.row)}
              >
                {labels.openDetail}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
