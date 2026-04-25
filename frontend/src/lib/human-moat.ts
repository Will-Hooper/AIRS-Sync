import type { OccupationRow } from "./types";

export type HumanMoatLevel = "weak" | "medium" | "strong";
export type OccupationQuadrantKey = "human_moat_zone" | "tug_zone" | "automation_zone" | "danger_zone";
type HumanMoatLanguage = "en" | "zh";

export interface HumanMoatFactors {
  physicalPresence: number;
  socialTrustInteraction: number;
  judgmentProblemSolving: number;
  accountabilityConsequence: number;
  socialEmotionalSupport: number;
  nonStandardizationAutonomy: number;
  creativeContextualJudgment: number;
}

export interface HumanMoatFactorDefinition {
  key: keyof HumanMoatFactors;
  weight: number;
  shortLabel: string;
  shortLabelZh: string;
  description: string;
  descriptionZh: string;
}

export interface OccupationQuadrantMeta {
  key: OccupationQuadrantKey;
  label: string;
  title: string;
  description: string;
  tooltipConclusion: string;
  detailConclusion: string;
}

const MIN_SCORE = 0;
const MAX_SCORE = 100;
const HUMAN_MOAT_MEDIUM_THRESHOLD = 40;
const HUMAN_MOAT_STRONG_THRESHOLD = 70;
export const AI_REPLACEMENT_PRESSURE_QUADRANT_THRESHOLD = 25;
export const HUMAN_MOAT_QUADRANT_THRESHOLD = 55;

export const HUMAN_MOAT_FACTOR_DEFINITIONS: HumanMoatFactorDefinition[] = [
  {
    key: "physicalPresence",
    weight: 0.18,
    shortLabel: "Physical Presence",
    shortLabelZh: "现场实体依赖",
    description: "Need to work in a real physical setting with people, tools, environments, equipment, or bodies.",
    descriptionZh: "工作是否必须在真实现场接触人、设备、环境、物品或人体。"
  },
  {
    key: "socialTrustInteraction",
    weight: 0.16,
    shortLabel: "Social Trust & Interaction",
    shortLabelZh: "社会信任与人际互动",
    description: "Need trust, persuasion, negotiation, relationship-building, or sustained human interaction.",
    descriptionZh: "职业价值是否来自人与人之间的信任、沟通、说服、协商和关系建立。"
  },
  {
    key: "judgmentProblemSolving",
    weight: 0.18,
    shortLabel: "Judgment & Problem Solving",
    shortLabelZh: "复杂判断与问题解决",
    description: "Need complex judgment, trade-offs, diagnosis, or decisions under uncertainty.",
    descriptionZh: "职业是否需要在不确定环境下做复杂判断、权衡和决策。"
  },
  {
    key: "accountabilityConsequence",
    weight: 0.14,
    shortLabel: "Accountability & Consequence",
    shortLabelZh: "责任承担与错误后果",
    description: "Need legal, safety, ethical, financial, or organizational accountability with material downside for mistakes.",
    descriptionZh: "职业是否需要承担法律、安全、伦理、经济或组织责任，以及出错后果是否严重。"
  },
  {
    key: "socialEmotionalSupport",
    weight: 0.12,
    shortLabel: "Social & Emotional Support",
    shortLabelZh: "情绪沟通与照护支持",
    description: "Need reassurance, care, motivation, emotional reading, conflict handling, or human support.",
    descriptionZh: "职业是否需要安抚、陪伴、照护、激励、谈判、冲突处理或情绪理解。"
  },
  {
    key: "nonStandardizationAutonomy",
    weight: 0.14,
    shortLabel: "Non-standardization & Autonomy",
    shortLabelZh: "非标准化与自主决策",
    description: "Hard to reduce into fixed steps; requires autonomy across non-standard situations.",
    descriptionZh: "职业是否难以被拆成固定流程，是否需要处理大量非标准场景。"
  },
  {
    key: "creativeContextualJudgment",
    weight: 0.08,
    shortLabel: "Creative & Contextual Judgment",
    shortLabelZh: "创造性与语境判断",
    description: "Need creativity, aesthetics, cultural context, or nuanced expression and framing.",
    descriptionZh: "职业是否需要创造性、审美判断、社会语境理解、文化判断和复杂表达。"
  }
];

