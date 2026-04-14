import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "output");
const PROPOSAL_CSV = path.join(ROOT, "output", "china_occupation_first50_proposal.csv");

const PRIORITY_RANK = { P0: 0, P1: 1, P2: 2 };
const CORE_MODULES = "顶部职业标题区、职业一句话定义、与 AIRS 主职业关系说明、为什么单独展示、AIRS 风险分析承接区、中国语境补充说明、搜索别名区、分享文案区、相关推荐职业区。";

const TRACK_CONFIG = {
  平台经济: {
    pageGoal: "让用户快速知道这不是传统营销、物流或酒店岗位的简单改名，而是中国平台化经营场景下的独立职业。",
    targetUsers: "直接搜索该岗位的求职者；正在招该岗位的商家、品牌或平台团队；想理解平台新职业的普通用户",
    chinaContext: "在中国平台经营、即时履约和商家运营语境下，这类职业通常直接以中文岗位名出现在招聘、培训和内容传播中，用户不会先从英文 AIRS 主职业开始理解它。",
  },
  "AI/数据新职业": {
    pageGoal: "让用户知道该职业不是泛软件、泛测试或泛数据岗位，而是中国企业数字化和产业落地中已经独立成立的新职业。",
    targetUsers: "搜索该岗位的求职者；数字化项目负责人或招聘方；想理解新技术职业边界的普通用户",
    chinaContext: "在中国企业数字化和产业落地语境中，这类岗位往往强调训练、实施、运维、应用或治理，而不只是纯研发职位，因此更适合以中国职业层单独呈现。",
  },
  "双碳/绿色经济": {
    pageGoal: "让用户知道该职业不是普通合规、环境或工程岗位，而是中国双碳治理和绿色项目推进下形成的独立角色。",
    targetUsers: "双碳岗位求职者；企业能源、ESG 或低碳项目招聘方；关注绿色职业的普通用户",
    chinaContext: "在中国“双碳”政策、碳履约、节能改造和电力市场化语境下，这类职业通常绑定明确项目流程和治理目标，不能简单压缩到传统环境岗位。",
  },
  "BIM/数字建造": {
    pageGoal: "让用户知道该职业不是传统制图、安装或泛设计岗位，而是中国数字建造场景中的独立职业。",
    targetUsers: "建筑数字化从业者；设计院、施工单位或咨询公司招聘方；想理解数字建造岗位的普通用户",
    chinaContext: "在中国建筑项目管理中，这类职业通常围绕模型协同、专项设计、装配式施工和交付标准展开，中文职业名本身就具有稳定行业认知。",
  },
  健康照护: {
    pageGoal: "让用户快速理解该职业服务对象、工作边界和一般医疗或护理岗位不同，适合独立建卡。",
    targetUsers: "相关服务求职者；家庭、机构或项目服务采购方；想理解照护岗位边界的普通用户",
    chinaContext: "在中国医疗和照护服务体系里，这类职业通常绑定特定人群、评估流程、咨询链路或辅具服务场景，用户搜索时更依赖中文职业名。",
  },
  家庭服务: {
    pageGoal: "让用户知道该职业面向明确的家庭或关系服务场景，不应被并入泛咨询或一般个人服务。",
    targetUsers: "相关服务提供者或求职者；家长与家庭服务使用者；社区、学校或机构服务管理者",
    chinaContext: "在中国家庭服务和社区服务语境下，这类职业通常直接以中文名称被搜索、购买和传播，用户认知高度依赖本土表达。",
  },
  数字农业: {
    pageGoal: "让用户知道该职业不是传统农技岗位的简单改名，而是中国智慧农业实施中的独立角色。",
    targetUsers: "农业数字化从业者；农服机构或项目招聘方；关注智慧农业职业的用户",
    chinaContext: "在中国智慧农业和农服体系里，这类职业通常连接传感设备、平台数据和农事执行，是典型的本土化新职业表达。",
  },
  产业运营: {
    pageGoal: "让用户知道该职业覆盖跨环节协同或工程实施，不是传统物流或工业工程的泛化表述。",
    targetUsers: "供应链或运营求职者；制造、零售和平台企业招聘方；想理解产业运营岗位的用户",
    chinaContext: "在中国供应网络和制造零售协同场景中，这类职业常直接以“供应链”命名，强调跨采购、计划、仓储和履约的整合能力。",
  },
  中国新职业: {
    pageGoal: "让用户知道该职业已经形成稳定中文认知，不应被旧有职业词替代。",
    targetUsers: "新消费服务求职者；门店或品牌招聘方；想理解中文新职业表达的普通用户",
    chinaContext: "在中国新消费与连锁品牌体系里，这类职业通常直接以中文岗位名出现，若退回旧有职业命名，会明显影响用户理解和搜索命中。",
  },
};

