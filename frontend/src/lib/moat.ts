import { getHumanMoatFactors, type HumanMoatLevel } from "./human-moat";
import { groupText } from "./i18n";
import { normalizeOccupationQuery, searchOccupationsByQuery } from "./occupation-search";
import type { OccupationRow, OccupationSearchMatchType } from "./types";

export type MoatLanguage = "en" | "zh";
export type DominantMoatType =
  | "complexJudgment"
  | "humanTrust"
  | "creativeExpression"
  | "fieldAdaptability"
  | "responsibility";

export type MoatStrengthLevel = HumanMoatLevel;

export interface OccupationMoatScores {
  complexJudgment: number;
  humanTrust: number;
  creativeExpression: number;
  fieldAdaptability: number;
  responsibility: number;
}

export interface OccupationMoatNode {
  occupation: OccupationRow;
  occupationId: string;
  socCode?: string;
  occupationNameCn: string;
  occupationNameEn?: string;
  majorGroup: string;
  majorGroupCn: string;
  moat: OccupationMoatScores;
  dominantMoatType: DominantMoatType;
  dominantMoatScore: number;
  moatAverage: number;
  moatStrengthLevel: MoatStrengthLevel;
  summary?: string;
  detailUrl?: string;
}

export interface MoatSearchMatch {
  node: OccupationMoatNode;
  label: string;
  labelEn?: string;
  matchType: OccupationSearchMatchType;
  matchedAlias?: string;
  score: number;
}

export interface MoatSearchPayload {
  queryRaw: string;
  queryNormalized: string;
  matchType: OccupationSearchMatchType;
  primaryResult: MoatSearchMatch | null;
  suggestions: MoatSearchMatch[];
  resultCount: number;
}

export const MOAT_TYPE_ORDER: DominantMoatType[] = [
  "complexJudgment",
  "humanTrust",
  "creativeExpression",
  "fieldAdaptability",
  "responsibility"
];

const MOAT_CONTEXT_PRIORITY: Record<
  "default" | "creative" | "trust" | "field" | "responsibility",
  DominantMoatType[]
> = {
  default: [...MOAT_TYPE_ORDER],
  creative: ["creativeExpression", "complexJudgment", "humanTrust", "responsibility", "fieldAdaptability"],
  trust: ["humanTrust", "responsibility", "complexJudgment", "fieldAdaptability", "creativeExpression"],
  field: ["fieldAdaptability", "responsibility", "complexJudgment", "humanTrust", "creativeExpression"],
  responsibility: ["responsibility", "complexJudgment", "humanTrust", "fieldAdaptability", "creativeExpression"]
};

const CREATIVE_SIGNAL_RE = /writer|author|screenwrit|script|journalist|reporter|editor|designer|illustrat|creative|brand|media|story|作家|编剧|撰稿|剧本|脚本|记者|编辑|设计|创意/u;
const TRUST_SIGNAL_RE = /teacher|professor|instructor|counselor|therap|nurse|caregiver|social worker|sales|customer service|contact representative|advisor|consultant|client|teacher|教师|老师|讲师|咨询师|治疗师|护士|照护|社工|销售|客户服务|客服|顾问/u;
const FIELD_SIGNAL_RE = /chef|cook|driver|electrician|plumber|mechanic|repair|maintenance|construction laborer|technician|installer|operator|主厨|厨师|司机|电工|水管|维修|维护|施工体力工|技师|安装|操作/u;
const RESPONSIBILITY_SIGNAL_RE = /lawyer|attorney|judge|compliance|accountant|auditor|physician|doctor|surgeon|nurse|pharmacist|律师|法官|法务|合规|会计|审计|医生|医师|外科|药师/u;
const CUSTOMER_SERVICE_SIGNAL_RE = /customer service|contact representative|call center|客户服务|客服/u;
const CLERICAL_SIGNAL_RE = /secretar|administrative assistant|receptionist|office clerk|office assistant|front desk|秘书|行政助理|文员|前台/u;
const CHEF_SIGNAL_RE = /chef|cook|baker|pastry|主厨|厨师|烘焙|甜点/u;
const SALES_SIGNAL_RE = /sales manager|sales|account manager|business development|销售经理|销售|客户经理|商务拓展/u;

const MOAT_LABELS: Record<
  DominantMoatType,
  {
    short: { en: string; zh: string };
    full: { en: string; zh: string };
    icon: { en: string; zh: string };
  }