const DEFAULT_PROFILE: HumanMoatFactors = {
  physicalPresence: 42,
  socialTrustInteraction: 42,
  judgmentProblemSolving: 48,
  accountabilityConsequence: 46,
  socialEmotionalSupport: 30,
  nonStandardizationAutonomy: 44,
  creativeContextualJudgment: 32
};

const MAJOR_GROUP_PROFILES: Record<string, HumanMoatFactors> = {
  Management: {
    physicalPresence: 20,
    socialTrustInteraction: 72,
    judgmentProblemSolving: 82,
    accountabilityConsequence: 80,
    socialEmotionalSupport: 42,
    nonStandardizationAutonomy: 74,
    creativeContextualJudgment: 50
  },
  "Business and Financial Operations": {
    physicalPresence: 18,
    socialTrustInteraction: 58,
    judgmentProblemSolving: 70,
    accountabilityConsequence: 72,
    socialEmotionalSupport: 28,
    nonStandardizationAutonomy: 56,
    creativeContextualJudgment: 36
  },
  "Computer and Mathematical": {
    physicalPresence: 14,
    socialTrustInteraction: 28,
    judgmentProblemSolving: 78,
    accountabilityConsequence: 54,
    socialEmotionalSupport: 16,
    nonStandardizationAutonomy: 66,
    creativeContextualJudgment: 58
  },
  "Architecture and Engineering": {
    physicalPresence: 40,
    socialTrustInteraction: 34,
    judgmentProblemSolving: 76,
    accountabilityConsequence: 70,
    socialEmotionalSupport: 18,
    nonStandardizationAutonomy: 68,
    creativeContextualJudgment: 44
  },
  "Life, Physical, and Social Science": {
    physicalPresence: 44,
    socialTrustInteraction: 36,
    judgmentProblemSolving: 78,
    accountabilityConsequence: 62,
    socialEmotionalSupport: 22,
    nonStandardizationAutonomy: 68,
    creativeContextualJudgment: 56
  },
  "Community and Social Service": {
    physicalPresence: 58,
    socialTrustInteraction: 84,
    judgmentProblemSolving: 68,
    accountabilityConsequence: 66,
    socialEmotionalSupport: 82,
    nonStandardizationAutonomy: 60,
    creativeContextualJudgment: 40
  },
  Legal: {
    physicalPresence: 24,
    socialTrustInteraction: 80,
    judgmentProblemSolving: 88,
    accountabilityConsequence: 88,
    socialEmotionalSupport: 38,
    nonStandardizationAutonomy: 74,
    creativeContextualJudgment: 64
  },
  "Educational Instruction and Library": {
    physicalPresence: 48,
    socialTrustInteraction: 86,
    judgmentProblemSolving: 72,
    accountabilityConsequence: 64,
    socialEmotionalSupport: 74,
    nonStandardizationAutonomy: 72,
    creativeContextualJudgment: 54
  },
  "Arts, Design, Entertainment, Sports, and Media": {
    physicalPresence: 30,
    socialTrustInteraction: 58,
    judgmentProblemSolving: 64,
    accountabilityConsequence: 46,
    socialEmotionalSupport: 36,
    nonStandardizationAutonomy: 78,
    creativeContextualJudgment: 90
  },
  "Healthcare Practitioners and Technical": {
    physicalPresence: 82,
    socialTrustInteraction: 74,
    judgmentProblemSolving: 84,
    accountabilityConsequence: 88,
    socialEmotionalSupport: 62,
    nonStandardizationAutonomy: 68,
    creativeContextualJudgment: 34
  },
  "Healthcare Support": {
    physicalPresence: 90,
    socialTrustInteraction: 72,
    judgmentProblemSolving: 52,
    accountabilityConsequence: 60,
    socialEmotionalSupport: 86,
    nonStandardizationAutonomy: 50,
    creativeContextualJudgment: 20
  },
  "Protective Service": {
    physicalPresence: 86,
    socialTrustInteraction: 70,
    judgmentProblemSolving: 78,
    accountabilityConsequence: 90,
    socialEmotionalSupport: 42,
    nonStandardizationAutonomy: 74,
    creativeContextualJudgment: 22
  },
  "Food Preparation and Serving Related": {
    physicalPresence: 76,
    socialTrustInteraction: 50,
    judgmentProblemSolving: 42,
    accountabilityConsequence: 40,
    socialEmotionalSupport: 28,
    nonStandardizationAutonomy: 40,
    creativeContextualJudgment: 20
  },
  "Building and Grounds Cleaning and Maintenance": {
    physicalPresence: 84,
    socialTrustInteraction: 28,
    judgmentProblemSolving: 38,
    accountabilityConsequence: 44,
    socialEmotionalSupport: 16,
    nonStandardizationAutonomy: 48,
    creativeContextualJudgment: 16
  },
  "Personal Care and Service": {
    physicalPresence: 72,
    socialTrustInteraction: 78,
    judgmentProblemSolving: 56,
    accountabilityConsequence: 52,
    socialEmotionalSupport: 76,
    nonStandardizationAutonomy: 56,
    creativeContextualJudgment: 24
  },
  "Sales and Related": {
    physicalPresence: 32,
    socialTrustInteraction: 84,
    judgmentProblemSolving: 60,
    accountabilityConsequence: 48,
    socialEmotionalSupport: 58,
    nonStandardizationAutonomy: 58,
    creativeContextualJudgment: 40
  },
  "Office and Administrative Support": {
    physicalPresence: 16,
    socialTrustInteraction: 32,
    judgmentProblemSolving: 28,
    accountabilityConsequence: 40,
    socialEmotionalSupport: 16,
    nonStandardizationAutonomy: 22,
    creativeContextualJudgment: 14
  },
  "Farming, Fishing, and Forestry": {
    physicalPresence: 88,
    socialTrustInteraction: 22,
    judgmentProblemSolving: 48,
    accountabilityConsequence: 54,
    socialEmotionalSupport: 12,
    nonStandardizationAutonomy: 60,
    creativeContextualJudgment: 16
  },
  "Construction and Extraction": {
    physicalPresence: 92,
    socialTrustInteraction: 30,
    judgmentProblemSolving: 68,
    accountabilityConsequence: 72,
    socialEmotionalSupport: 10,
    nonStandardizationAutonomy: 78,
    creativeContextualJudgment: 18
  },
  "Installation, Maintenance, and Repair": {
    physicalPresence: 88,
    socialTrustInteraction: 34,
    judgmentProblemSolving: 74,
    accountabilityConsequence: 72,
    socialEmotionalSupport: 14,
    nonStandardizationAutonomy: 80,
    creativeContextualJudgment: 20
  },
  Production: {
    physicalPresence: 72,
    socialTrustInteraction: 16,
    judgmentProblemSolving: 30,
    accountabilityConsequence: 40,
    socialEmotionalSupport: 8,
    nonStandardizationAutonomy: 20,
    creativeContextualJudgment: 12
  },
  "Transportation and Material Moving": {
    physicalPresence: 70,
    socialTrustInteraction: 28,
    judgmentProblemSolving: 48,
    accountabilityConsequence: 64,
    socialEmotionalSupport: 14,
    nonStandardizationAutonomy: 34,
    creativeContextualJudgment: 12
  },
  "Military Specific Occupations": {
    physicalPresence: 88,
    socialTrustInteraction: 56,
    judgmentProblemSolving: 84,
    accountabilityConsequence: 94,
    socialEmotionalSupport: 22,
    nonStandardizationAutonomy: 76,
    creativeContextualJudgment: 18
  },
  Other: DEFAULT_PROFILE
};

