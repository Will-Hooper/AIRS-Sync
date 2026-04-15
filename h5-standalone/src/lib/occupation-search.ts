import type {
  OccupationAliasType,
  OccupationRow,
  OccupationSearchAlias,
  OccupationSearchHit,
  OccupationSearchMatchType,
  OccupationSearchPayload
} from "./types";

interface OccupationSearchSeedAliasInput {
  alias: string;
  aliasType?: OccupationAliasType;
  weight?: number;
  source?: "seed_manual" | "seed_generated" | "log_derived";
}

interface OccupationSearchSeedEntry {
  id: string;
  occupationId: string;
  label: string;
  labelEn?: string;
  categoryLv1: string;
  categoryLv2: string;
  analysisTemplateId: string;
  searchPriority: number;
  aliases: Array<string | OccupationSearchSeedAliasInput>;
}

interface OccupationSearchCategoryFallback {
  label: string;
  keywords: string[];
  entryIds: string[];
}

interface SearchEntry {
  id: string;
  occupation: OccupationRow;
  label: string;
  labelEn?: string;
  categoryLv1: string;
  categoryLv2: string;
  analysisTemplateId: string;
  searchPriority: number;
  aliases: OccupationSearchAlias[];
}

interface ScoredEntry {
  entry: SearchEntry;
  score: number;
  matchType: OccupationSearchMatchType;
  matchedAlias?: string;
  matchedAliasNormalized?: string;
  matchReason?: string;
}

const STRIP_YUAN_BASES = new Set([
  "会计",
  "出纳",
  "接待",
  "收发",
  "录入",
  "统计",
  "核算",
  "审单"
]);

const AUTO_CATEGORY_MAP = new Map<string, { categoryLv1: string; categoryLv2: string }>([
  ["Office and Administrative Support", { categoryLv1: "文职", categoryLv2: "综合" }],
  ["Business and Financial Operations", { categoryLv1: "文职", categoryLv2: "商务" }],
  ["Sales and Related", { categoryLv1: "销售", categoryLv2: "销售" }],
  ["Transportation and Material Moving", { categoryLv1: "物流", categoryLv2: "运输" }],
  ["Computer and Mathematical", { categoryLv1: "技术", categoryLv2: "开发" }],
  ["Architecture and Engineering", { categoryLv1: "技术", categoryLv2: "工程" }],
  ["Arts, Design, Entertainment, Sports, and Media", { categoryLv1: "内容", categoryLv2: "创意" }],
  ["Educational Instruction and Library", { categoryLv1: "教育医疗", categoryLv2: "教育" }],
  ["Healthcare Practitioners and Technical", { categoryLv1: "教育医疗", categoryLv2: "医疗" }],
  ["Healthcare Support", { categoryLv1: "教育医疗", categoryLv2: "护理" }],
  ["Food Preparation and Serving Related", { categoryLv1: "服务", categoryLv2: "餐饮" }],
  ["Protective Service", { categoryLv1: "服务", categoryLv2: "安保" }],
  ["Building and Grounds Cleaning and Maintenance", { categoryLv1: "服务", categoryLv2: "保洁" }],
  ["Personal Care and Service", { categoryLv1: "服务", categoryLv2: "个人服务" }]
]);

