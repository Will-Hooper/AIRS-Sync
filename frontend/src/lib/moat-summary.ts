import { MOAT_TYPE_ORDER, type DominantMoatType, type OccupationMoatNode } from "./moat";

export interface MoatSummaryItem {
  type: DominantMoatType;
  count: number;
  ratio: number;
}

export function calculateMoatSummary(nodes: OccupationMoatNode[]): MoatSummaryItem[] {
  const total = Math.max(nodes.length, 1);
  const counts = nodes.reduce<Record<DominantMoatType, number>>((result, node) => {
    result[node.dominantMoatType] += 1;
    return result;
  }, {
    complexJudgment: 0,
    humanTrust: 0,
    creativeExpression: 0,
    fieldAdaptability: 0,
    responsibility: 0
  });

  return MOAT_TYPE_ORDER.map((type) => {
    const count = counts[type];
    return {
      type,
      count,
      ratio: count / total
    };
  });
}