type HumanMoatAdjustment = Partial<HumanMoatFactors>;
interface SignalRule {
  pattern: RegExp;
  adjustments: HumanMoatAdjustment;
}

const POSITIVE_SIGNAL_RULES: SignalRule[] = [
  {
    pattern: /doctor|physician|surgeon|dentist|pharmacist|nurse|therap|paramedic|医生|医师|护士|牙医|药师|治疗师|康复|护理/u,
    adjustments: {
      physicalPresence: 10,
      socialTrustInteraction: 10,
      judgmentProblemSolving: 10,
      accountabilityConsequence: 12,
      socialEmotionalSupport: 8
    }
  },
  {
    pattern: /teacher|professor|instructor|educat|counselor|librarian|教师|老师|讲师|教授|辅导员|咨询师|图书馆/u,
    adjustments: {
      socialTrustInteraction: 12,
      judgmentProblemSolving: 6,
      socialEmotionalSupport: 10,
      nonStandardizationAutonomy: 8,
      creativeContextualJudgment: 6
    }
  },
  {
    pattern: /lawyer|attorney|judge|legal|compliance|律师|法务|法官|合规/u,
    adjustments: {
      socialTrustInteraction: 10,
      judgmentProblemSolving: 12,
      accountabilityConsequence: 12,
      creativeContextualJudgment: 8
    }
  },
  {
    pattern: /social worker|caregiver|childcare|case manager|community|护工|社工|照护|保育|看护|社区服务/u,
    adjustments: {
      physicalPresence: 8,
      socialTrustInteraction: 12,
      socialEmotionalSupport: 14,
      nonStandardizationAutonomy: 6
    }
  },
  {
    pattern: /manager|director|supervisor|administrator|planner|strategist|经理|主管|主任|总监|管理/u,
    adjustments: {
      socialTrustInteraction: 8,
      judgmentProblemSolving: 10,
      accountabilityConsequence: 10,
      nonStandardizationAutonomy: 8
    }
  },
  {
    pattern: /engineer|architect|scientist|research|analyst|investigator|diagnos|工程师|建筑师|科学家|研究员|分析师|调查/u,
    adjustments: {
      judgmentProblemSolving: 12,
      accountabilityConsequence: 6,
      nonStandardizationAutonomy: 10,
      creativeContextualJudgment: 6
    }
  },
  {
    pattern: /mechanic|repair|maintenance|electrician|plumber|technician|construction|installer|维修|维护|电工|水管|施工|安装/u,
    adjustments: {
      physicalPresence: 12,
      judgmentProblemSolving: 8,
      nonStandardizationAutonomy: 12,
      accountabilityConsequence: 6
    }
  },
  {
    pattern: /artist|designer|writer|author|editor|producer|creative|brand|media|content|product|艺术|设计|作者|编辑|品牌|媒体|内容|产品/u,
    adjustments: {
      judgmentProblemSolving: 6,
      nonStandardizationAutonomy: 10,
      creativeContextualJudgment: 16
    }
  },
  {
    pattern: /sales|consultant|advisor|negotiat|recruit|client|customer|account executive|销售|顾问|咨询|谈判|客户|商务/u,
    adjustments: {
      socialTrustInteraction: 12,
      judgmentProblemSolving: 6,
      socialEmotionalSupport: 6,
      nonStandardizationAutonomy: 4
    }
  },
  {
    pattern: /pilot|dispatcher|driver|operator|transport|logistics|flight|运输|司机|驾驶|调度|飞行/u,
    adjustments: {
      physicalPresence: 8,
      judgmentProblemSolving: 6,
      accountabilityConsequence: 10
    }
  }
];