const P0_LAUNCH_ORDER = [
  "跨境电商运营管理师",
  "用户增长运营师",
  "网约配送员",
  "BIM技术员",
  "碳排放管理员",
  "人工智能训练师",
  "生成式AI应用员",
  "信息安全测试员",
  "民宿管家",
  "供应链管理师",
  "数字孪生应用技术员",
  "碳汇计量评估师",
  "家庭教育指导师",
  "老年人能力评估师",
  "出生缺陷防控咨询师",
  "康复辅助技术咨询师",
  "农业数字化技术员",
  "区块链应用操作员",
];

function parseCsv(text) {
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

  const [headerRow, ...dataRows] = rows;
  const header = headerRow.map((value, index) => (index === 0 ? value.replace(/^\uFEFF/, "") : value));
  return dataRows
    .filter((values) => values.some((value) => value !== ""))
    .map((values) => Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""])));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function cleanParentTitle(row) {
  if (!row.recommended_parent_airs_title) {
    return "暂无稳妥的 AIRS 主职业";
  }
  return row.recommended_parent_airs_title.split(" / ")[0] || row.recommended_parent_airs_title;
}

function parentDisplay(row) {
  if (!row.recommended_parent_soc_code) {
    return "暂无稳妥的 AIRS 主职业";
  }
  return `${cleanParentTitle(row)}（${row.recommended_parent_soc_code}）`;
}