const COMMON_OCCUPATION_SEARCH_SEEDS: OccupationSearchSeedEntry[] = [
  {
    id: "common:admin-clerk",
    occupationId: "43-9061.00",
    label: "行政文员",
    labelEn: "Administrative Clerk",
    categoryLv1: "文职",
    categoryLv2: "行政",
    analysisTemplateId: "soc:43-9061.00",
    searchPriority: 110,
    aliases: ["行政文员", "行政", "文员", "办公室文员", "办公室内勤", "内勤", "做表格", "做表格的"]
  },
  {
    id: "common:receptionist",
    occupationId: "43-4171.00",
    label: "前台接待",
    labelEn: "Receptionist",
    categoryLv1: "文职",
    categoryLv2: "前台",
    analysisTemplateId: "soc:43-4171.00",
    searchPriority: 96,
    aliases: ["前台", "前台接待", "接待", "接待文员", "接待员"]
  },
  {
    id: "common:hr-specialist",
    occupationId: "13-1071.00",
    label: "人力资源专员",
    labelEn: "Human Resources Specialist",
    categoryLv1: "文职",
    categoryLv2: "人事",
    analysisTemplateId: "soc:13-1071.00",
    searchPriority: 108,
    aliases: ["人力资源", "人事", "人事专员", "hr", "招聘专员", "招聘", "招人的", "做人事的"]
  },
  {
    id: "common:customer-service",
    occupationId: "43-4051.00",
    label: "客服专员",
    labelEn: "Customer Service Representative",
    categoryLv1: "服务",
    categoryLv2: "客服",
    analysisTemplateId: "soc:43-4051.00",
    searchPriority: 108,
    aliases: ["客服", "客服专员", "客户服务", "售后客服", "在线客服", "电话客服", "客诉"]
  },
  {
    id: "common:accountant",
    occupationId: "13-2011.00",
    label: "会计",
    labelEn: "Accountant",
    categoryLv1: "文职",
    categoryLv2: "财务",
    analysisTemplateId: "soc:13-2011.00",
    searchPriority: 104,
    aliases: ["会计", "会计师", "财务会计", "总账会计", "财务", "做账", "做账的"]
  },
  {
    id: "common:ecommerce-operator",
    occupationId: "13-1161.00",
    label: "电商运营",
    labelEn: "E-Commerce Operations Specialist",
    categoryLv1: "运营",
    categoryLv2: "电商",
    analysisTemplateId: "soc:13-1161.00",
    searchPriority: 112,
    aliases: ["电商运营", "电商", "淘宝运营", "天猫运营", "店铺运营", "运营专员", "搞电商的"]
  },
  {
    id: "common:new-media-operator",
    occupationId: "13-1161.00",
    label: "新媒体运营",
    labelEn: "New Media Operations Specialist",
    categoryLv1: "运营",
    categoryLv2: "内容",
    analysisTemplateId: "soc:13-1161.00",
    searchPriority: 110,
    aliases: ["新媒体运营", "内容运营", "公众号运营", "社媒运营", "做内容的"]
  },
  {
    id: "common:douyin-operator",
    occupationId: "13-1161.00",
    label: "抖音运营",
    labelEn: "Douyin Operations Specialist",
    categoryLv1: "运营",
    categoryLv2: "短视频",
    analysisTemplateId: "soc:13-1161.00",
    searchPriority: 114,
    aliases: ["抖音运营", "做抖音的", "抖音", "短视频运营"]
  },
  {
    id: "common:livestream-host",
    occupationId: "41-9011.00",
    label: "带货主播",
    labelEn: "Livestream Host",
    categoryLv1: "内容",
    categoryLv2: "直播",
    analysisTemplateId: "soc:41-9011.00",
    searchPriority: 112,
    aliases: ["带货主播", "主播", "直播带货", "做直播带货", "卖货主播"]
  },
  {
    id: "common:video-editor",
    occupationId: "27-4032.00",
    label: "视频剪辑",
    labelEn: "Video Editor",
    categoryLv1: "内容",
    categoryLv2: "视频",
    analysisTemplateId: "soc:27-4032.00",
    searchPriority: 110,
    aliases: ["视频剪辑", "剪辑师", "视频后期", "短视频剪辑", "剪视频", "拍视频", "拍视频的"]
  },
  {
    id: "common:graphic-designer",
    occupationId: "27-1024.00",
    label: "平面设计师",
    labelEn: "Graphic Designer",
    categoryLv1: "设计",
    categoryLv2: "平面",
    analysisTemplateId: "soc:27-1024.00",
    searchPriority: 106,
    aliases: ["平面设计", "平面设计师", "美工", "视觉设计", "海报设计"]
  },
  {
    id: "common:software-developer",
    occupationId: "15-1252.00",
    label: "软件开发工程师",
    labelEn: "Software Developer",
    categoryLv1: "技术",
    categoryLv2: "开发",
    analysisTemplateId: "soc:15-1252.00",
    searchPriority: 112,
    aliases: ["程序员", "软件开发", "软件工程师", "开发工程师", "开发", "码农", { alias: "it", aliasType: "abbreviation", weight: 98 }]
  },
  {
    id: "common:data-analyst",
    occupationId: "15-2031.00",
    label: "数据分析师",
    labelEn: "Data Analyst",
    categoryLv1: "技术",
    categoryLv2: "数据",
    analysisTemplateId: "soc:15-2031.00",
    searchPriority: 102,
    aliases: ["数据分析", "数据分析师", "商业分析", "数据运营"]
  },
  {
    id: "common:product-manager",
    occupationId: "13-1082.00",
    label: "产品经理",
    labelEn: "Product Manager",
    categoryLv1: "运营",
    categoryLv2: "产品",
    analysisTemplateId: "soc:13-1082.00",
    searchPriority: 98,
    aliases: ["产品经理", "产品策划", "产品", "产品岗"]
  }
];