const NEGATIVE_SIGNAL_RULES: SignalRule[] = [
  {
    pattern: /clerk|data entry|bookkeep|typist|receptionist|processor|cashier|telemarketer|proofreader|template|文员|录入|前台|出纳|收银|录单|打字|客服专员/u,
    adjustments: {
      physicalPresence: -8,
      socialTrustInteraction: -10,
      judgmentProblemSolving: -12,
      socialEmotionalSupport: -8,
      nonStandardizationAutonomy: -14,
      creativeContextualJudgment: -10
    }
  },
  {
    pattern: /assembler|packer|sorter|inspector|machine operator|stocker|filler|loader|包装|分拣|装配|流水线|补货|理货/u,
    adjustments: {
      socialTrustInteraction: -10,
      judgmentProblemSolving: -10,
      nonStandardizationAutonomy: -16,
      creativeContextualJudgment: -8
    }
  },
  {
    pattern: /scripted|routine|routine support|scheduling|filing|documentation|routine admin|标准化|流程化|例行|排班|归档/u,
    adjustments: {
      judgmentProblemSolving: -8,
      nonStandardizationAutonomy: -12,
      creativeContextualJudgment: -6
    }
  }
];

const QUADRANT_CONTENT: Record<OccupationQuadrantKey, { zh: Omit<OccupationQuadrantMeta, "key">; en: Omit<OccupationQuadrantMeta, "key"> }> = {
  human_moat_zone: {
    zh: {
      label: "护城河区",
      title: "护城河区",
      description: "这类工作目前相对稳定，也保留较强的人类不可替代性。",
      tooltipConclusion: "这类工作目前相对稳，且仍高度依赖人的能力。",
      detailConclusion: "这份工作目前相对稳，且仍保留较强的人类不可替代性。"
    },
    en: {
      label: "Human Moat Zone",
      title: "Human Moat Zone",
      description: "These jobs are relatively stable for now and still retain strong human-only value.",
      tooltipConclusion: "This role is relatively stable for now and still depends heavily on human capability.",
      detailConclusion: "This role is relatively stable for now and still keeps a strong layer of human-only value."
    }
  },
  tug_zone: {
    zh: {
      label: "拉扯区",
      title: "拉扯区",
      description: "这类工作正在被 AI 逼近，但仍然依赖人类判断、责任、信任、现场处理或复杂协作。未来更可能进入人机协作和岗位重构，而不是简单消失。",
      tooltipConclusion: "AI 已经逼近这类工作，但人的判断、责任或信任仍然重要。",
      detailConclusion: "这份工作正在进入人机拉扯阶段。AI 会改写其中一部分任务，但不一定会直接取代整个职业。"
    },
    en: {
      label: "Human-AI Tug Zone",
      title: "Human-AI Tug Zone",
      description: "AI pressure is rising here, but these roles still depend on human judgment, responsibility, trust, field work, or complex collaboration. They are more likely to be restructured than simply erased.",
      tooltipConclusion: "AI is already closing in, but human judgment, responsibility, or trust still matter here.",
      detailConclusion: "This role is entering a human-AI tug stage. AI may rewrite part of the work, but it is less likely to erase the whole occupation outright."
    }
  },
  automation_zone: {
    zh: {
      label: "自动化区",
      title: "自动化区",
      description: "这类工作目前综合压力不算最高，但由于流程化、标准化特征明显，长期仍需警惕自动化替代风险。",
      tooltipConclusion: "这类工作暂时压力不算最高，但流程化特征明显，长期需要警惕。",
      detailConclusion: "这份工作当前替代压力不算最高，但由于流程化程度较高，未来容易被自动化持续压缩。"
    },
    en: {
      label: "Automation Zone",
      title: "Automation Zone",
      description: "Pressure is not the highest yet, but the work is structured enough that long-run automation risk remains meaningful.",
      tooltipConclusion: "Pressure is not the highest yet, but this role is process-heavy enough to warrant long-run caution.",
      detailConclusion: "This role is not under the very highest pressure right now, but its process-heavy structure can still be compressed by automation over time."
    }
  },
  danger_zone: {
    zh: {
      label: "危险区",
      title: "危险区",
      description: "这类工作既面临较强 AI 替代压力，又缺少明显的人类护城河，是当前最需要警惕的区域。",
      tooltipConclusion: "这类工作 AI 替代压力高，人的护城河弱，是最容易被改写的一类。",
      detailConclusion: "这份工作同时具备高 AI 替代压力和弱人类护城河，是当前最值得警惕的职业类型。"
    },
    en: {
      label: "Danger Zone",
      title: "Danger Zone",
      description: "These jobs face stronger AI replacement pressure while also lacking a visible human moat. This is the area that deserves the most caution right now.",
      tooltipConclusion: "AI replacement pressure is high and the human moat is weak here. This is the most rewrite-prone zone.",
      detailConclusion: "This role combines strong AI replacement pressure with a weak human moat, which makes it one of the most exposed occupation types right now."
    }
  }
};

