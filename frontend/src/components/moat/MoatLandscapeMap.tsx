import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { AppTheme } from "../../shared/theme";
import { getMoatThemeTokens, getMoatNodeFill, getMoatNodeStroke, getMoatTypeColor, withAlpha } from "../../lib/moat-color";
import type { MoatGridLayout, MoatGroupLayout, PositionedOccupationMoatNode } from "../../lib/moat-layout";
import { getMoatTypeLabel, getOccupationMoatDisplayName, type DominantMoatType, type MoatLanguage, type OccupationMoatNode } from "../../lib/moat";
import { MoatMiniBars } from "./MoatMiniBars";
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

interface GroupTitleMetrics {
  chipWidth: number;
  fontSize: number;
  label: string;
  textLength?: number;
}

interface OverlayBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface ProjectedNode {
  entry: PositionedOccupationMoatNode;
  x: number;
  y: number;
  size: number;
  centerX: number;
  centerY: number;
  isSelected: boolean;
  isHovered: boolean;
  isMatched: boolean;
  nodeColor: string;
  accent: string;
  stroke: string;
  opacity: number;
}

interface SemanticLabelPlacement extends OverlayBox {
  id: string;
  text: string;
  fontSize: number;
}

interface SemanticCardPlacement extends OverlayBox {
  id: string;
  entry: PositionedOccupationMoatNode;
  accent: string;
}

type SemanticZoomLevel = "global" | "local" | "occupation";

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

function isWideCharacter(character: string) {
  return /[\u1100-\u11ff\u2e80-\u9fff\uf900-\ufaff]/u.test(character);
}

function estimateLabelWidth(label: string, fontSize: number) {
  return [...label].reduce((width, character) => width + fontSize * (isWideCharacter(character) ? 0.94 : 0.6), 0);
}

function trimLabelToWidth(label: string, maxWidth: number, fontSize: number) {
  if (!label) return label;
  if (estimateLabelWidth(label, fontSize) <= maxWidth) return label;

  const ellipsis = "…";
  let nextLabel = "";
  for (const character of label) {
    const candidate = `${nextLabel}${character}`;
    if (estimateLabelWidth(`${candidate}${ellipsis}`, fontSize) > maxWidth) {
      return `${nextLabel || character}${ellipsis}`;
    }
    nextLabel = candidate;
  }

  return label;
}

function getGroupTitleMetrics(label: string, projectedWidth: number, scale: number): GroupTitleMetrics {
  const maxChipWidth = projectedWidth <= 48
    ? Math.max(projectedWidth - 8, 18)
    : Math.min(projectedWidth - 16, 228);
  const fontSize = projectedWidth < 120 || scale < 0.58
    ? 11
    : projectedWidth < 180 || scale < 0.92
      ? 12
      : 13;
  const textPadding = 18;
  const maxTextWidth = Math.max(maxChipWidth - textPadding * 2, 20);
  const fittedLabel = trimLabelToWidth(label, maxTextWidth, fontSize);
  const estimatedTextWidth = estimateLabelWidth(fittedLabel, fontSize);
  const chipWidth = clamp(
    estimatedTextWidth + textPadding * 2,
    Math.min(maxChipWidth, projectedWidth < 72 ? 26 : 64),
    maxChipWidth
  );
  const textLength = estimatedTextWidth > maxTextWidth ? maxTextWidth : undefined;

  return {
    chipWidth,
    fontSize,
    label: fittedLabel,
    textLength
  };
}

function normalizeWheelDelta(event: WheelEvent) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 18;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * 72;
  return event.deltaY;
}

function intersectsViewport(box: OverlayBox, viewportWidth: number, viewportHeight: number, padding = 0) {
  return (
    box.left + box.width >= -padding
    && box.top + box.height >= -padding
    && box.left <= viewportWidth + padding
    && box.top <= viewportHeight + padding
  );
}