const POPULAR_SEARCH_ENTRY_IDS = [
  "common:admin-clerk",
  "common:hr-specialist",
  "common:customer-service",
  "common:douyin-operator",
  "common:livestream-host",
  "common:software-developer",
  "common:accountant",
  "common:video-editor"
];

const CATEGORY_FALLBACKS: OccupationSearchCategoryFallback[] = [
  {
    label: "文职",
    keywords: ["文员", "行政", "办公室", "内勤", "前台", "人事", "财务"],
    entryIds: ["common:admin-clerk", "common:receptionist", "common:hr-specialist", "common:accountant"]
  },
  {
    label: "运营",
    keywords: ["运营", "抖音", "短视频", "电商", "新媒体", "直播"],
    entryIds: ["common:douyin-operator", "common:new-media-operator", "common:ecommerce-operator", "common:product-manager"]
  },
  {
    label: "内容",
    keywords: ["剪辑", "视频", "主播", "带货", "拍视频"],
    entryIds: ["common:video-editor", "common:livestream-host", "common:new-media-operator", "common:douyin-operator"]
  },
  {
    label: "技术",
    keywords: ["程序员", "开发", "it", "数据", "产品"],
    entryIds: ["common:software-developer", "common:data-analyst", "common:product-manager"]
  }
];

function toHalfWidth(value: string) {
  return value.replace(/[\uFF01-\uFF5E]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0)).replace(/\u3000/g, " ");
}

export function normalizeOccupationQuery(value: unknown) {
  const original = toHalfWidth(String(value || ""))
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, " ")
    .replace(/[()\[\]{}<>【】（）《》]/g, " ")
    .replace(/[，。！？、；：,.!?/\\|"'`~@#$%^&*_+=]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!original) return "";

  let normalized = original
    .replace(/^(我想找|我想做|我在找|我做|我是|想找|想做|从事|做|干|搞)\s*/u, "")
    .replace(/\s*(方向|职业|岗位|工作|相关)$/u, "")
    .replace(/\s*的$/u, "")
    .replace(/\s+/g, " ")
    .trim();

  ["专员", "助理", "顾问", "老师", "师傅", "人员", "岗"].forEach((suffix) => {
    if (normalized.length > suffix.length + 1 && normalized.endsWith(suffix)) {
      normalized = normalized.slice(0, -suffix.length).trim();
    }
  });

  if (normalized.endsWith("员")) {
    const base = normalized.slice(0, -1);
    if (STRIP_YUAN_BASES.has(base)) {
      normalized = base;
    }
  }

  return normalized || original;
}

function compactOccupationQuery(value: unknown) {
  return normalizeOccupationQuery(value).replace(/[\s/-]+/g, "");
}

function tokenizeSearchText(value: unknown) {
  return normalizeOccupationQuery(value).split(" ").filter(Boolean);
}

function makeBigrams(value: unknown) {
  const text = compactOccupationQuery(value);
  if (!text) return [];
  if (text.length === 1) return [text];

  const grams: string[] = [];
  for (let index = 0; index < text.length - 1; index += 1) {
    grams.push(text.slice(index, index + 2));
  }
  return grams;
}

function diceCoefficient(left: unknown, right: unknown) {
  const leftGrams = makeBigrams(left);
  const rightGrams = makeBigrams(right);
  if (!leftGrams.length || !rightGrams.length) return 0;

  const counts = new Map<string, number>();
  leftGrams.forEach((gram) => counts.set(gram, (counts.get(gram) || 0) + 1));

  let overlap = 0;
  rightGrams.forEach((gram) => {
    const count = counts.get(gram) || 0;
    if (count > 0) {
      overlap += 1;
      counts.set(gram, count - 1);
    }
  });

  return (2 * overlap) / (leftGrams.length + rightGrams.length);
}

function tokenOverlapScore(query: unknown, candidate: unknown) {
  const queryTokens = tokenizeSearchText(query);
  const candidateTokens = tokenizeSearchText(candidate);
  if (!queryTokens.length || !candidateTokens.length) return 0;

  let matches = 0;
  queryTokens.forEach((queryToken) => {
    if (candidateTokens.some((candidateToken) => candidateToken.includes(queryToken) || queryToken.includes(candidateToken))) {
      matches += 1;
    }
  });

  return matches / queryTokens.length;
}

function levenshteinDistance(left: string, right: string) {
  if (!left) return right.length;
  if (!right) return left.length;

  const matrix = Array.from({ length: left.length + 1 }, () => Array.from({ length: right.length + 1 }, () => 0));
  for (let row = 0; row <= left.length; row += 1) matrix[row][0] = row;
  for (let column = 0; column <= right.length; column += 1) matrix[0][column] = column;

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost
      );
    }
  }

  return matrix[left.length][right.length];
}