function clampScore(value: number) {
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, value));
}

function roundScore(value: number) {
  return Math.round(clampScore(value));
}

function copyFactors(factors: HumanMoatFactors): HumanMoatFactors {
  return { ...factors };
}

function applyAdjustments(base: HumanMoatFactors, adjustments: HumanMoatAdjustment) {
  for (const [key, value] of Object.entries(adjustments) as Array<[keyof HumanMoatFactors, number]>) {
    base[key] = clampScore(base[key] + value);
  }
}

function getOccupationSignalText(occupation: OccupationRow) {
  return [
    occupation.majorGroup,
    occupation.title,
    occupation.titleZh,
    occupation.definition,
    occupation.definitionZh,
    ...occupation.tasks.flatMap((task) => [task.name, task.nameZh])
  ]
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();
}

function getProvisionalMajorGroupProfile(occupation: OccupationRow): HumanMoatFactors {
  const profile = MAJOR_GROUP_PROFILES[occupation.majorGroup] || MAJOR_GROUP_PROFILES.Other || DEFAULT_PROFILE;
  return copyFactors(profile);
}

function applySignalRules(base: HumanMoatFactors, text: string, rules: SignalRule[]) {
  rules.forEach((rule) => {
    if (rule.pattern.test(text)) {
      applyAdjustments(base, rule.adjustments);
    }
  });
}