> = {
  complexJudgment: {
    short: { en: "Complex Judgment", zh: "复杂判断" },
    full: { en: "Complex Judgment", zh: "复杂判断型" },
    icon: { en: "CJ", zh: "判" }
  },
  humanTrust: {
    short: { en: "Human Trust", zh: "人际信任" },
    full: { en: "Human Trust", zh: "人际信任型" },
    icon: { en: "HT", zh: "信" }
  },
  creativeExpression: {
    short: { en: "Creative Expression", zh: "创造表达" },
    full: { en: "Creative Expression", zh: "创造表达型" },
    icon: { en: "CE", zh: "创" }
  },
  fieldAdaptability: {
    short: { en: "Field Adaptability", zh: "现场应变" },
    full: { en: "Field Adaptability", zh: "现场应变型" },
    icon: { en: "FA", zh: "应" }
  },
  responsibility: {
    short: { en: "Responsibility", zh: "责任承担" },
    full: { en: "Responsibility", zh: "责任承担型" },
    icon: { en: "RS", zh: "责" }
  }
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function roundScore(value: number) {
  return Math.round(clamp(value, 0, 100));
}

function getMoatSignalText(occupation: OccupationRow) {
  return [
    occupation.majorGroup,
    occupation.title,
    occupation.titleZh,
    occupation.onetTitle,
    occupation.definition,
    ...occupation.tasks.slice(0, 8).map((task) => task.name)
  ]
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();
}

function addScore(target: OccupationMoatScores, key: DominantMoatType, delta: number) {
  target[key] = roundScore(target[key] + delta);
}

function getMoatContextPriority(text: string): keyof typeof MOAT_CONTEXT_PRIORITY {
  if (CREATIVE_SIGNAL_RE.test(text)) return "creative";
  if (TRUST_SIGNAL_RE.test(text)) return "trust";
  if (FIELD_SIGNAL_RE.test(text)) return "field";
  if (RESPONSIBILITY_SIGNAL_RE.test(text)) return "responsibility";
  return "default";
}

function applyMoatScoreAdjustments(base: OccupationMoatScores, occupation: OccupationRow) {
  const text = getMoatSignalText(occupation);
  const adjusted = { ...base };

  if (CUSTOMER_SERVICE_SIGNAL_RE.test(text)) {
    addScore(adjusted, "humanTrust", 20);
    addScore(adjusted, "complexJudgment", -8);
    addScore(adjusted, "responsibility", -8);
  }

  if (CLERICAL_SIGNAL_RE.test(text)) {
    addScore(adjusted, "humanTrust", 10);
    addScore(adjusted, "complexJudgment", -10);
    addScore(adjusted, "responsibility", -26);
    addScore(adjusted, "fieldAdaptability", -4);
  }

  if (CREATIVE_SIGNAL_RE.test(text)) {
    addScore(adjusted, "creativeExpression", 12);
  }

  if (CHEF_SIGNAL_RE.test(text)) {
    addScore(adjusted, "creativeExpression", 18);
    addScore(adjusted, "humanTrust", 4);
  }

  if (SALES_SIGNAL_RE.test(text)) {
    addScore(adjusted, "humanTrust", 10);
  }

  if (RESPONSIBILITY_SIGNAL_RE.test(text)) {
    addScore(adjusted, "responsibility", 6);
  }

  if (FIELD_SIGNAL_RE.test(text)) {
    addScore(adjusted, "fieldAdaptability", 8);
  }

  return {
    scores: adjusted,
    priority: getMoatContextPriority(text)
  };
}

function getMoatStrengthLevelFromAverage(score: number): MoatStrengthLevel {
  if (score < 40) return "weak";
  if (score < 70) return "medium";
  return "strong";
}

export function getMoatStrengthLabel(level: MoatStrengthLevel, language: MoatLanguage) {
  if (language === "en") {
    if (level === "weak") return "Weak";
    if (level === "medium") return "Medium";
    return "Strong";
  }
  if (level === "weak") return "弱";
  if (level === "medium") return "中";
  return "强";
}

export function getMoatStrengthLevel(score: number) {
  return getMoatStrengthLevelFromAverage(score);
}

export function getMoatStrengthLabelFromScore(score: number, language: MoatLanguage) {
  return getMoatStrengthLabel(getMoatStrengthLevel(score), language);
}

export function getMoatTypeLabel(type: DominantMoatType, language: MoatLanguage, variant: "short" | "full" = "short") {
  return MOAT_LABELS[type][variant][language];
}

export function getMoatTypeIcon(type: DominantMoatType, language: MoatLanguage) {
  return MOAT_LABELS[type].icon[language];
}

export function getOccupationMoatDisplayName(node: OccupationMoatNode, language: MoatLanguage) {
  return language === "zh" ? node.occupationNameCn || node.occupationNameEn || "" : node.occupationNameEn || node.occupationNameCn;
}

export function getMoatDimensionEntries(scores: OccupationMoatScores) {
  return MOAT_TYPE_ORDER.map((key) => ({
    key,
    value: scores[key]
  }));
}

export function getTopMoatDimensions(node: OccupationMoatNode, count = 2) {
  return getMoatDimensionEntries(node.moat)
    .sort((left, right) => {
      if (right.value !== left.value) return right.value - left.value;
      return MOAT_TYPE_ORDER.indexOf(left.key) - MOAT_TYPE_ORDER.indexOf(right.key);
    })
    .slice(0, count);
}

export function buildOccupationMoatSummary(node: OccupationMoatNode, language: MoatLanguage) {
  const leading = getTopMoatDimensions(node, 2).map((entry) => getMoatTypeLabel(entry.key, language, "short"));
  if (language === "en") {
    if (leading.length === 1) {
      return `This occupation still depends most on ${leading[0]}.`;
    }
    return `This occupation still depends most on ${leading[0]} and ${leading[1]}.`;
  }
  if (leading.length === 1) {
    return `该职业的人类优势主要集中在${leading[0]}。`;
  }
  return `该职业的人类优势主要集中在${leading[0]}与${leading[1]}。`;
}

export function getDominantMoatType(
  scores: OccupationMoatScores,
  priorityKey: keyof typeof MOAT_CONTEXT_PRIORITY = "default"
) {
  const maxScore = Math.max(...MOAT_TYPE_ORDER.map((type) => scores[type]));
  const priority = MOAT_CONTEXT_PRIORITY[priorityKey];
  const nearTieTypes = MOAT_TYPE_ORDER.filter((type) => maxScore - scores[type] <= 4);
  const rankedTypes = [...nearTieTypes].sort((left, right) => {
    if (scores[right] !== scores[left]) return scores[right] - scores[left];
    return priority.indexOf(left) - priority.indexOf(right);
  });
  const selectedType = rankedTypes[0] || MOAT_TYPE_ORDER[0];
  return {
    type: selectedType,
    score: scores[selectedType]
  };
}

export function createOccupationMoatNode(occupation: OccupationRow): OccupationMoatNode {
  const factors = getHumanMoatFactors(occupation);
  const provisionalMoat = {
    complexJudgment: roundScore(factors.judgmentProblemSolving * 0.72 + factors.nonStandardizationAutonomy * 0.28),
    humanTrust: roundScore(factors.socialTrustInteraction * 0.65 + factors.socialEmotionalSupport * 0.35),
    creativeExpression: roundScore(factors.creativeContextualJudgment),
    fieldAdaptability: roundScore(factors.physicalPresence * 0.7 + factors.nonStandardizationAutonomy * 0.3),
    responsibility: roundScore(factors.accountabilityConsequence)
  } satisfies OccupationMoatScores;
  const adjusted = applyMoatScoreAdjustments(provisionalMoat, occupation);
  const moat = adjusted.scores;
  const moatAverage = roundScore(
    (moat.complexJudgment + moat.humanTrust + moat.creativeExpression + moat.fieldAdaptability + moat.responsibility) / 5
  );
  const dominant = getDominantMoatType(moat, adjusted.priority);

  return {
    occupation,
    occupationId: occupation.socCode,
    socCode: occupation.socCode,
    occupationNameCn: occupation.titleZh || occupation.title,
    occupationNameEn: occupation.title,
    majorGroup: occupation.majorGroup || "Other",
    majorGroupCn: groupText("zh", occupation.majorGroup || "Other"),
    moat,
    dominantMoatType: dominant.type,
    dominantMoatScore: dominant.score,
    moatAverage,
    moatStrengthLevel: getMoatStrengthLevelFromAverage(moatAverage),
    summary: occupation.summaryZh || occupation.summary
  };
}

export function createOccupationMoatNodes(occupations: OccupationRow[]) {
  return occupations.map(createOccupationMoatNode);
}

function dedupeMoatSearchMatches(matches: Array<MoatSearchMatch | null>) {
  const seen = new Set<string>();
  return matches.filter((match): match is MoatSearchMatch => {
    if (!match || seen.has(match.node.occupationId)) return false;
    seen.add(match.node.occupationId);
    return true;
  });
}

function longestCommonSubstringLength(left: string, right: string) {
  if (!left || !right) return 0;
  const matrix = Array.from({ length: left.length + 1 }, () => Array.from({ length: right.length + 1 }, () => 0));
  let best = 0;

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      if (left[row - 1] !== right[column - 1]) {
        matrix[row][column] = 0;
        continue;
      }

      const next = matrix[row - 1][column - 1] + 1;
      matrix[row][column] = next;
      if (next > best) best = next;
    }
  }

  return best;
}