function fuzzyScore(query: string, alias: string) {
  const queryCompact = compactOccupationQuery(query);
  const aliasCompact = compactOccupationQuery(alias);
  if (!queryCompact || !aliasCompact) return 0;

  const similarity = diceCoefficient(queryCompact, aliasCompact);
  const overlap = tokenOverlapScore(query, alias);
  const distance = levenshteinDistance(queryCompact, aliasCompact);
  const maxLength = Math.max(queryCompact.length, aliasCompact.length, 1);
  const editScore = 1 - distance / maxLength;

  return Math.max(similarity * 135, overlap * 120, editScore * 88);
}

function aliasTypeFor(value: string): OccupationAliasType {
  if (/^[a-z0-9+.-]{1,8}$/i.test(value)) return "abbreviation";
  return "common";
}

function clampWeight(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(100, Math.round(value)));
}

function normalizeAliasSeedValue(value: string | OccupationSearchSeedAliasInput) {
  if (typeof value === "string") {
    return { alias: value.trim() };
  }

  return {
    alias: String(value.alias || "").trim(),
    aliasType: value.aliasType,
    weight: value.weight,
    source: value.source
  };
}

function buildAliasRecords(values: Array<string | OccupationSearchSeedAliasInput>, source: string, label = "") {
  const orderedValues: Array<string | OccupationSearchSeedAliasInput> = label
    ? [{ alias: label, aliasType: "official", weight: 100 }, ...values]
    : values;
  const records = new Map<string, OccupationSearchAlias>();

  orderedValues.forEach((value, index) => {
    const normalized = normalizeAliasSeedValue(value);
    if (!normalized.alias) return;

    const aliasNormalized = normalizeOccupationQuery(normalized.alias);
    if (!aliasNormalized) return;

    const fallbackWeight = Math.max(56, 100 - index * 6);
    const nextRecord: OccupationSearchAlias = {
      alias: normalized.alias,
      aliasNormalized,
      aliasType: normalized.aliasType || (index === 0 ? "official" : aliasTypeFor(normalized.alias)),
      weight: clampWeight(Number(normalized.weight), fallbackWeight),
      source: normalized.source || source
    };

    const existing = records.get(aliasNormalized);
    if (!existing) {
      records.set(aliasNormalized, nextRecord);
      return;
    }

    if (
      nextRecord.aliasType === "official"
      || nextRecord.weight > existing.weight
      || (nextRecord.weight === existing.weight && nextRecord.alias.length < existing.alias.length)
    ) {
      records.set(aliasNormalized, nextRecord);
    }
  });

  return [...records.values()];
}