function boxesOverlap(left: OverlayBox, right: OverlayBox, gap = 8) {
  return !(
    left.left + left.width + gap <= right.left
    || right.left + right.width + gap <= left.left
    || left.top + left.height + gap <= right.top
    || right.top + right.height + gap <= left.top
  );
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
  const wheelFrameRef = useRef<number | null>(null);
  const wheelDeltaRef = useRef(0);
  const wheelPointerRef = useRef({ clientX: 0, clientY: 0 });

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

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const flushWheelZoom = () => {
      wheelFrameRef.current = null;
      const delta = wheelDeltaRef.current;
      wheelDeltaRef.current = 0;
      if (!delta) return;

      const factor = clamp(Math.exp(-delta * 0.00145), 0.82, 1.22);
      zoomAt(factor, wheelPointerRef.current.clientX, wheelPointerRef.current.clientY);
    };

    const handleWheel = (event: WheelEvent) => {
      if (!element.contains(event.target as Node)) return;
      event.preventDefault();
      event.stopPropagation();

      wheelPointerRef.current = {
        clientX: event.clientX,
        clientY: event.clientY
      };
      wheelDeltaRef.current += normalizeWheelDelta(event);

      if (wheelFrameRef.current !== null) return;
      wheelFrameRef.current = window.requestAnimationFrame(flushWheelZoom);
    };

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      element.removeEventListener("wheel", handleWheel);
      if (wheelFrameRef.current !== null) {
        window.cancelAnimationFrame(wheelFrameRef.current);
        wheelFrameRef.current = null;
      }
      wheelDeltaRef.current = 0;
    };
  }, [zoomAt]);

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
  const isCompactViewport = viewport.width < 720;
  const localZoomThreshold = isCompactViewport ? 1.08 : 0.92;
  const occupationZoomThreshold = isCompactViewport ? 1.7 : 1.62;
  const semanticZoomLevel: SemanticZoomLevel = camera.scale >= occupationZoomThreshold
    ? "occupation"
    : camera.scale >= localZoomThreshold
      ? "local"
      : "global";

  const projectedNodes = useMemo<ProjectedNode[]>(() => {
    return orderedNodes.map((entry) => {
      const x = entry.x * camera.scale + camera.x;
      const y = entry.y * camera.scale + camera.y;
      const size = Math.max(entry.size * camera.scale, 3.2);
      const isSelected = entry.node.occupationId === selectedOccupationId;
      const isHovered = entry.node.occupationId === hoveredId;
      const isMatched = dominantMoatFilter === "all" || entry.node.dominantMoatType === dominantMoatFilter;
      const accent = getMoatTypeColor(entry.node.dominantMoatType, theme);

      return {
        entry,
        x,
        y,
        size,
        centerX: x + size / 2,
        centerY: y + size / 2,
        isSelected,
        isHovered,
        isMatched,
        nodeColor: getMoatNodeFill(entry.node.dominantMoatType, entry.node.moatStrengthLevel, theme),
        accent,
        stroke: isSelected ? tokens.textPrimary : getMoatNodeStroke(entry.node.dominantMoatType, theme),
        opacity: dominantMoatFilter === "all" ? 1 : isMatched ? 1 : 0.16
      };
    });
  }, [camera.scale, camera.x, camera.y, dominantMoatFilter, hoveredId, orderedNodes, selectedOccupationId, theme, tokens.textPrimary]);

  const projectedNodesById = useMemo(
    () => new Map(projectedNodes.map((entry) => [entry.entry.node.occupationId, entry])),
    [projectedNodes]
  );

  const semanticCards = useMemo<SemanticCardPlacement[]>(() => {
    if (semanticZoomLevel !== "occupation" || viewport.width <= 1 || viewport.height <= 1) return [];

    const visibleNodes = projectedNodes.filter((entry) => (
      entry.opacity > 0.18
      && intersectsViewport({ left: entry.x, top: entry.y, width: entry.size, height: entry.size }, viewport.width, viewport.height, 40)
    ));
    if (!visibleNodes.length) return [];

    const selectedNode = selectedOccupationId ? projectedNodesById.get(selectedOccupationId) || null : null;
    const hoveredNode = hoveredId ? projectedNodesById.get(hoveredId) || null : null;
    const seeds: ProjectedNode[] = [];
    const maxCards = isCompactViewport ? 1 : camera.scale >= 2.2 ? 3 : 2;
    const viewportCenterX = viewport.width / 2;
    const viewportCenterY = viewport.height / 2;
    const byDistanceToCenter = [...visibleNodes].sort((left, right) => {
      const leftDistance = Math.hypot(left.centerX - viewportCenterX, left.centerY - viewportCenterY);
      const rightDistance = Math.hypot(right.centerX - viewportCenterX, right.centerY - viewportCenterY);
      return leftDistance - rightDistance;
    });

    if (selectedNode && visibleNodes.some((entry) => entry.entry.node.occupationId === selectedNode.entry.node.occupationId)) {
      seeds.push(selectedNode);
    }
    if (
      hoveredNode
      && hoveredNode.entry.node.occupationId !== selectedNode?.entry.node.occupationId
      && visibleNodes.some((entry) => entry.entry.node.occupationId === hoveredNode.entry.node.occupationId)
    ) {
      seeds.push(hoveredNode);
    }
    if (!seeds.length && byDistanceToCenter[0]) {
      seeds.push(byDistanceToCenter[0]);
    }

    const chosen = new Map<string, ProjectedNode>();
    seeds.forEach((entry) => {
      chosen.set(entry.entry.node.occupationId, entry);
    });

    if (!isCompactViewport && chosen.size < maxCards && seeds[0]) {
      const nearby = visibleNodes
        .filter((entry) => (
          !chosen.has(entry.entry.node.occupationId)
          && entry.entry.groupKey === seeds[0].entry.groupKey
          && Math.abs(entry.entry.row - seeds[0].entry.row) <= 2
          && Math.abs(entry.entry.column - seeds[0].entry.column) <= 2
          && entry.opacity > 0.3
        ))
        .sort((left, right) => {
          const leftDistance = Math.abs(left.entry.row - seeds[0].entry.row) + Math.abs(left.entry.column - seeds[0].entry.column);
          const rightDistance = Math.abs(right.entry.row - seeds[0].entry.row) + Math.abs(right.entry.column - seeds[0].entry.column);
          if (leftDistance !== rightDistance) return leftDistance - rightDistance;
          return right.entry.node.moatAverage - left.entry.node.moatAverage;
        });

      nearby.forEach((entry) => {
        if (chosen.size < maxCards) {
          chosen.set(entry.entry.node.occupationId, entry);
        }
      });
    }

    byDistanceToCenter.forEach((entry) => {
      if (chosen.size < maxCards) {
        chosen.set(entry.entry.node.occupationId, entry);
      }
    });

    const cardWidth = isCompactViewport ? clamp(viewport.width - 30, 150, 176) : 196;
    const cardHeight = isCompactViewport ? 118 : 142;
    const topBoundary = isCompactViewport ? 14 : 64;
    const placements: SemanticCardPlacement[] = [];

    [...chosen.values()].slice(0, maxCards).forEach((entry, index) => {
      const offsetOptions = index === 0
        ? [
            { x: 16, y: -cardHeight * 0.34 },
            { x: 16, y: 12 },
            { x: -cardWidth - 16, y: -cardHeight * 0.34 },
            { x: -cardWidth - 16, y: 12 },
            { x: -cardWidth / 2, y: cardHeight * -0.96 }
          ]
        : [
            { x: 14, y: 10 },
            { x: -cardWidth - 14, y: 10 },
            { x: 14, y: -cardHeight * 0.42 },
            { x: -cardWidth - 14, y: -cardHeight * 0.42 }
          ];

      let chosenBox: OverlayBox | null = null;

      for (const option of offsetOptions) {
        const nextBox: OverlayBox = {
          left: clamp(entry.centerX + option.x, 10, Math.max(10, viewport.width - cardWidth - 10)),
          top: clamp(entry.centerY + option.y, topBoundary, Math.max(topBoundary, viewport.height - cardHeight - 12)),
          width: cardWidth,
          height: cardHeight
        };

        if (!placements.some((placement) => boxesOverlap(nextBox, placement, 12))) {
          chosenBox = nextBox;
          break;
        }
      }

      const fallbackBox = chosenBox || {
        left: clamp(entry.centerX + 14, 10, Math.max(10, viewport.width - cardWidth - 10)),
        top: clamp(entry.centerY + 12, topBoundary, Math.max(topBoundary, viewport.height - cardHeight - 12)),
        width: cardWidth,
        height: cardHeight
      };

      placements.push({
        id: entry.entry.node.occupationId,
        entry: entry.entry,
        accent: entry.accent,
        ...fallbackBox
      });
    });

    return placements;
  }, [camera.scale, dominantMoatFilter, hoveredId, isCompactViewport, projectedNodes, projectedNodesById, selectedOccupationId, semanticZoomLevel, viewport.height, viewport.width]);

  const semanticCardIds = useMemo(() => new Set(semanticCards.map((entry) => entry.id)), [semanticCards]);

  const semanticLabels = useMemo<SemanticLabelPlacement[]>(() => {
    if (semanticZoomLevel === "global" || viewport.width <= 1 || viewport.height <= 1) return [];

    const fontSize = camera.scale >= 1.45 ? 12 : 11;
    const maxLabelWidth = camera.scale >= 1.4 ? 142 : 116;
    const topBoundary = isCompactViewport ? 10 : 56;
    const maxLabels = isCompactViewport ? (semanticZoomLevel === "occupation" ? 3 : 2) : camera.scale >= 1.55 ? 14 : camera.scale >= 1.1 ? 9 : 6;
    const viewportCenterX = viewport.width / 2;
    const viewportCenterY = viewport.height / 2;
    const placed: SemanticLabelPlacement[] = [];
    const occupied: OverlayBox[] = semanticCards.map((entry) => ({
      left: entry.left,
      top: entry.top,
      width: entry.width,
      height: entry.height
    }));

    const rankNode = (entry: ProjectedNode) => {
      let score = entry.entry.node.moatAverage;
      if (entry.isSelected) score += 2600;
      if (entry.isHovered) score += 1800;
      if (visibleMajorGroup !== "all" && entry.entry.groupKey === visibleMajorGroup) score += 260;
      if (dominantMoatFilter !== "all") score += entry.isMatched ? 340 : -320;
      if (entry.entry.node.moatStrengthLevel === "strong") score += 42;
      if (entry.entry.node.moatStrengthLevel === "medium") score += 18;
      const centerDistance = Math.hypot(entry.centerX - viewportCenterX, entry.centerY - viewportCenterY);
      score += Math.max(0, 300 - centerDistance) / 6;
      return score;
    };

    const candidates = [...projectedNodes]
      .filter((entry) => (
        !semanticCardIds.has(entry.entry.node.occupationId)
        && entry.opacity > 0.18
        && intersectsViewport({ left: entry.x, top: entry.y, width: entry.size, height: entry.size }, viewport.width, viewport.height, 24)
      ))
      .sort((left, right) => rankNode(right) - rankNode(left));

    for (const entry of candidates) {
      const text = trimLabelToWidth(getOccupationMoatDisplayName(entry.entry.node, language), maxLabelWidth, fontSize);
      const width = clamp(estimateLabelWidth(text, fontSize) + 16, 48, maxLabelWidth + 16);
      const height = 24;
      const options = [
        { left: entry.x + entry.size + 8, top: entry.y + entry.size / 2 - height / 2 },
        { left: entry.x - width - 8, top: entry.y + entry.size / 2 - height / 2 },
        { left: entry.x + entry.size / 2 - width / 2, top: entry.y - height - 8 },
        { left: entry.x + entry.size / 2 - width / 2, top: entry.y + entry.size + 8 }
      ];

      let placement: SemanticLabelPlacement | null = null;

      for (const option of options) {
        const nextPlacement: SemanticLabelPlacement = {
          id: entry.entry.node.occupationId,
          text,
          fontSize,
          left: clamp(option.left, 8, Math.max(8, viewport.width - width - 8)),
          top: clamp(option.top, topBoundary, Math.max(topBoundary, viewport.height - height - 8)),
          width,
          height
        };

        if (!occupied.some((box) => boxesOverlap(nextPlacement, box, 8))) {
          placement = nextPlacement;
          break;
        }
      }

      if (!placement) continue;

      occupied.push(placement);
      placed.push(placement);
      if (placed.length >= maxLabels) break;
    }

    return placed;
  }, [
    camera.scale,
    dominantMoatFilter,
    isCompactViewport,
    language,
    projectedNodes,
    semanticCardIds,
    semanticCards,
    semanticZoomLevel,
    viewport.height,
    viewport.width,
    visibleMajorGroup
  ]);

  const hoveredProjectedNode = hoveredId ? projectedNodesById.get(hoveredId) || null : null;
  const tooltipEntry = hoveredProjectedNode && !isInteracting && semanticZoomLevel !== "occupation"
    ? hoveredProjectedNode.entry
    : null;
  const tooltipStyle = useMemo(() => {
    if (!hoveredProjectedNode || isInteracting || semanticZoomLevel === "occupation") return null;
    const left = clamp(hoveredProjectedNode.x + hoveredProjectedNode.size + 18, 12, Math.max(12, viewport.width - 260));
    const top = clamp(hoveredProjectedNode.y - 16, 12, Math.max(12, viewport.height - 196));
    return { left, top };
  }, [hoveredProjectedNode, isInteracting, semanticZoomLevel, viewport.height, viewport.width]);

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
            const titleMetrics = getGroupTitleMetrics(group.label, projectedWidth, camera.scale);
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
                  x={projectedLeft + 8}
                  y={projectedTop + 8}
                  rx={12}
                  width={titleMetrics.chipWidth}
                  height={26}
                  fill={withAlpha(theme === "dark" ? "#08111d" : "#f8fbff", theme === "dark" ? 0.74 : 0.86)}
                  stroke={withAlpha(theme === "dark" ? "#ffffff" : "#152235", theme === "dark" ? 0.08 : 0.12)}
                  strokeWidth={1}
                />
                <text
                  x={projectedLeft + 16}
                  y={projectedTop + 24.5}
                  fill={titleColor}
                  fontSize={titleMetrics.fontSize}
                  fontWeight={700}
                  textLength={titleMetrics.textLength}
                  lengthAdjust={titleMetrics.textLength ? "spacingAndGlyphs" : undefined}
                >
                  {titleMetrics.label}
                </text>
              </g>
            );
          })}

          {projectedNodes.map((entry) => {
            return (
              <g key={entry.entry.node.occupationId}>
                {entry.isSelected ? (
                  <>
                    <rect
                      x={entry.x - 8}
                      y={entry.y - 8}
                      rx={Math.max(entry.size * 0.42, 7)}
                      width={entry.size + 16}
                      height={entry.size + 16}
                      fill={withAlpha(entry.accent, theme === "dark" ? 0.22 : 0.14)}
                      opacity={0.95}
                    />
                    <rect
                      x={entry.x - 4}
                      y={entry.y - 4}
                      rx={Math.max(entry.size * 0.34, 5)}
                      width={entry.size + 8}
                      height={entry.size + 8}
                      fill="none"
                      stroke={withAlpha(entry.accent, 0.94)}
                      strokeWidth={2.2}
                      opacity={0.98}
                    />
                  </>
                ) : null}
                <rect
                  x={entry.x}
                  y={entry.y}
                  data-moat-node="true"
                  data-occupation-id={entry.entry.node.occupationId}
                  data-dominant-moat={entry.entry.node.dominantMoatType}
                  rx={Math.max(entry.size * 0.22, 3)}
                  width={entry.size}
                  height={entry.size}
                  fill={entry.nodeColor}
                  opacity={entry.opacity}
                  stroke={entry.stroke}
                  strokeWidth={entry.isSelected ? 2.4 : entry.isHovered ? 1.45 : 0.9}
                  onMouseEnter={() => setHoveredId(entry.entry.node.occupationId)}
                  onMouseLeave={() => setHoveredId((current) => (current === entry.entry.node.occupationId ? null : current))}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(entry.entry.node);
                  }}
                />
              </g>
            );
          })}
        </svg>

        {semanticLabels.length ? (
          <div className="pointer-events-none absolute inset-0 z-10">
            {semanticLabels.map((label) => (
              <div
                key={label.id}
                data-moat-semantic-label="true"
                className="absolute rounded-full border px-2.5 text-center font-medium shadow-lg backdrop-blur-md"
                style={{
                  left: label.left,
                  top: label.top,
                  width: label.width,
                  height: label.height,
                  lineHeight: `${label.height - 2}px`,
                  fontSize: label.fontSize,
                  color: tokens.textPrimary,
                  borderColor: tokens.border,
                  background: withAlpha(theme === "dark" ? "#08111d" : "#f8fbff", theme === "dark" ? 0.84 : 0.9)
                }}
              >
                {label.text}
              </div>
            ))}
          </div>
        ) : null}

        {semanticCards.length ? (
          <div className="pointer-events-none absolute inset-0 z-[15]">
            {semanticCards.map((card) => (
              <div
                key={card.id}
                data-moat-semantic-card="true"
                className="absolute overflow-hidden rounded-[22px] border p-3 shadow-2xl backdrop-blur-xl"
                style={{
                  left: card.left,
                  top: card.top,
                  width: card.width,
                  minHeight: card.height,
                  borderColor: withAlpha(card.accent, theme === "dark" ? 0.34 : 0.24),
                  background: `linear-gradient(180deg, ${withAlpha(card.accent, theme === "dark" ? 0.2 : 0.1)}, ${tokens.surfaceStrong})`,
                  boxShadow: `0 20px 48px ${withAlpha(card.accent, theme === "dark" ? 0.18 : 0.12)}`
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold tracking-[-0.03em]" style={{ color: tokens.textPrimary }}>
                      {getOccupationMoatDisplayName(card.entry.node, language)}
                    </p>
                    <p className="mt-1 truncate text-[11px]" style={{ color: tokens.textSecondary }}>
                      {language === "zh" ? card.entry.groupLabel : card.entry.groupKey}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold"
                    style={{
                      color: theme === "dark" ? "#f8fbff" : "#ffffff",
                      background: card.accent
                    }}
                  >
                    {getMoatTypeLabel(card.entry.node.dominantMoatType, language, "short")}
                  </span>
                </div>

                <div className="mt-3">
                  <MoatMiniBars node={card.entry.node} language={language} theme={theme} compact />
                </div>
              </div>
            ))}
          </div>
        ) : null}

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
          ? "颜色表示主护城河类型，深浅表示护城河强弱。滚轮缩放会逐步显示职业名称与职业卡片，拖拽平移，双击回到全局。"
          : "Color marks the dominant moat type, while depth shows moat strength. Zoom in to reveal names and occupation cards, drag to pan, and double-click to reset."}
      </div>
    </div>
  );
}