function applyTaskShapeAdjustments(base: HumanMoatFactors, occupation: OccupationRow) {
  const taskCount = occupation.tasks.length;
  if (taskCount >= 8) {
    applyAdjustments(base, {
      judgmentProblemSolving: 2,
      nonStandardizationAutonomy: 3
    });
  }

  if (occupation.tasks.some((task) => /care|teach|diagnos|repair|inspect|supervis|negoti|counsel|设计|沟通|判断|维修|诊断|管理/u.test(`${task.name} ${task.nameZh || ""}`.toLowerCase()))) {
    applyAdjustments(base, {
      nonStandardizationAutonomy: 4,
      judgmentProblemSolving: 3
    });
  }
}

function getQuadrantKey(pressure: number, humanMoatScore: number): OccupationQuadrantKey {
  if (pressure <= AI_REPLACEMENT_PRESSURE_QUADRANT_THRESHOLD && humanMoatScore >= HUMAN_MOAT_QUADRANT_THRESHOLD) return "human_moat_zone";
  if (pressure > AI_REPLACEMENT_PRESSURE_QUADRANT_THRESHOLD && humanMoatScore >= HUMAN_MOAT_QUADRANT_THRESHOLD) return "tug_zone";
  if (pressure <= AI_REPLACEMENT_PRESSURE_QUADRANT_THRESHOLD && humanMoatScore < HUMAN_MOAT_QUADRANT_THRESHOLD) return "automation_zone";
  return "danger_zone";
}

function localized<T>(language: HumanMoatLanguage, value: { zh: T; en: T }) {
  return language === "en" ? value.en : value.zh;
}

export function normalizeAirsScore(value?: number | null) {
  const numericValue = Number(value ?? 0);
  if (!Number.isFinite(numericValue)) return 0;
  if (numericValue >= 0 && numericValue <= 1) {
    return clampScore(numericValue * 100);
  }
  return clampScore(numericValue);
}

export function calculateHumanMoatScore(factors: HumanMoatFactors) {
  const weightedScore = HUMAN_MOAT_FACTOR_DEFINITIONS.reduce(
    (sum, definition) => sum + clampScore(factors[definition.key]) * definition.weight,
    0
  );
  return roundScore(weightedScore);
}