function categoriesForRow(row: OccupationRow) {
  return AUTO_CATEGORY_MAP.get(String(row.majorGroup || "")) || { categoryLv1: "其他", categoryLv2: "综合" };
}

function autoEntryForRow(row: OccupationRow): SearchEntry {
  const categories = categoriesForRow(row);
  const label = String(row.titleZh || row.title || row.socCode);
  return {
    id: `airs:${row.socCode}`,
    occupation: row,
    label,
    labelEn: row.title,
    categoryLv1: categories.categoryLv1,
    categoryLv2: categories.categoryLv2,
    analysisTemplateId: `soc:${row.socCode}`,
    searchPriority: Math.max(40, Math.round(Number(row.airs || 0))),
    aliases: buildAliasRecords([
      ...(Array.isArray(row.searchIndex) ? row.searchIndex : []),
      row.titleZh || "",
      row.title || "",
      row.socCode || ""
    ], "airs_dataset", label)
  };
}

function seedEntryForRow(seed: OccupationSearchSeedEntry, row: OccupationRow): SearchEntry {
  return {
    id: seed.id,
    occupation: row,
    label: seed.label,
    labelEn: seed.labelEn || row.title,
    categoryLv1: seed.categoryLv1,
    categoryLv2: seed.categoryLv2,
    analysisTemplateId: seed.analysisTemplateId,
    searchPriority: seed.searchPriority,
    aliases: buildAliasRecords(seed.aliases, "seed_manual", seed.label)
  };
}

function buildEntries(rows: OccupationRow[]) {
  const rowsBySocCode = new Map(rows.map((row) => [row.socCode, row]));
  const autoEntries = rows.map(autoEntryForRow);
  const seedEntries = COMMON_OCCUPATION_SEARCH_SEEDS
    .map((seed) => {
      const occupation = rowsBySocCode.get(seed.occupationId);
      return occupation ? seedEntryForRow(seed, occupation) : null;
    })
    .filter((entry): entry is SearchEntry => Boolean(entry));

  return {
    entries: [...seedEntries, ...autoEntries],
    popularEntries: POPULAR_SEARCH_ENTRY_IDS
      .map((id) => seedEntries.find((entry) => entry.id === id))
      .filter((entry): entry is SearchEntry => Boolean(entry))
  };
}

function toHit(scored: ScoredEntry, normalizedQuery: string): OccupationSearchHit {
  return {
    id: scored.entry.id,
    occupation: scored.entry.occupation,
    label: scored.entry.label,
    labelEn: scored.entry.labelEn,
    normalizedQuery,
    matchType: scored.matchType,
    score: Math.round(scored.score),
    matchReason: scored.matchReason,
    matchedAlias: scored.matchedAlias,
    matchedAliasNormalized: scored.matchedAliasNormalized,
    categoryLv1: scored.entry.categoryLv1,
    categoryLv2: scored.entry.categoryLv2,
    analysisTemplateId: scored.entry.analysisTemplateId,
    searchPriority: scored.entry.searchPriority,
    aliases: scored.entry.aliases
  };
}

function dedupeByOccupation(scoredEntries: ScoredEntry[]) {
  const byOccupation = new Map<string, ScoredEntry>();

  scoredEntries.forEach((item) => {
    const key = item.entry.occupation.socCode;
    const current = byOccupation.get(key);
    if (!current || item.score > current.score) {
      byOccupation.set(key, item);
    }
  });

  return [...byOccupation.values()].sort((left, right) =>
    right.score - left.score
    || right.entry.searchPriority - left.entry.searchPriority
    || String(left.entry.label).localeCompare(String(right.entry.label), "zh-Hans-CN")
  );
}

