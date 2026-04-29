import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { AppTheme } from "../../shared/theme";
import { getMoatThemeTokens, getMoatNodeFill, getMoatNodeStroke, getMoatTypeColor, withAlpha } from "../../lib/moat-color";
import type { MoatGridLayout, MoatGroupLayout, PositionedOccupationMoatNode } from "../../lib/moat-layout";
import type { DominantMoatType, MoatLanguage, OccupationMoatNode } from "../../lib/moat";
import { MoatNodeTooltip } from "./MoatNodeTooltip";

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

interface MoatLandscapeMapProps {
  layout: MoatGridLayout;
  language: MoatLanguage;
  theme: AppTheme;
  selectedOccupationId?: string | null;
  visibleMajorGroup?: string;
  dominantMoatFilter?: DominantMoatType | "all";
  emptyText: string;
  resetViewLabel: string;
  onSelect: (node: OccupationMoatNode) => void;
  onClearSelection?: () => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getGroupsBounds(groups: MoatGroupLayout[]) {
  if (!groups.length) {
    return { minX: -300, maxX: 300, minY: -220, maxY: 220 };
  }
  return groups.reduce(
    (bounds, group) => ({
      minX: Math.min(bounds.minX, group.x),
      maxX: Math.max(bounds.maxX, group.x + group.width),
      minY: Math.min(bounds.minY, group.y),
      maxY: Math.max(bounds.maxY, group.y + group.height)
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY
    }
  );
}

export function MoatLandscapeMap({
  layout,
  language,
  theme,
  selectedOccupationId,
  visibleMajorGroup = "all",
  dominantMoatFilter = "all",
  emptyText,
  resetViewLabel,
  onSelect,
  onClearSelection
}: MoatLandscapeMapProps) {
  const tokens = getMoatThemeTokens(theme);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [camera, setCamera] = useState<CameraState>({ scale: 1, x: 0, y: 0 });
  const [viewport, setViewport] = useState({ width: 1, height: 1 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const cameraRef = useRef<CameraState>({ scale: 1, x: 0, y: 0 });
  const pointerStateRef = useRef<Map<number, PointerSnapshot>>(new Map());
  const gestureRef = useRef<GestureState | null>(null);

  const renderedGroups = useMemo(
    () => (visibleMajorGroup === "all" ? layout.groups : layout.groups.filter((group) => group.key === visibleMajorGroup)),
    [layout.groups, visibleMajorGroup]
  );
  const renderedNodes = useMemo(() => renderedGroups.flatMap((group) => group.nodes), [renderedGroups]);
  const bounds = useMemo(() => getGroupsBounds(renderedGroups), [renderedGroups]);
  const nodesById = useMemo(
    () => new Map(layout.nodes.map((entry) => [entry.node.occupationId, entry])),
    [layout.nodes]
  );

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

  const fitToBounds = useCallback((targetBounds = bounds) => {
    if (viewport.width <= 1 || viewport.height <= 1) return;

    const contentWidth = Math.max(targetBounds.maxX - targetBounds.minX, 1);
    const contentHeight = Math.max(targetBounds.maxY - targetBounds.minY, 1);
    const paddingX = Math.max(52, viewport.width * 0.07);
    const paddingY = Math.max(72, viewport.height * 0.1);
    const nextScale = clamp(
      Math.min((viewport.width - paddingX * 2) / contentWidth, (viewport.height - paddingY * 2) / contentHeight),
      0.28,
      3.6
    );

    setCamera({
      scale: nextScale,
      x: viewport.width / 2 - ((targetBounds.minX + targetBounds.maxX) / 2) * nextScale,
      y: viewport.height / 2 - ((targetBounds.minY + targetBounds.maxY) / 2) * nextScale
    });
  }, [bounds, viewport.height, viewport.width]);

  useLayoutEffect(() => {
    fitToBounds(bounds);
  }, [bounds, fitToBounds, visibleMajorGroup]);

  const focusNode = useCallback((entry: PositionedOccupationMoatNode) => {
    setCamera((current) => {
      const nextScale = clamp(Math.max(current.scale, 1.75), 0.28, 4.5);
      return {
        scale: nextScale,
        x: viewport.width / 2 - (entry.x + entry.size / 2) * nextScale,
        y: viewport.height / 2 - (entry.y + entry.size / 2) * nextScale
      };
    });
  }, [viewport.height, viewport.width]);

  useEffect(() => {
    if (!selectedOccupationId || viewport.width <= 1 || viewport.height <= 1) return;
    const selectedEntry = nodesById.get(selectedOccupationId);
    if (!selectedEntry) return;
    focusNode(selectedEntry);
  }, [focusNode, nodesById, selectedOccupationId, viewport.height, viewport.width]);

  const projectPoint = useCallback(
    (entry: PositionedOccupationMoatNode) => ({
      x: entry.x * camera.scale + camera.x,
      y: entry.y * camera.scale + camera.y
    }),
    [camera]
  );

  const hoveredEntry = hoveredId ? nodesById.get(hoveredId) || null : null;
  const tooltipEntry = hoveredEntry && !isInteracting ? hoveredEntry : null;
  const tooltipProjection = tooltipEntry ? projectPoint(tooltipEntry) : null;

  const zoomAt = useCallback((factor: number, clientX: number, clientY: number) => {
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

  const orderedNodes = useMemo(() => {
    return [...renderedNodes].sort((left, right) => {
      const leftMatched = dominantMoatFilter === "all" || left.node.dominantMoatType === dominantMoatFilter;
      const rightMatched = dominantMoatFilter === "all" || right.node.dominantMoatType === dominantMoatFilter;
      if (leftMatched !== rightMatched) return leftMatched ? 1 : -1;
      if (left.node.occupationId === selectedOccupationId) return 1;
      if (right.node.occupationId === selectedOccupationId) return -1;
      return 0;
    });
  }, [dominantMoatFilter, renderedNodes, selectedOccupationId]);

  const tooltipStyle = useMemo(() => {
    if (!tooltipProjection) return null;
    const left = clamp(tooltipProjection.x + 18, 12, Math.max(12, viewport.width - 260));
    const top = clamp(tooltipProjection.y - 16, 12, Math.max(12, viewport.height - 196));
    return { left, top };
  }, [tooltipProjection, viewport.height, viewport.width]);

  if (!renderedGroups.length) {
    return (
      <div
        className="flex min-h-[440px] items-center justify-center rounded-[28px] border"
        style={{
          color: tokens.textSecondary,
          borderColor: tokens.border,
          background: tokens.surface
        }}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-[30px] border"
      style={{
        borderColor: tokens.border,
        background: tokens.surface,
        boxShadow: tokens.shadow
      }}
    >
      <div
        ref={containerRef}
        className="relative isolate min-h-[460px] touch-none overflow-hidden overscroll-contain lg:min-h-[620px]"
        style={{
          background: tokens.mapBackground,
          cursor: isInteracting ? "grabbing" : "grab"
        }}
        onWheelCapture={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onWheel={(event) => {
          event.preventDefault();
          event.stopPropagation();
          zoomAt(event.deltaY > 0 ? 1 / 1.12 : 1.12, event.clientX, event.clientY);
        }}
        onPointerDown={(event) => {
          if ((event.target as Element).closest?.("[data-moat-node='true']")) return;
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
          if (!isInteracting) setHoveredId(null);
        }}
        onDoubleClick={() => {
          fitToBounds(bounds);
          onClearSelection?.();
        }}
      >
        <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex justify-end">
          <div
            className="pointer-events-auto flex items-center gap-2 rounded-full border px-2 py-2 shadow-xl backdrop-blur-xl"
            style={{
              borderColor: tokens.border,
              background: tokens.surface
            }}
          >
            <button
              type="button"
              className="rounded-full px-4 py-2 text-sm font-medium"
              style={{
                color: tokens.textPrimary,
                background: tokens.surfaceAlt
              }}
              onClick={() => {
                fitToBounds(bounds);
                onClearSelection?.();
              }}
            >
              {resetViewLabel}
            </button>
            <span className="px-2 text-xs font-medium" style={{ color: tokens.textSecondary }}>
              {Math.round(camera.scale * 100)}%
            </span>
          </div>
        </div>

        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${viewport.width} ${viewport.height}`} aria-label="Human moat landscape map">
          {renderedGroups.map((group) => {
            const projectedLeft = group.x * camera.scale + camera.x;
            const projectedTop = group.y * camera.scale + camera.y;
            const projectedWidth = group.width * camera.scale;
            const projectedHeight = group.height * camera.scale;
            const titleSize = camera.scale > 0.6 ? 14 : 12;
            const titleChipWidth = Math.max(88, group.label.length * (camera.scale > 0.6 ? 9.5 : 8.3) + 22);
            const titleColor = visibleMajorGroup !== "all" && group.key === visibleMajorGroup
              ? tokens.textPrimary
              : tokens.textSecondary;

            return (
              <g key={group.key}>
                <rect
                  x={projectedLeft}
                  y={projectedTop}
                  rx={18}
                  width={projectedWidth}
                  height={projectedHeight}
                  fill={withAlpha(theme === "dark" ? "#ffffff" : "#152235", theme === "dark" ? 0.025 : 0.035)}
                  stroke={withAlpha(theme === "dark" ? "#ffffff" : "#152235", visibleMajorGroup !== "all" && group.key === visibleMajorGroup ? 0.2 : 0.08)}
                  strokeWidth={1}
                />
                <rect
                  x={projectedLeft + 10}
                  y={projectedTop + 8}
                  rx={12}
                  width={titleChipWidth}
                  height={24}
                  fill={withAlpha(theme === "dark" ? "#08111d" : "#f8fbff", theme === "dark" ? 0.74 : 0.86)}
                  stroke={withAlpha(theme === "dark" ? "#ffffff" : "#152235", theme === "dark" ? 0.08 : 0.12)}
                  strokeWidth={1}
                />
                <text
                  x={projectedLeft + 18}
                  y={projectedTop + 24}
                  fill={titleColor}
                  fontSize={titleSize}
                  fontWeight={700}
                >
                  {group.label}
                </text>
              </g>
            );
          })}

          {orderedNodes.map((entry) => {
            const projected = projectPoint(entry);
            const isSelected = entry.node.occupationId === selectedOccupationId;
            const isHovered = entry.node.occupationId === hoveredId;
            const isMatched = dominantMoatFilter === "all" || entry.node.dominantMoatType === dominantMoatFilter;
            const nodeColor = getMoatNodeFill(entry.node.dominantMoatType, entry.node.moatStrengthLevel, theme);
            const accent = getMoatTypeColor(entry.node.dominantMoatType, theme);
            const size = Math.max(entry.size * camera.scale, 3.2);
            const stroke = isSelected ? tokens.textPrimary : getMoatNodeStroke(entry.node.dominantMoatType, theme);
            const opacity = dominantMoatFilter === "all" ? 1 : isMatched ? 1 : 0.16;

            return (
              <g key={entry.node.occupationId}>
                {isSelected ? (
                  <>
                    <rect
                      x={projected.x - 8}
                      y={projected.y - 8}
                      rx={Math.max(size * 0.42, 7)}
                      width={size + 16}
                      height={size + 16}
                      fill={withAlpha(accent, theme === "dark" ? 0.22 : 0.14)}
                      opacity={0.95}
                    />
                    <rect
                      x={projected.x - 4}
                      y={projected.y - 4}
                      rx={Math.max(size * 0.34, 5)}
                      width={size + 8}
                      height={size + 8}
                      fill="none"
                      stroke={withAlpha(accent, 0.94)}
                      strokeWidth={2.2}
                      opacity={0.98}
                    />
                  </>
                ) : null}
                <rect
                  x={projected.x}
                  y={projected.y}
                  data-moat-node="true"
                  data-occupation-id={entry.node.occupationId}
                  data-dominant-moat={entry.node.dominantMoatType}
                  rx={Math.max(size * 0.22, 3)}
                  width={size}
                  height={size}
                  fill={nodeColor}
                  opacity={opacity}
                  stroke={stroke}
                  strokeWidth={isSelected ? 2.4 : isHovered ? 1.45 : 0.9}
                  onMouseEnter={() => setHoveredId(entry.node.occupationId)}
                  onMouseLeave={() => setHoveredId((current) => (current === entry.node.occupationId ? null : current))}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(entry.node);
                  }}
                />
              </g>
            );
          })}
        </svg>

        {tooltipEntry && tooltipStyle ? (
          <MoatNodeTooltip
            node={tooltipEntry.node}
            language={language}
            theme={theme}
            style={tooltipStyle}
          />
        ) : null}
      </div>

      <div className="border-t px-4 py-3 text-xs leading-6 sm:px-5" style={{ color: tokens.textSecondary, borderColor: tokens.border }}>
        {language === "zh"
          ? "颜色表示主护城河类型，深浅表示护城河强弱。滚轮缩放、拖拽平移、双击回到全局。"
          : "Color marks the dominant moat type, while depth shows moat strength. Wheel to zoom, drag to pan, and double-click to reset."}
      </div>
      {/* TODO: Phase 2 can layer semantic zoom labels/cards on top of this stable grid camera. */}
    </div>
  );
}
