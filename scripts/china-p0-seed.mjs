import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "output");
const P0_LIST_PATH = path.join(OUTPUT_DIR, "china_occupation_p0_launch_list.md");
const PROPOSAL_CSV_PATH = path.join(OUTPUT_DIR, "china_occupation_first50_proposal.csv");
const CREATED_AT = "2026-04-14T00:00:00+08:00";
const UPDATED_AT = "2026-04-14T00:00:00+08:00";

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function splitCsvRows(text) {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(current);
      current = "";
    } else if (ch === "\n") {
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    } else if (ch !== "\r") {
      current += ch;
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows;
}

function parseCsv(text) {
  const rows = splitCsvRows(text);
  const [headerRow, ...dataRows] = rows;
  const header = headerRow.map((value, index) => (index === 0 ? value.replace(/^\uFEFF/, "") : value));
  return dataRows
    .filter((values) => values.some((value) => value !== ""))
    .map((values) => Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""])));
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function writeCsv(filePath, rows, columns) {
  const lines = [columns.join(",")];
  rows.forEach((row) => {
    lines.push(columns.map((column) => csvEscape(row[column] ?? "")).join(","));
  });
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

function parseP0LaunchList(text) {
  const tableRows = text
    .split(/\r?\n/)
    .filter((line) => /^\|\s*\d+\s*\|/.test(line))
    .map((line) => line.split("|").slice(1, -1).map((item) => item.trim()))
    .map(([order, title, direction, parent, slug]) => ({
      order: Number(order),
      title,
      direction,
      parent,
      slug,
    }));

  const detailMap = new Map();
  const sections = text.split(/^##\s+\d+\.\s+/m).slice(1);
  const titles = [...text.matchAll(/^##\s+\d+\.\s+(.+)$/gm)].map((match) => match[1].trim());

  sections.forEach((section, index) => {
    const title = titles[index];
    const read = (label) => {
      const match = section.match(new RegExp(`- ${label}：(.+)`));
      return match ? match[1].trim() : "";
    };
    detailMap.set(title, {
      slug: read("推荐 URL slug"),
      pagePath: read("推荐页面路径"),
      mappedAirsDisplay: read("推荐挂靠 AIRS 主职业"),
      seoTitle: read("SEO title"),
      seoDescription: read("SEO description"),
      shareTitle: read("分享标题草稿"),
      launchReason: read("首发原因"),
    });
  });

  return tableRows.map((row) => ({
    ...row,
    ...(detailMap.get(row.title) ?? {}),
  }));
}

function parseAliases(value) {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function cleanParentTitle(value) {
  if (!value) {
    return "";
  }
  return value.split(" / ")[0].trim();
}

function buildRelationExplainer(record) {
  if (!record.mapped_soc_code || !record.mapped_airs_title) {
    return "当前暂无稳妥的 AIRS 主职业可直接挂靠，本页先作为中国职业层独立入口，便于前端和内容团队先完成中国语境展示。";
  }
  return `当前推荐挂靠 AIRS 主职业为${record.mapped_airs_title}（${record.mapped_soc_code}），用于帮助用户理解能力邻近关系和后续跳转，不代表 AIRS 已完整覆盖该中国职业。`;
}

function buildRiskNote(record) {
  if (!record.mapped_soc_code || !record.mapped_airs_title) {
    return "当前没有稳妥的 AIRS 父职业可直接承接该岗位，页面不要补写臆测的父职业，也不要用通用职业替代中国职业卡片。";
  }
  return `页面不要把该职业写成 AIRS 已独立覆盖的职业；推荐挂靠 ${record.mapped_airs_title}（${record.mapped_soc_code}）仅用于关系说明和跳转，不代表两者职责等同。`;
}

function chooseRelated(records, current) {
  const sameDirection = records.filter(
    (record) => record.direction === current.direction && record.slug !== current.slug,
  );
  const rest = records.filter((record) => record.slug !== current.slug && record.direction !== current.direction);
  const result = [];
  const seen = new Set();

  [...sameDirection, ...rest].forEach((record) => {
    if (!seen.has(record.slug) && result.length < 3) {
      seen.add(record.slug);
      result.push(record.slug);
    }
  });

  return result;
}

function assertLength(title, fieldName, value, min, max) {
  const length = value.length;
  if (length < min || length > max) {
    throw new Error(`${title} 的 ${fieldName} 长度为 ${length}，不在 ${min}-${max} 范围内。`);
  }
}

function buildSeedRecords() {
  const proposalRows = parseCsv(fs.readFileSync(PROPOSAL_CSV_PATH, "utf8"));
  const p0Items = parseP0LaunchList(fs.readFileSync(P0_LIST_PATH, "utf8"));
  const proposalByDisplay = new Map(proposalRows.map((row) => [row.cn_title_display, row]));

  if (p0Items.length !== 18) {
    throw new Error(`P0 职业数量应为 18，当前为 ${p0Items.length}`);
  }

  const records = p0Items.map((item, index) => {
    const proposal = proposalByDisplay.get(item.title);
    if (!proposal) {
      throw new Error(`未在 proposal 中找到 P0 职业：${item.title}`);
    }

    const aliases = parseAliases(proposal.search_aliases);
    if (aliases.length < 3 || aliases.length > 6) {
      throw new Error(`${item.title} 的 aliases_json 数量为 ${aliases.length}，不在 3-6 范围内。`);
    }

    assertLength(item.title, "intro_short", proposal.intro_short, 50, 80);
    assertLength(item.title, "intro_long", proposal.intro_long, 120, 200);

    return {
      id: String(100001 + index),
      cn_code: proposal.cn_code || "",
      cn_title: proposal.cn_title,
      cn_title_display: proposal.cn_title_display,
      en_title: proposal.en_title_recommended,
      slug: item.slug || "",
      page_path: item.pagePath || `/china-occupations/${item.slug}`,
      aliases_json: aliases,
      mapped_soc_code: proposal.recommended_parent_soc_code || "",
      mapped_airs_title: cleanParentTitle(proposal.recommended_parent_airs_title),
      mapping_type: "independent_card",
      independent_card_flag: true,
      priority: "P0",
      status: "ready",
      direction: proposal.track,
      intro_short: proposal.intro_short,
      intro_long: proposal.intro_long,
      why_not_merged: proposal.why_not_merged,
      relation_explainer: "",
      risk_note: "",
      seo_title: item.seoTitle || "",
      seo_description: item.seoDescription || "",
      share_title: item.shareTitle || "",
      share_description: proposal.intro_short,
      recommended_related_slugs: [],
      created_at: CREATED_AT,
      updated_at: UPDATED_AT,
    };
  });

  records.forEach((record) => {
    record.relation_explainer = buildRelationExplainer(record);
    record.risk_note = buildRiskNote(record);
  });

  records.forEach((record) => {
    record.recommended_related_slugs = chooseRelated(records, record);
  });

  records.forEach((record) => {
    if (!record.slug) {
      throw new Error(`${record.cn_title_display} 缺少 slug`);
    }
    if (!record.seo_title || !record.seo_description || !record.share_title) {
      throw new Error(`${record.cn_title_display} 缺少 SEO 或分享字段`);
    }
    if (record.recommended_related_slugs.length !== 3) {
      throw new Error(`${record.cn_title_display} 的 recommended_related_slugs 数量不是 3`);
    }
  });

  return records;
}

function buildSeedReadme(records, columns) {
  const firstScreenFields = [
    "slug",
    "cn_title_display",
    "en_title",
    "priority",
    "direction",
    "intro_short",
    "mapped_soc_code",
    "mapped_airs_title",
    "relation_explainer",
    "why_not_merged",
  ];

  return `# P0 中国职业种子数据说明

## 文件说明

- \`china_occupation_p0_seed.json\`：P0 18 个职业的联调样例数据，适合后端导入、前端 mock 和内容校对。
- \`china_occupation_p0_seed.csv\`：与 JSON 同字段顺序的平铺导入模板，适合表格校对和批量导入。
- 当前记录数：${records.length}

## 空值策略

- 标量字段统一使用空字符串 \`""\` 作为空值。
- 数组字段统一使用空数组 \`[]\` 作为空值。
- 不使用 \`null\`、\`-\`、\`暂无\` 作为导入层空值。
- 当前这批数据里，\`mapped_soc_code\` 和 \`mapped_airs_title\` 只有“老年人能力评估师”使用空字符串，表示暂无稳妥的 AIRS 父职业。

## 前端直接展示字段

- \`cn_title_display\`
- \`en_title\`
- \`priority\`
- \`direction\`
- \`intro_short\`
- \`intro_long\`
- \`mapped_soc_code\`
- \`mapped_airs_title\`
- \`relation_explainer\`
- \`why_not_merged\`
- \`share_title\`
- \`recommended_related_slugs\`

## 只用于搜索 / SEO / 分享的字段

- \`aliases_json\`
- \`slug\`
- \`page_path\`
- \`seo_title\`
- \`seo_description\`
- \`share_description\`

## 后续仍需人工补充或复核的字段

- \`mapped_soc_code\` 和 \`mapped_airs_title\`：后续若 AIRS 新增更贴切父职业，需要人工复核。
- \`recommended_related_slugs\`：当前为联调用示例，正式上线前可结合产品策略再微调。
- \`share_description\`：当前直接复用 \`intro_short\`，后续若接分享卡片样式，可人工精修。
- \`status\`：当前统一给到 \`ready\`，正式上线前可切成 \`online\`。

## JSON 与 CSV 的类型约定

- JSON 中的 \`aliases_json\` 和 \`recommended_related_slugs\` 是数组。
- CSV 中的 \`aliases_json\` 和 \`recommended_related_slugs\` 使用 JSON 字符串写入，字段名与 JSON 保持一致。
- 其他字段在 JSON 和 CSV 中保持同名同义。

## 最小可联调字段集

前端详情页首屏真正必需的字段如下：

${firstScreenFields.map((field) => `- \`${field}\``).join("\n")}

## 导入顺序建议

1. 后端先导入 JSON 或 CSV 中的基础字段。
2. 前端先用 \`slug\`、\`cn_title_display\`、\`intro_short\`、\`relation_explainer\` 联调首屏。
3. 内容团队再校对 \`intro_long\`、\`why_not_merged\`、\`seo_title\`、\`share_title\`。
4. 联调通过后，再把 \`status\` 从 \`ready\` 切为 \`online\`。

## 字段顺序

CSV 与 JSON 的字段顺序建议按以下列固定，不要在后续扩批时随意变动：

${columns.map((column) => `- \`${column}\``).join("\n")}
`;
}

function buildFieldRules() {
  return `# P0 中国职业种子数据字段填写规则

## 一般规则

- 文件编码统一为 UTF-8。
- 标量空值统一写 \`""\`，数组空值统一写 \`[]\`。
- 时间字段统一用 ISO 8601 格式，并带时区，例如 \`2026-04-14T00:00:00+08:00\`。
- 不在导入模板里使用 \`null\`、\`-\`、\`N/A\`、\`暂无\`。
- JSON 和 CSV 使用同一套字段名；CSV 中的数组字段写成 JSON 字符串。

## 字段逐项规则

| 字段 | 规则 | 示例 |
| --- | --- | --- |
| id | 必须唯一；建议使用 bigint 风格数值字符串，便于和数据库主键对齐。 | 100001 |
| cn_code | 有官方代码则填写；确实没有时填 \`""\`。 | 4-01-06-03 |
| cn_title | 填官方或原始中文职业名，不用简称替代。 | 建筑信息模型技术员 |
| cn_title_display | 填页面主标题；允许使用行业高频简称。 | BIM技术员 |
| en_title | 使用稳定、可读的英文展示名，首字母大写。 | BIM Technician |
| slug | 使用小写 kebab-case；一经上线不应频繁改动。 | bim-technician |
| page_path | 固定写成 \`/china-occupations/:slug\`。 | /china-occupations/bim-technician |
| aliases_json | 只填真实可搜的中文别名；建议 3-6 个；主名或主标题必须放第一位。 | ["BIM技术员","建筑信息模型师","BIM工程师"] |
| mapped_soc_code | 有稳妥父职业时填写标准 SOC 代码；没有时写 \`""\`。 | 17-3011.00 |
| mapped_airs_title | 只写 AIRS 父职业中文展示名；没有时写 \`""\`。 | 建筑与土木制图员 |
| mapping_type | 仅允许枚举值：\`independent_card\`、\`merged_redirect\`、\`one_to_many_redirect\`、\`exact_linked\`。P0 本批固定填 \`independent_card\`。 | independent_card |
| independent_card_flag | 布尔值；独立建卡填 \`true\`。 | true |
| priority | 枚举值 \`P0/P1/P2\`；本批固定 \`P0\`。 | P0 |
| status | 枚举值建议 \`draft/reviewed/ready/online\`；联调模板统一填 \`ready\`。 | ready |
| direction | 使用受控中文方向值，不自行发明新标签。 | AI/数据新职业 |
| intro_short | 50-80 字；必须写清场景、职责和独立展示理由。 | 略 |
| intro_long | 120-200 字；先写工作场景，再写与 AIRS 父职业的边界。 | 略 |
| why_not_merged | 必须说明为什么不能直接并入现有 AIRS 职业；避免空话。 | 略 |
| relation_explainer | 有父职业时强调“推荐挂靠”；无父职业时明确“暂无稳妥挂靠对象”。 | 略 |
| risk_note | 必须提醒前端和内容不要把 AIRS 父职业写成“已覆盖”。 | 略 |
| seo_title | 建议 26-42 个中文字符；格式尽量统一。 | BIM技术员是什么职业？工作内容、别名与 AIRS 关系 | AIRS 中国职业层 |
| seo_description | 建议 60-120 字；要包含工作内容和“为什么不能简单并入”。 | 略 |
| share_title | 建议 16-32 字；优先问题式。 | BIM技术员是什么职业？为什么要单独展示 |
| share_description | 可直接复用 \`intro_short\`；后续可人工精修。 | 略 |
| recommended_related_slugs | 必须是已存在职业的 slug 数组；默认 3 个；不能包含自己。 | ["digital-twin-application-technician","carbon-emissions-administrator","supply-chain-manager"] |
| created_at | 创建时间，导入时统一。 | 2026-04-14T00:00:00+08:00 |
| updated_at | 更新时间，导入时统一。 | 2026-04-14T00:00:00+08:00 |

## 别名填写规则

- 优先顺序：页面主标题同义词 > 行业高频简称 > 用户口语词。
- 不要为了凑数加入泛词，如“工程师”“顾问”“运营”。
- 不要加入与其他职业冲突明显的宽泛词。
- 中文职业优先填中文别名，不主动塞英文缩写，除非用户真实会这样搜，如 \`BIM\`、\`AI\`。

## 文案填写规则

- 不使用“赋能”“引领”“重塑行业”等空泛表述。
- 不直接说“这个职业就是某个 AIRS 职业”，只能说“推荐挂靠”“能力邻近”“便于理解关系”。
- \`intro_short\` 要适合首屏直接展示。
- \`intro_long\` 要适合详情页正文直接展示。
- \`why_not_merged\`、\`relation_explainer\`、\`risk_note\` 三段不要互相复制粘贴，应各自承担不同说明职责。

## 最小可联调字段集

前端详情页首屏真正必需的字段：

- \`slug\`
- \`cn_title_display\`
- \`en_title\`
- \`priority\`
- \`direction\`
- \`intro_short\`
- \`mapped_soc_code\`
- \`mapped_airs_title\`
- \`relation_explainer\`
- \`why_not_merged\`

## 扩批时的注意事项

- 扩到 P1/P2 时，字段名和空值策略保持不变。
- 如果出现 \`merged_redirect\` 或 \`one_to_many_redirect\`，仍沿用同一字段集，只调整 \`mapping_type\`、\`independent_card_flag\` 和映射说明字段。
- 新批次如果缺少 \`cn_code\` 或稳妥父职业，必须统一写空值，不允许临时发明占位词。
`;
}

function main() {
  ensureDir(OUTPUT_DIR);
  const records = buildSeedRecords();

  const columns = [
    "id",
    "cn_code",
    "cn_title",
    "cn_title_display",
    "en_title",
    "slug",
    "page_path",
    "aliases_json",
    "mapped_soc_code",
    "mapped_airs_title",
    "mapping_type",
    "independent_card_flag",
    "priority",
    "status",
    "direction",
    "intro_short",
    "intro_long",
    "why_not_merged",
    "relation_explainer",
    "risk_note",
    "seo_title",
    "seo_description",
    "share_title",
    "share_description",
    "recommended_related_slugs",
    "created_at",
    "updated_at",
  ];

  const jsonRows = records.map((record) => ({
    ...record,
    aliases_json: record.aliases_json,
    recommended_related_slugs: record.recommended_related_slugs,
  }));

  const csvRows = records.map((record) => ({
    ...record,
    aliases_json: JSON.stringify(record.aliases_json),
    recommended_related_slugs: JSON.stringify(record.recommended_related_slugs),
    independent_card_flag: String(record.independent_card_flag),
  }));

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "china_occupation_p0_seed.json"),
    `${JSON.stringify(jsonRows, null, 2)}\n`,
    "utf8",
  );
  writeCsv(path.join(OUTPUT_DIR, "china_occupation_p0_seed.csv"), csvRows, columns);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "china_occupation_p0_seed_readme.md"),
    buildSeedReadme(records, columns),
    "utf8",
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "china_occupation_p0_field_fill_rules.md"),
    buildFieldRules(),
    "utf8",
  );

  console.log(`Generated seed templates for ${records.length} P0 occupations.`);
}

main();