function dedupeHitsByLabel(hits: OccupationSearchHit[]) {
  const seen = new Set<string>();
  return hits.filter((hit) => {
    const key = `${hit.id}:${hit.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isCuratedEntry(entry: SearchEntry) {
  return entry.id.startsWith("common:");
}

function relatedAlternatives(entries: SearchEntry[], primary: OccupationSearchHit, normalizedQuery: string) {
  const primaryEntry = entries.find((entry) => entry.id === primary.id);
  if (!primaryEntry || !isCuratedEntry(primaryEntry)) return [] as OccupationSearchHit[];

  return entries
    .filter((entry) => entry.id !== primaryEntry.id && isCuratedEntry(entry))
    .map((entry) => {
      let score = 0;
      if (entry.analysisTemplateId === primaryEntry.analysisTemplateId) score += 320;
      if (entry.categoryLv1 === primaryEntry.categoryLv1) score += 180;
      if (entry.categoryLv2 === primaryEntry.categoryLv2) score += 40;
      score += entry.searchPriority * 0.4;

      return score > 0
        ? toHit(
            {
              entry,
              score,
              matchType: "category_fallback",
              matchedAlias: primary.label,
              matchedAliasNormalized: normalizedQuery,
              matchReason: "相近职业推荐"
            },
            normalizedQuery
          )
        : null;
    })
    .filter((entry): entry is OccupationSearchHit => Boolean(entry))
    .sort((left, right) =>
      right.score - left.score
      || right.searchPriority - left.searchPriority
      || String(left.label).localeCompare(String(right.label), "zh-Hans-CN")
    );
}

function fallbackAlternatives(entries: SearchEntry[], queryRaw: string, normalizedQuery: string) {
  return categoryFallback(entries, queryRaw).map((entry) => toHit(entry, normalizedQuery));
}

function scoreAliasMatch(queryNormalized: string, queryCompact: string, alias: OccupationSearchAlias, entry: SearchEntry): ScoredEntry | null {
  const aliasNormalized = alias.aliasNormalized || normalizeOccupationQuery(alias.alias);
  const aliasCompact = compactOccupationQuery(alias.alias);
  if (!queryNormalized || !aliasNormalized || !queryCompact || !aliasCompact) return null;

  if (aliasCompact === queryCompact) {
    return {
      entry,
      score: 420 + alias.weight + entry.searchPriority,
      matchType: "exact_alias",
      matchedAlias: alias.alias,
      matchedAliasNormalized: aliasNormalized,
      matchReason: "别名精确命中"
    };
  }

  if (aliasCompact.startsWith(queryCompact) || queryCompact.startsWith(aliasCompact)) {
    return {
      entry,
      score: 320 + alias.weight + entry.searchPriority - Math.abs(aliasCompact.length - queryCompact.length) * 3,
      matchType: "prefix_alias",
      matchedAlias: alias.alias,
      matchedAliasNormalized: aliasNormalized,
      matchReason: "前缀命中"
    };
  }

  if (aliasCompact.includes(queryCompact) || (queryCompact.length >= 3 && queryCompact.includes(aliasCompact))) {
    return {
      entry,
      score: 250 + alias.weight + entry.searchPriority - Math.abs(aliasCompact.length - queryCompact.length) * 2,
      matchType: "contains_alias",
      matchedAlias: alias.alias,
      matchedAliasNormalized: aliasNormalized,
      matchReason: "相关包含命中"
    };
  }

  const fuzzy = fuzzyScore(queryNormalized, alias.alias);
  if (fuzzy >= 46) {
    return {
      entry,
      score: 120 + fuzzy + alias.weight * 0.6 + entry.searchPriority * 0.3,
      matchType: "fuzzy_alias",
      matchedAlias: alias.alias,
      matchedAliasNormalized: aliasNormalized,
      matchReason: "猜你想找"
    };
  }

  return null;
}

function scoreEntries(entries: SearchEntry[], queryRaw: string) {
  const queryNormalized = normalizeOccupationQuery(queryRaw);
  const queryCompact = compactOccupationQuery(queryRaw);
  if (!queryNormalized || !queryCompact) return [];

  return dedupeByOccupation(
    entries.flatMap((entry) => {
      const best = entry.aliases.reduce<ScoredEntry | null>((currentBest, alias) => {
        const next = scoreAliasMatch(queryNormalized, queryCompact, alias, entry);
        if (!next) return currentBest;
        return !currentBest || next.score > currentBest.score ? next : currentBest;
      }, null);
      return best ? [best] : [];
    })
  );
}

function categoryFallback(entries: SearchEntry[], queryRaw: string) {
  const queryNormalized = normalizeOccupationQuery(queryRaw);
  if (!queryNormalized) return [];

  const matchedFallback = CATEGORY_FALLBACKS.find((fallback) =>
    fallback.keywords.some((keyword) => queryNormalized.includes(normalizeOccupationQuery(keyword)))
  );

  if (!matchedFallback) return [];

  return matchedFallback.entryIds
    .map((id) => entries.find((entry) => entry.id === id))
    .filter((entry): entry is SearchEntry => Boolean(entry))
    .map((entry, index) => ({
      entry,
      score: 96 - index * 4 + entry.searchPriority * 0.1,
      matchType: "category_fallback" as const,
      matchedAlias: matchedFallback.label,
      matchedAliasNormalized: normalizeOccupationQuery(matchedFallback.label),
      matchReason: matchedFallback.label
    }));
}

function popularHits(entries: SearchEntry[]) {
  return entries.map((entry, index) =>
    toHit(
      {
        entry,
        score: 90 - index * 2 + entry.searchPriority * 0.1,
        matchType: "category_fallback",
        matchedAlias: entry.label,
        matchedAliasNormalized: normalizeOccupationQuery(entry.label),
        matchReason: "热门搜索"
      },
      ""
    )
  );
}

export function searchOccupationsByQuery(rows: OccupationRow[], queryRaw: string): OccupationSearchPayload {
  const { entries, popularEntries } = buildEntries(rows);
  const normalizedQuery = normalizeOccupationQuery(queryRaw);
  const popularSearches = popularHits(popularEntries);

  if (!normalizedQuery) {
    return {
      queryRaw,
      queryNormalized: "",
      matchType: "no_result",
      exactHit: false,
      primaryResult: null,
      alternatives: [],
      suggestions: popularSearches.slice(0, 8),
      popularSearches,
      resultCount: 0,
      feedbackHint: "可以先试试热门职业入口"
    };
  }

  const scoredEntries = scoreEntries(entries, queryRaw);
  const matchedEntries = scoredEntries.length ? scoredEntries : categoryFallback(entries, queryRaw);
  const fallbackType = scoredEntries.length ? scoredEntries[0].matchType : (matchedEntries.length ? "category_fallback" : "no_result");
  const hits = matchedEntries.map((entry) => toHit(entry, normalizedQuery));

  if (!hits.length) {
    return {
      queryRaw,
      queryNormalized: normalizedQuery,
      matchType: "no_result",
      exactHit: false,
      primaryResult: null,
      alternatives: [],
      suggestions: popularSearches.slice(0, 8),
      popularSearches,
      resultCount: 0,
      feedbackHint: "没找到直接结果，可以先看看热门职业或继续补充关键词"
    };
  }

  const primaryResult = hits[0] || null;
  const curatedAlternatives = primaryResult ? relatedAlternatives(entries, primaryResult, normalizedQuery) : [];
  const categoryAlternatives = fallbackAlternatives(entries, queryRaw, normalizedQuery);
  const alternatives = dedupeHitsByLabel([...categoryAlternatives, ...curatedAlternatives, ...(hits.slice(1, 5) || [])])
    .filter((entry) => entry.id !== primaryResult?.id || entry.label !== primaryResult?.label)
    .slice(0, 4);
  const suggestions = dedupeHitsByLabel([...(primaryResult ? [primaryResult] : []), ...alternatives, ...hits.slice(1, 8)])
    .slice(0, 8);

  return {
    queryRaw,
    queryNormalized: normalizedQuery,
    matchType: fallbackType,
    exactHit: fallbackType === "exact_alias",
    primaryResult,
    alternatives,
    suggestions,
    popularSearches,
    resultCount: suggestions.length
  };
}

export function getOccupationSuggestions(rows: OccupationRow[], queryRaw: string, limit = 8) {
  const payload = searchOccupationsByQuery(rows, queryRaw);
  return (payload.suggestions.length ? payload.suggestions : payload.popularSearches).slice(0, limit);
}
