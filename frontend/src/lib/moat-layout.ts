import { MOAT_TYPE_ORDER, type OccupationMoatNode } from "./moat";

export interface PositionedOccupationMoatNode {
  node: OccupationMoatNode;
  groupKey: string;
  groupLabel: string;
  x: number;
  y: number;
  size: number;
  row: number;
  column: number;
}

export interface MoatGroupLayout {
  key: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  nodeBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  nodes: PositionedOccupationMoatNode[];
}

export interface MoatGridLayout {
  groups: MoatGroupLayout[];
  nodes: PositionedOccupationMoatNode[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getGroupSortIndex(group: string, order: string[]) {
  const index = order.indexOf(group);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function buildMoatGridLayout(nodes: OccupationMoatNode[], groupOrder: string[] = []): MoatGridLayout {
  const grouped = new Map<string, OccupationMoatNode[]>();
  nodes.forEach((node) => {
    const bucket = grouped.get(node.majorGroup);
    if (bucket) {
      bucket.push(node);
      return;
    }
    grouped.set(node.majorGroup, [node]);
  });

  const orderedGroups = [...grouped.entries()].sort((left, right) => {
    const leftOrder = getGroupSortIndex(left[0], groupOrder);
    const rightOrder = getGroupSortIndex(right[0], groupOrder);
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return left[0].localeCompare(right[0]);
  });

  const nodeSize = 12;
  const nodeGap = 4;
  const innerPaddingX = 18;
  const innerPaddingTop = 18;
  const innerPaddingBottom = 16;
  const headerHeight = 30;
  const groupGap = 40;
  const maxRowWidth = 1380;

  const groups: MoatGroupLayout[] = [];
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;

  orderedGroups.forEach(([group, groupNodes]) => {
    const sortedNodes = [...groupNodes].sort((left, right) => {
      const dominantOrder = MOAT_TYPE_ORDER.indexOf(left.dominantMoatType) - MOAT_TYPE_ORDER.indexOf(right.dominantMoatType);
      if (dominantOrder !== 0) return dominantOrder;
      if (right.dominantMoatScore !== left.dominantMoatScore) return right.dominantMoatScore - left.dominantMoatScore;
      return left.occupationNameEn?.localeCompare(right.occupationNameEn || "") || 0;
    });

    const columns = clamp(Math.ceil(Math.sqrt(sortedNodes.length * 1.35)), 6, 18);
    const rows = Math.max(1, Math.ceil(sortedNodes.length / columns));
    const width = innerPaddingX * 2 + columns * nodeSize + Math.max(columns - 1, 0) * nodeGap;
    const height =
      headerHeight
      + innerPaddingTop
      + innerPaddingBottom
      + rows * nodeSize
      + Math.max(rows - 1, 0) * nodeGap;

    if (cursorX > 0 && cursorX + width > maxRowWidth) {
      cursorX = 0;
      cursorY += rowHeight + groupGap;
      rowHeight = 0;
    }

    const positionedNodes = sortedNodes.map((node, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      return {
        node,
        groupKey: group,
        groupLabel: sortedNodes[0]?.majorGroupCn || group,
        size: nodeSize,
        column,
        row,
        x: cursorX + innerPaddingX + column * (nodeSize + nodeGap),
        y: cursorY + headerHeight + innerPaddingTop + row * (nodeSize + nodeGap)
      };
    });

    const nodeBounds = positionedNodes.length
      ? positionedNodes.reduce(
          (bounds, entry) => ({
            minX: Math.min(bounds.minX, entry.x),
            maxX: Math.max(bounds.maxX, entry.x + entry.size),
            minY: Math.min(bounds.minY, entry.y),
            maxY: Math.max(bounds.maxY, entry.y + entry.size)
          }),
          {
            minX: Number.POSITIVE_INFINITY,
            maxX: Number.NEGATIVE_INFINITY,
            minY: Number.POSITIVE_INFINITY,
            maxY: Number.NEGATIVE_INFINITY
          }
        )
      : {
          minX: cursorX,
          maxX: cursorX,
          minY: cursorY,
          maxY: cursorY
        };

    groups.push({
      key: group,
      label: sortedNodes[0]?.majorGroupCn || group,
      x: cursorX,
      y: cursorY,
      width,
      height,
      nodeBounds,
      nodes: positionedNodes
    });

    cursorX += width + groupGap;
    rowHeight = Math.max(rowHeight, height);
  });

  const positionedNodes = groups.flatMap((group) => group.nodes);
  const bounds = groups.length
    ? groups.reduce(
        (accumulator, group) => ({
          minX: Math.min(accumulator.minX, group.x),
          maxX: Math.max(accumulator.maxX, group.x + group.width),
          minY: Math.min(accumulator.minY, group.y),
          maxY: Math.max(accumulator.maxY, group.y + group.height)
        }),
        {
          minX: Number.POSITIVE_INFINITY,
          maxX: Number.NEGATIVE_INFINITY,
          minY: Number.POSITIVE_INFINITY,
          maxY: Number.NEGATIVE_INFINITY
        }
      )
    : { minX: -320, maxX: 320, minY: -220, maxY: 220 };

  return {
    groups,
    nodes: positionedNodes,
    bounds
  };
}