function isStrongEnoughMoatSearchMatch(queryNormalized: string, match: MoatSearchMatch) {
  if (!queryNormalized) return false;
  if (match.matchType === "exact_alias") return true;

  const queryCompact = queryNormalized.replace(/[\s/-]+/g, "");
  const aliasCompact = normalizeOccupationQuery(match.matchedAlias || match.label || getOccupationMoatDisplayName(match.node, "zh")).replace(/[\s/-]+/g, "");
  const overlap = longestCommonSubstringLength(queryCompact, aliasCompact);
  const overlapRatio = overlap / Math.max(queryCompact.length, 1);
  const aliasCoversQuery = aliasCompact.includes(queryCompact) || queryCompact.includes(aliasCompact);
  const leadingChineseFragment = /^[\u4e00-\u9fff]{2,}/u.test(queryCompact) ? queryCompact.slice(0, 2) : "";

  if (leadingChineseFragment && queryCompact.length >= 5 && !aliasCompact.includes(leadingChineseFragment)) {
    return false;
  }

  if (queryCompact.length >= 5 && !aliasCoversQuery && overlapRatio < 0.58) {
    return false;
  }

  if (match.matchType === "fuzzy_alias" && queryCompact.length >= 4 && overlapRatio < 0.66) {
    return false;
  }

  return true;
}