export function getHumanMoatFactors(occupation: OccupationRow): HumanMoatFactors {
  /**
   * Current Human Moat Score is a UI-layer heuristic model.
   * It deliberately avoids AIRS, hiring metrics, posting counts, and AIRS sub-scores.
   * The provisional mapping below can later be replaced by calibrated O*NET subfields
   * or an expert-reviewed scoring model without changing the UI contract.
   */
  const base = getProvisionalMajorGroupProfile(occupation);
  const occupationText = getOccupationSignalText(occupation);

  applySignalRules(base, occupationText, POSITIVE_SIGNAL_RULES);
  applySignalRules(base, occupationText, NEGATIVE_SIGNAL_RULES);
  applyTaskShapeAdjustments(base, occupation);

  return {
    physicalPresence: roundScore(base.physicalPresence),
    socialTrustInteraction: roundScore(base.socialTrustInteraction),
    judgmentProblemSolving: roundScore(base.judgmentProblemSolving),
    accountabilityConsequence: roundScore(base.accountabilityConsequence),
    socialEmotionalSupport: roundScore(base.socialEmotionalSupport),
    nonStandardizationAutonomy: roundScore(base.nonStandardizationAutonomy),
    creativeContextualJudgment: roundScore(base.creativeContextualJudgment)
  };
}

export function getHumanMoatScore(occupation: OccupationRow) {
  return calculateHumanMoatScore(getHumanMoatFactors(occupation));
}

export function getHumanMoatLevel(score: number): HumanMoatLevel {
  if (score < HUMAN_MOAT_MEDIUM_THRESHOLD) return "weak";
  if (score < HUMAN_MOAT_STRONG_THRESHOLD) return "medium";
  return "strong";
}

export function getHumanMoatLabel(score: number, language: HumanMoatLanguage = "zh") {
  const level = getHumanMoatLevel(score);
  if (language === "en") {
    if (level === "weak") return "Weak";
    if (level === "medium") return "Medium";
    return "Strong";
  }
  if (level === "weak") return "弱";
  if (level === "medium") return "中";
  return "强";
}

export function getAiReplacementPressure(occupation: OccupationRow) {
  return roundScore(100 - normalizeAirsScore(occupation.airs));
}

export function getOccupationQuadrant(occupation: OccupationRow, language: HumanMoatLanguage = "zh"): OccupationQuadrantMeta {
  const pressure = getAiReplacementPressure(occupation);
  const humanMoatScore = getHumanMoatScore(occupation);
  const key = getQuadrantKey(pressure, humanMoatScore);
  const content = localized(language, QUADRANT_CONTENT[key]);
  return {
    key,
    ...content
  };
}

export function getQuadrantMetaByKey(key: OccupationQuadrantKey, language: HumanMoatLanguage = "zh"): OccupationQuadrantMeta {
  return {
    key,
    ...localized(language, QUADRANT_CONTENT[key])
  };
}

export function getOccupationUniverseMetrics(occupation: OccupationRow, language: HumanMoatLanguage = "zh") {
  const airs = normalizeAirsScore(occupation.airs);
  const aiReplacementPressure = getAiReplacementPressure(occupation);
  const humanMoatScore = getHumanMoatScore(occupation);
  const humanMoatFactors = getHumanMoatFactors(occupation);
  const quadrant = getOccupationQuadrant(occupation, language);
  return {
    airs,
    aiReplacementPressure,
    humanMoatScore,
    humanMoatFactors,
    humanMoatLevel: getHumanMoatLevel(humanMoatScore),
    humanMoatLabel: getHumanMoatLabel(humanMoatScore, language),
    quadrant
  };
}

export function getHumanMoatFactorEntries(occupation: OccupationRow, language: HumanMoatLanguage = "zh") {
  const factors = getHumanMoatFactors(occupation);
  return HUMAN_MOAT_FACTOR_DEFINITIONS.map((definition) => ({
    key: definition.key,
    weight: definition.weight,
    label: language === "en" ? definition.shortLabel : definition.shortLabelZh,
    description: language === "en" ? definition.description : definition.descriptionZh,
    value: factors[definition.key]
  }));
}