function parseAliases(value) {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function getTrackConfig(track) {
  return TRACK_CONFIG[track] ?? {
    pageGoal: "让用户快速理解这个中国职业主要做什么，以及为什么它应在中国职业层单独呈现。",
    targetUsers: "搜索该岗位的求职者；招聘方；想理解职业差异的普通用户",
    chinaContext: "该职业在中国招聘和搜索语境中已经形成独立认知，因此更适合用中国职业层承接。",
  };
}

function buildRelation(row) {
  if (!row.recommended_parent_soc_code) {
    return "当前没有足够稳妥的 AIRS 主职业可直接挂靠，页面应明确它是一张中国职业层独立卡片，暂不做强行映射。";
  }
  return `当前推荐挂靠 AIRS 主职业为${parentDisplay(row)}，用于帮助用户理解能力邻近关系和后续跳转；这不代表 AIRS 已完整覆盖该中国职业。`;
}

function buildWhySeparate(row) {
  return `${row.reason}${row.why_not_merged}`;
}

function buildRiskNote(row) {
  if (!row.recommended_parent_soc_code) {
    return "页面不要暗示 AIRS 已有稳定对应职业。需明确这是一张中国职业层独立卡片，当前只是先建立中国语境入口，后续再视补库情况决定是否新增挂靠。";
  }
  return `页面不要把该职业写成 AIRS 已独立覆盖的职业；推荐挂靠 ${parentDisplay(row)} 仅用于关系说明和跳转，不代表两者职责等同。搜索结果、相关推荐和分享文案都不要直接用父职业替代。`;
}

function buildPageGoal(row) {
  const cfg = getTrackConfig(row.track);
  return `让搜索“${row.cn_title_display}”的用户在 10 秒内知道它主要做什么、为什么应单独展示，以及它与 ${cleanParentTitle(row)} 的关系。${cfg.pageGoal}`;
}

function buildTargetUsers(row) {
  return getTrackConfig(row.track).targetUsers;
}

function buildChinaContext(row) {
  return getTrackConfig(row.track).chinaContext;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function buildSeoTitle(row) {
  return `${row.cn_title_display}是什么职业？工作内容、别名与 AIRS 关系 | AIRS 中国职业层`;
}

function extractContext(row) {
  const match = row.intro_short.match(/主要活跃在(.+?)，负责/);
  return match ? match[1] : "相关行业场景";
}

function extractTask(row) {
  const match = row.intro_short.match(/负责(.+?)等工作/);
  return match ? match[1] : "核心工作内容";
}

function buildSeoDescription(row) {
  const parent = row.recommended_parent_soc_code ? cleanParentTitle(row) : "现有 AIRS 泛职业";
  return `${row.cn_title_display}主要面向${extractContext(row)}，核心涉及${extractTask(row)}。本页解释它为什么不能简单并入${parent}，并提供别名、关系说明和相关推荐。`;
}

function buildShareTitle(row) {
  return `${row.cn_title_display}是什么职业？为什么要单独展示`;
}

function chooseRelatedRows(rows, current) {
  const byTrack = rows.filter((row) => row.track === current.track && row.cn_code !== current.cn_code);
  const byPriority = rows.filter((row) => row.priority === current.priority && row.cn_code !== current.cn_code);
  const pool = [...byTrack, ...byPriority, ...rows.filter((row) => row.cn_code !== current.cn_code)];
  const unique = [];
  const seen = new Set();
  for (const row of pool) {
    if (!seen.has(row.cn_code)) {
      seen.add(row.cn_code);
      unique.push(row);
    }
    if (unique.length === 3) {
      break;
    }
  }
  return unique;
}

function buildPrdMarkdown(rows) {
  const lines = [
    "# AIRS 中国职业层首批建卡 PRD 草稿",
    "",
    "## 文档目标",
    "- 本稿基于 `china_occupation_first50_proposal.csv` 生成，供产品、前端、内容三方直接对齐首批 50 张中国职业独立卡片。",
    "- 本批 50 个职业全部按 `独立建卡` 处理，不走 merged 跳转页。",
    "- 页面统一使用中国职业层卡片结构，并保留与 AIRS 主职业的关系说明。",
    "",
    "## 范围说明",
    `- 职业总数：${rows.length}`,
    `- P0：${rows.filter((row) => row.priority === "P0").length}`,
    `- P1：${rows.filter((row) => row.priority === "P1").length}`,
    `- P2：${rows.filter((row) => row.priority === "P2").length}`,
    "- 页面统一包含 9 个固定模块：顶部职业标题区、职业一句话定义、与 AIRS 主职业关系说明、为什么单独展示、AIRS 风险分析承接区、中国语境补充说明、搜索别名区、分享文案区、相关推荐职业区。",
    "",
    "## 通用产品判断",
    "- 搜索中国职业名时，优先命中中国职业层卡片。",
    "- 卡片标题使用 `cn_title_display`，副标题使用 `en_title_recommended`。",
    "- `recommended_parent_soc_code` 和 `recommended_parent_airs_title` 仅用于建立关系说明，不代表 AIRS 已完全覆盖。",
    "",
  ];

  rows.forEach((row, index) => {
    const aliases = parseAliases(row.search_aliases).join("、");
    const related = chooseRelatedRows(rows, row).map((item) => item.cn_title_display).join("、");
    lines.push(`## ${String(index + 1).padStart(2, "0")}. ${row.cn_title_display}`);
    lines.push("");
    lines.push(`- 职业中文展示名：${row.cn_title_display}`);
    lines.push(`- 英文展示名：${row.en_title_recommended}`);
    lines.push(`- 优先级：${row.priority}`);
    lines.push(`- 所属方向：${row.track}`);
    lines.push(`- 是否独立建卡：${row.should_create_independent_card}`);
    lines.push(`- 推荐挂靠 AIRS 主职业：${parentDisplay(row)}`);
    lines.push(`- 职业一句话定义：${row.intro_short}`);
    lines.push(`- 为什么不能简单 merged：${row.why_not_merged}`);
    lines.push(`- 用户搜索时的主要别名：${aliases}`);
    lines.push(`- 页面目标：${buildPageGoal(row)}`);
    lines.push(`- 适合的目标用户：${buildTargetUsers(row)}`);
    lines.push(`- 页面核心信息模块：${CORE_MODULES}`);
    lines.push(`- 与 AIRS 主职业关系说明：${buildRelation(row)}`);
    lines.push(`- 为什么单独展示：${buildWhySeparate(row)}`);
    lines.push(`- 中国语境补充说明：${buildChinaContext(row)}`);
    lines.push(`- 短文案：${row.intro_short}`);
    lines.push(`- 长文案：${row.intro_long}`);
    lines.push(`- 风险提示/边界说明：${buildRiskNote(row)}`);
    lines.push(`- 相关推荐职业建议：${related}`);
    lines.push("");
  });

  return `${lines.join("\n").trim()}\n`;
}

function buildP0Markdown(rows) {
  const p0Rows = P0_LAUNCH_ORDER.map((title, index) => {
    const row = rows.find((item) => item.cn_title_display === title);
    if (!row) {
      throw new Error(`P0 职业未找到：${title}`);
    }
    return { ...row, launch_order: index + 1 };
  });

  const lines = [
    "# AIRS 中国职业层首发 P0 上线清单",
    "",
    "## 首发原则",
    "- 先上搜索量高、社会认知强、边界最清晰的职业。",
    "- 先覆盖平台经济、AI/数据、双碳和 BIM 等最能体现中国职业层价值的方向。",
    "- 再补健康照护、家庭服务、数字农业等更依赖中国语境解释的职业。",
    "",
    "## 首发顺序建议",
    "",
    "| 顺序 | 职业 | 方向 | 推荐挂靠 AIRS 主职业 | 推荐 URL slug |",
    "| --- | --- | --- | --- | --- |",
  ];

  p0Rows.forEach((row) => {
    const slug = slugify(row.en_title_recommended);
    lines.push(`| ${row.launch_order} | ${row.cn_title_display} | ${row.track} | ${parentDisplay(row)} | ${slug} |`);
  });

  p0Rows.forEach((row) => {
    const slug = slugify(row.en_title_recommended);
    lines.push("", `## ${row.launch_order}. ${row.cn_title_display}`, "");
    lines.push(`- 推荐 URL slug：${slug}`);
    lines.push(`- 推荐页面路径：/china-occupations/${slug}`);
    lines.push(`- 推荐挂靠 AIRS 主职业：${parentDisplay(row)}`);
    lines.push(`- SEO title：${buildSeoTitle(row)}`);
    lines.push(`- SEO description：${buildSeoDescription(row)}`);
    lines.push(`- 分享标题草稿：${buildShareTitle(row)}`);
    lines.push(`- 首发原因：${row.reason}`);
    lines.push("");
  });

  return `${lines.join("\n").trim()}\n`;
}

function buildContentSpecMarkdown(rows) {
  const sample = rows[0];
  return `# AIRS 中国职业卡片内容规范

## 使用目标

- 供内容团队直接按统一模板生产 50 张中国职业卡片。
- 保证不同职业页面文风一致、结构一致、边界一致。
- 确保页面始终强调中国职业语境，而不是把职业写成 AIRS 已原生覆盖。

## 内容来源

- 主数据来源：\`china_occupation_first50_proposal.csv\`
- 页面结构来源：\`china_occupation_search_strategy.md\`
- 基础字段方案来源：\`china_occupation_schema_design.md\`

## 每张卡片必备字段

| 页面字段 | 来源字段 | 建议长度 | 写作要求 |
| --- | --- | --- | --- |
| 职业中文展示名 | \`cn_title_display\` | 2-18 字 | 使用用户最容易搜索的中文表达。 |
| 英文展示名 | \`en_title_recommended\` | 3-80 字符 | 用于副标题、SEO 和分享。 |
| 一句话定义 | \`intro_short\` | 50-80 字 | 说明职业主要出现在哪、负责什么、为什么值得独立展示。 |
| 长文案 | \`intro_long\` | 120-200 字 | 解释工作场景、核心职责、为何不能并入 AIRS 父职业。 |
| AIRS 关系说明 | 由 \`recommended_parent_soc_code\` 和 \`recommended_parent_airs_title\` 生成 | 60-120 字 | 要强调“推荐挂靠”而非“已覆盖”。 |
| 为什么单独展示 | \`reason\` + \`why_not_merged\` | 80-160 字 | 说明独立建卡的产品理由。 |
| 中国语境补充说明 | 由职业方向生成 | 60-120 字 | 强调该职业在中国市场的独立认知和使用场景。 |
| 搜索别名 | \`search_aliases\` | 3-6 个 | 只保留真实搜索可能用到的别名。 |
| 风险提示 | 由页面边界规则生成 | 60-120 字 | 不夸大覆盖度，不误导为 AIRS 已原生支持。 |
| 分享标题 | P0 必填 | 16-32 字 | 用问题式或解释式标题，便于社交传播。 |

## 统一写作规则

- 不用空泛词，如“赋能”“引领”“重塑行业”。
- 不直接说“这个职业就是某个 AIRS 职业”，只能说“推荐挂靠”“能力邻近”“便于理解关系”。
- 不把中国新职业写成政策口号，重点写用户能理解的工作场景和职责。
- 长文案优先讲工作内容、服务对象、行业场景，再讲映射边界。
- 所有页面都要让非技术用户读完后能回答三个问题：
- 这个职业主要做什么。
- 为什么它值得单独展示。
- 它和 AIRS 主职业是什么关系。

## 模块文案规范

### 1. 顶部职业标题区

- 必填：中文展示名、英文展示名、优先级标签、方向标签。
- 中文标题优先用最常见中文词，不强行追求官方全称。
- 若标题已有高认知简称，可在别名区补全，而不是把简称塞进主标题。

### 2. 职业一句话定义

- 直接使用或轻改 \`intro_short\`。
- 第一读感要让用户知道“这个职业主要出现在哪种场景”。

### 3. 与 AIRS 主职业关系说明

- 有推荐父职业时，统一写法：\`当前推荐挂靠 AIRS 主职业为 xxx（SOC），用于帮助用户理解能力邻近关系，不代表 AIRS 已完整覆盖。\`
- 没有稳妥父职业时，统一写法：\`当前暂无稳妥的 AIRS 主职业可直接挂靠，本页先作为中国职业层独立入口。\`

### 4. 为什么单独展示

- 要明确写出“为什么不能简单 merged”。
- 不能只写“因为这是新职业”，必须补上职责差异或用户搜索差异。

### 5. AIRS 风险分析承接区

- 直接承接 \`why_not_merged\` 的判断。
- 语气以解释为主，不批评 AIRS，也不暗示 AIRS 数据错误。

### 6. 中国语境补充说明

- 说明该职业在中国招聘、服务、平台、项目或政策场景中的独立性。
- 这一段必须出现“中国市场”“中国语境”“本土使用场景”之一。

### 7. 搜索别名区

- 默认展示 3-6 个高频别名。
- 别名顺序：主标题同义词优先，其次是行业简称，再次是用户口语词。

### 8. 分享文案区

- P0 页面必须有分享标题。
- 建议句式：\`XXX是什么职业？为什么要单独展示\`。

### 9. 相关推荐职业区

- 默认推荐同方向职业 3 个。
- 若同方向不足 3 个，再补同优先级职业。

## 内容审核清单

- 标题是否用用户最常搜的中文表达。
- 一句话定义是否清楚写出工作场景和职责。
- 是否明确了推荐挂靠 AIRS 主职业，但没有写成“完全等同”。
- 是否解释清楚了为什么不能简单 merged。
- 是否补充了中国语境。
- 别名是否真实、克制、可搜索。
- 风险提示是否能防止前端误导。

## 页面示例

- 示例职业：${sample.cn_title_display}
- 示例一句话定义：${sample.intro_short}
- 示例长文案：${sample.intro_long}
- 示例关系说明：${buildRelation(sample)}
- 示例风险提示：${buildRiskNote(sample)}
`;
}

function buildFrontendModulesSpecMarkdown(rows) {
  const sampleP0 = rows.find((row) => row.priority === "P0");
  return `# AIRS 中国职业卡片前端模块规范

## 适用范围

- 本规范适用于首批 50 张中国职业独立卡片详情页。
- 页面路由建议：\`/china-occupations/:slug\`
- 首批卡片全部使用同一套模块顺序，避免按职业逐张定制。

## 页面数据依赖

前端至少需要以下字段：

- \`cn_code\`
- \`cn_title\`
- \`cn_title_display\`
- \`en_title_recommended\`
- \`priority\`
- \`track\`
- \`recommended_parent_soc_code\`
- \`recommended_parent_airs_title\`
- \`search_aliases\`
- \`intro_short\`
- \`intro_long\`
- \`reason\`
- \`why_not_merged\`

建议后端补充以下派生字段，减少前端拼文案：

- \`relation_explainer\`
- \`china_context_note\`
- \`risk_note\`
- \`share_title\`
- \`related_occupations\`
- \`seo_title\`
- \`seo_description\`

## 页面固定模块顺序

1. 顶部职业标题区
2. 职业一句话定义
3. 与 AIRS 主职业关系说明
4. 为什么单独展示
5. AIRS 风险分析承接区
6. 中国语境补充说明
7. 搜索别名区
8. 分享文案区
9. 相关推荐职业区

## 模块明细

### 1. 顶部职业标题区

- 组件 ID：\`hero\`
- 展示字段：\`cn_title_display\`、\`en_title_recommended\`、\`priority\`、\`track\`
- 交互：若存在推荐挂靠 AIRS 主职业，可在标题区旁显示“相关 AIRS 主职业”按钮。
- 验收：标题区在桌面端首屏完整可见，移动端不换成纯英文标题。

### 2. 职业一句话定义

- 组件 ID：\`one-line-definition\`
- 展示字段：\`intro_short\`
- 交互：无。
- 验收：定义不超过 2 行时默认展开；超过 2 行时仍默认完整展示，不做折叠。

### 3. 与 AIRS 主职业关系说明

- 组件 ID：\`airs-relation\`
- 展示字段：\`recommended_parent_soc_code\`、\`recommended_parent_airs_title\`
- 交互：若存在父职业，可跳转对应 AIRS 主职业页。
- 空态：无父职业时显示“当前暂无稳妥的 AIRS 主职业可直接挂靠”。
- 验收：文案必须明确“推荐挂靠不等于完整覆盖”。

### 4. 为什么单独展示

- 组件 ID：\`why-independent\`
- 展示字段：\`reason\`
- 交互：无。
- 验收：该模块必须在首屏后立即可见，不能被放到页面底部。

### 5. AIRS 风险分析承接区

- 组件 ID：\`risk-handoff\`
- 展示字段：\`why_not_merged\`
- 交互：无。
- 验收：需和“为什么单独展示”分开显示，避免两段文案混成一段。

### 6. 中国语境补充说明

- 组件 ID：\`china-context\`
- 展示字段：后端派生的 \`china_context_note\`
- 交互：无。
- 验收：文案必须明确该职业在中国语境下的独立性。

### 7. 搜索别名区

- 组件 ID：\`aliases\`
- 展示字段：\`search_aliases\`
- 交互：点击别名可触发站内搜索或页面内跳转。
- 验收：默认展示 3-6 个别名；过多时折叠，不影响首屏。

### 8. 分享文案区

- 组件 ID：\`share\`
- 展示字段：\`share_title\`
- 交互：复制链接、复制标题、系统分享。
- 验收：P0 页面必须有分享标题；P1/P2 页面可先只提供复制链接。

### 9. 相关推荐职业区

- 组件 ID：\`related\`
- 展示字段：\`related_occupations\`
- 交互：点击跳转其他中国职业卡片。
- 验收：默认展示 3 个推荐职业；优先同方向，再补同优先级。

## 页面状态规则

### 有推荐父职业

- 展示“相关 AIRS 主职业”卡片。
- 按钮文案建议：\`查看相关 AIRS 主职业\`

### 无推荐父职业

- 不展示空白按钮。
- 关系模块直接说明“当前暂无稳妥挂靠对象”。

### P0 页面

- 必须补齐分享标题、SEO title、SEO description。
- 搜索结果页应优先曝光。

### 移动端

- 模块顺序不变。
- 标题区标签可以换行，但中文主标题必须保持优先可见。

## 推荐埋点

- \`china_card_view\`
- \`china_card_parent_click\`
- \`china_card_alias_click\`
- \`china_card_share_click\`
- \`china_card_related_click\`

## 开发验收示例

- 示例页面：${sampleP0.cn_title_display}
- 示例推荐父职业：${parentDisplay(sampleP0)}
- 示例关系说明：${buildRelation(sampleP0)}
- 示例风险说明：${sampleP0.why_not_merged}
`;
}

function main() {
  ensureDir(OUTPUT_DIR);
  const rows = parseCsv(fs.readFileSync(PROPOSAL_CSV, "utf8"))
    .map((row) => ({
      ...row,
      sort_key: PRIORITY_RANK[row.priority] ?? 9,
    }))
    .sort((a, b) => a.sort_key - b.sort_key || a.cn_code.localeCompare(b.cn_code, "zh-CN"));

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "china_occupation_first50_prd.md"),
    buildPrdMarkdown(rows),
    "utf8",
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "china_occupation_p0_launch_list.md"),
    buildP0Markdown(rows),
    "utf8",
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "china_occupation_card_content_spec.md"),
    buildContentSpecMarkdown(rows),
    "utf8",
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "china_occupation_frontend_modules_spec.md"),
    buildFrontendModulesSpecMarkdown(rows),
    "utf8",
  );

  console.log(`Generated PRD docs for ${rows.length} China occupations.`);
}

main();