export function searchMoatNodes(nodes: OccupationMoatNode[], queryRaw: string): MoatSearchPayload {
  const payload = searchOccupationsByQuery(nodes.map((node) => node.occupation), queryRaw);
  const nodeById = new Map(nodes.map((node) => [node.occupationId, node]));

  const toMatch = (socCode?: string, label = "", labelEn?: string, matchType?: OccupationSearchMatchType, matchedAlias?: string, score = 0) => {
    if (!socCode) return null;
    const node = nodeById.get(socCode);
    if (!node || !matchType) return null;
    return {
      node,
      label,
      labelEn,
      matchType,
      matchedAlias,
      score
    } satisfies MoatSearchMatch;
  };

  const primaryResult = payload.primaryResult
    ? toMatch(
      payload.primaryResult.occupation.socCode,
      payload.primaryResult.label,
      payload.primaryResult.labelEn,
      payload.primaryResult.matchType,
      payload.primaryResult.matchedAlias,
      payload.primaryResult.score
    )
    : null;

  const strongMatches = dedupeMoatSearchMatches([
    primaryResult,
    ...payload.suggestions.map((hit) =>
      toMatch(hit.occupation.socCode, hit.label, hit.labelEn, hit.matchType, hit.matchedAlias, hit.score)
    )
  ]).filter((match) => isStrongEnoughMoatSearchMatch(payload.queryNormalized, match));

  const primaryStrongMatch = primaryResult && isStrongEnoughMoatSearchMatch(payload.queryNormalized, primaryResult)
    ? primaryResult
    : null;
  const suggestions = payload.matchType === "no_result" ? [] : strongMatches.slice(0, 8);
  const nextPrimaryResult = primaryStrongMatch || suggestions[0] || null;
  const nextMatchType = nextPrimaryResult ? nextPrimaryResult.matchType : "no_result";

  return {
    queryRaw: payload.queryRaw,
    queryNormalized: payload.queryNormalized,
    matchType: nextMatchType,
    primaryResult: nextPrimaryResult,
    suggestions,
    resultCount: suggestions.length
  };
}
