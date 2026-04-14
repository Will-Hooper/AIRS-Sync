import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "output");

const INPUTS = [
  path.join(OUTPUT_DIR, "china_occupation_first50_prd.md"),
  path.join(OUTPUT_DIR, "china_occupation_p0_launch_list.md"),
  path.join(OUTPUT_DIR, "china_occupation_card_content_spec.md"),
  path.join(OUTPUT_DIR, "china_occupation_frontend_modules_spec.md"),
  path.join(OUTPUT_DIR, "china_occupation_schema_design.md"),
  path.join(OUTPUT_DIR, "china_occupation_search_strategy.md"),
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function assertInputs() {
  INPUTS.forEach((filePath) => {
    if (!fs.existsSync(filePath)) {
      throw new Error(`缺少输入文件：${filePath}`);
    }
  });
}

function parseMarkdownTableLine(line) {
  return line
    .split("|")
    .slice(1, -1)
    .map((item) => item.trim());
}

function loadP0Rows() {
  const text = fs.readFileSync(path.join(OUTPUT_DIR, "china_occupation_p0_launch_list.md"), "utf8");
  return text
    .split(/\r?\n/)
    .filter((line) => /^\|\s*\d+\s*\|/.test(line))
    .map((line) => {
      const [order, title, track, parent, slug] = parseMarkdownTableLine(line);
      return {
        order: Number(order),
        title,
        track,
        parent,
        slug,
      };
    });
}

function buildDevPlan(p0Rows) {
  const p0Titles = p0Rows.map((row) => row.title).join("、");
  return `# AIRS 中国职业层研发排期版实施文档

## 开发目标

- 本期只上线中国职业层 P0 的 18 张独立职业卡片。
- 让用户搜索 P0 中国职业名或高频别名时，优先命中中国职业层，而不是先掉到 AIRS 主职业。
- 让每张卡片完整展示 9 个固定模块，并保留与 AIRS 主职业的关系说明、SEO 信息和分享能力。
- 为后续 P1/P2、merged_redirect、one_to_many_redirect 预留统一字段和接口，但本期不扩面。

## 本期范围

- 上线范围：P0 18 个职业。
- 职业清单：${p0Titles}。
- 页面类型：仅做 \`independent_card\` 详情页。
- 搜索范围：支持 P0 18 个职业的中文主名和已确认别名命中。
- SEO 范围：P0 18 个职业全部补齐 slug、SEO title、SEO description、分享标题。

## 不做范围

- 不做 P1/P2 32 个职业的上线。
- 不做全量 50 职业搜索接入，只保证 P0 18 个可搜、可跳、可展示。
- 不做后台内容运营系统，内容先用离线导入。
- 不做 merged_redirect 和 one_to_many_redirect 的正式上线页面，只保留接口字段和状态预留。
- 不做推荐职业个性化算法，相关推荐先按固定规则返回。
- 不做 sitemap 自动化、批量埋点分析后台和审核流页面。

## 前端任务拆分

| 任务 | 输出物 | 依赖 | 验收点 |
| --- | --- | --- | --- |
| 新建中国职业路由 | \`/china-occupations/:slug\` 页面路由 | 详情接口、slug 清单 | 18 个 P0 slug 均可打开对应页面 |
| 实现搜索结果卡片 | 中国职业搜索结果 UI | 搜索接口、别名字段 | 命中 P0 主名和别名时，中国职业结果排在 AIRS 主职业前 |
| 实现详情页 9 个模块 | 标题区、定义、关系说明、为什么单独展示、风险区、中国语境、别名、分享、相关推荐 | 详情接口、内容字段 | 9 个模块顺序正确，缺字段时有兜底 |
| 实现状态页 | loading、empty、error、404、相关推荐为空 | 状态机文档 | 所有状态都有清晰页面反馈，不出现白屏 |
| 接入 AIRS 主职业跳转 | 相关 AIRS 主职业按钮 | 详情接口中的 parent 字段 | 有父职业时可跳；无父职业时不显示空按钮 |
| 接入 SEO 与分享 | 页面 title、description、分享标题和分享按钮 | SEO 字段、分享字段 | P0 页面 source 中可见 SEO 元数据，分享区可复制标题和链接 |
| 接入埋点 | 搜索命中、详情曝光、父职业跳转、分享点击、相关推荐点击 | 埋点命名确认 | 埋点名和触发条件与状态机一致 |

## 后端任务拆分

| 任务 | 输出物 | 依赖 | 验收点 |
| --- | --- | --- | --- |
| 建中国职业主表 | \`china_occupations\` 表及索引 | schema 方案 | 表字段覆盖详情、搜索、SEO、分享所需最小集 |
| 补实现字段 | slug、relation_explainer、risk_note、share_title、seo_title 等派生字段 | schema 方案、内容规范 | 前端无需在页面层手拼关键文案 |
| 导入 P0 数据 | 18 条 P0 正式记录 | P0 清单、内容录入结果 | 18 条记录状态为 \`ready\` 或 \`online\`，slug 唯一 |
| 实现搜索接口 | \`GET /api/china-occupations/search\` | 数据导入、搜索别名处理 | 主名与别名可命中，结果带 \`mapping_type\` 和 \`match_type\` |
| 实现详情接口 | \`GET /api/china-occupations/:slug\` | 数据导入 | 18 个 slug 均可返回详情；不存在 slug 返回 404 |
| 实现映射接口 | \`GET /api/china-occupations/:slug/mapping\` | 关系字段 | 能返回 parent、mapping_type、why_not_merged |
| 实现推荐接口 | \`GET /api/china-occupations/:slug/related\` | 同方向和优先级规则 | 默认返回 3 条；空时返回空数组而非报错 |
| 搜索归一化处理 | 去空格、去括号、别名匹配、简称扩展 | 搜索策略文档 | “BIM技术员”“生成式AI应用员”“外卖骑手”等能命中目标职业 |

## 内容录入任务拆分

| 任务 | 输出物 | 依赖 | 验收点 |
| --- | --- | --- | --- |
| 确认 P0 中文展示名 | 18 个页面主标题 | P0 清单 | 页面主标题与 slug、SEO 标题一致 |
| 确认英文展示名 | 18 个页面副标题 | P0 清单 | 页面副标题统一、无重复和明显误译 |
| 确认别名 | 每页 3-6 个高频别名 | PRD、内容规范 | 别名真实可搜，不塞无效同义词 |
| 确认长短文案 | \`intro_short\`、\`intro_long\` | 首批 PRD | 前端可直接展示，无需再裁剪 |
| 确认关系说明与风险说明 | \`relation_explainer\`、\`risk_note\` | PRD、内容规范 | 不把 AIRS 父职业写成“已覆盖” |
| 确认 SEO/分享 | \`seo_title\`、\`seo_description\`、\`share_title\` | P0 清单 | 18 页全部补齐，长度适中，可直接上线 |

## 联调任务

| 任务 | 前置条件 | 联调内容 | 完成标准 |
| --- | --- | --- | --- |
| 搜索联调 | 搜索接口可用 | 校验主名、别名、优先级排序 | P0 搜索结果排在 AIRS 主职业前 |
| 详情联调 | 详情接口可用 | 校验 9 个模块字段映射 | 页面不出现字段名、不出现占位错误 |
| 关系联调 | 映射接口可用 | 校验父职业按钮和关系说明 | 有父职业时可跳；无父职业时展示空态说明 |
| 推荐联调 | 推荐接口可用 | 校验相关推荐数量与跳转 | 默认 3 条；无推荐时页面仍可正常结束 |
| SEO 联调 | slug 和 SEO 字段冻结 | 校验 head 标签、分享文案 | title、description、canonical 与页面路径一致 |

## 验收任务

| 验收项 | 验收方式 | 通过标准 |
| --- | --- | --- |
| 18 个 P0 页面可访问 | 按 slug 清单逐页打开 | 18 页均可打开，无 404、无白屏 |
| 搜索命中正确 | 用主名和别名检索 | 主名和高频别名都优先命中中国职业层 |
| 页面模块完整 | 检查 9 个模块 | 9 个模块都出现，模块顺序固定 |
| 关系说明不误导 | 抽查 18 页 | 页面只写“推荐挂靠”，不写“已覆盖” |
| SEO 可用 | 查看页面 source 与分享预览 | title、description、分享标题可见 |
| 异常态可兜底 | 人工模拟 404、接口失败、相关推荐为空 | 均有明确页面反馈和返回路径 |
| 埋点可触发 | 联调环境检查 | 搜索、点击、分享、相关推荐等关键埋点可见 |

## 风险点

- 搜索别名过少会导致召回差；别名过多又可能误召回 AIRS 其他职业。
- slug 一旦发布就不宜频繁改动，否则会影响 SEO 和分享链接。
- 部分 P0 职业存在推荐父职业，但不代表 AIRS 已覆盖；如果文案写错，会直接误导用户。
- 个别职业暂无稳妥 AIRS 父职业，前端必须正确处理“无父职业”空态。
- 如果内容录入晚于前后端开发，前端容易为了联调临时写死文案，后续替换风险高。

## 依赖关系

- 数据表和字段先于搜索接口、详情接口。
- slug 清单冻结先于前端正式接入、SEO 配置和分享配置。
- 内容文案冻结先于详情页验收。
- 搜索归一化和别名表先于搜索排序验收。
- 关系字段和映射接口先于 AIRS 主职业跳转验收。

## 建议交付顺序

1. 后端先落表、导入 P0、开放搜索和详情接口。
2. 前端并行开发搜索结果和详情页骨架，先接 mock，再切真实接口。
3. 内容团队在接口联调前冻结 18 页的标题、别名、文案、SEO 和分享文案。
4. 联调完成后再做 SEO 和异常态回归，最后上线。
`;
}

function buildApiFieldsDoc(p0Rows) {
  const sampleSlug = p0Rows[0]?.slug ?? "cross-border-e-commerce-operations-manager";
  return `# AIRS 中国职业层 API 与字段文档

## 适用范围

- 本期上线范围仅限 P0 18 个中国职业。
- 字段与接口按最小可上线方案设计，但保留 \`merged_redirect\` 和 \`one_to_many_redirect\` 的扩展口。

## 一、主表字段

表名建议：\`china_occupations\`

| 字段 | 类型建议 | 必填 | 本期是否必须 | 说明 |
| --- | --- | --- | --- | --- |
| id | bigint / uuid | 是 | 是 | 中国职业主键 |
| slug | varchar(128) | 是 | 是 | 页面唯一 slug，用于详情路由 |
| cn_code | varchar(32) | 是 | 是 | 中国职业代码 |
| cn_title | varchar(128) | 是 | 是 | 原始中文名 |
| cn_title_display | varchar(128) | 是 | 是 | 页面主标题 |
| en_title | varchar(256) | 否 | 是 | 页面英文副标题 |
| track | varchar(64) | 是 | 是 | 方向，如平台经济、AI/数据新职业 |
| priority | varchar(8) | 是 | 是 | P0/P1/P2 |
| mapping_type | varchar(32) | 是 | 是 | \`independent_card\`、\`merged_redirect\`、\`one_to_many_redirect\`、\`exact_linked\` |
| independent_card_flag | boolean | 是 | 是 | 是否独立建卡 |
| status | varchar(32) | 是 | 是 | \`draft\`、\`reviewed\`、\`ready\`、\`online\` |
| intro_short | varchar(256) | 否 | 是 | 一句话定义 |
| intro_long | text | 否 | 是 | 长文案 |
| reason | text | 否 | 是 | 为什么单独展示 |
| why_not_merged | text | 否 | 是 | 为什么不能直接 merged |
| created_at | timestamp | 是 | 是 | 创建时间 |
| updated_at | timestamp | 是 | 是 | 更新时间 |

## 二、与 AIRS 主职业关系字段

| 字段 | 类型建议 | 本期是否必须 | 说明 |
| --- | --- | --- | --- |
| mapped_soc_code | varchar(16) | 是 | 推荐挂靠的 SOC 代码；没有稳妥父职业时可为空 |
| mapped_airs_id | bigint | 否 | AIRS 内部主键；若当前没有稳定 ID，可暂空 |
| mapped_airs_title | varchar(256) | 是 | AIRS 父职业展示名 |
| relation_explainer | text | 是 | 页面“与 AIRS 主职业关系说明”模块直接使用 |
| risk_note | text | 是 | 页面“AIRS 风险分析承接区”直接使用 |

## 三、搜索别名字段

| 字段 | 类型建议 | 本期是否必须 | 说明 |
| --- | --- | --- | --- |
| aliases_json | json / jsonb | 是 | 原始别名数组 |
| normalized_aliases_json | json / jsonb | 是 | 归一化后的别名数组，用于搜索 |
| search_boost | integer | 否 | 搜索加权，P0 建议更高 |

## 四、独立建卡字段

| 字段 | 类型建议 | 本期是否必须 | 说明 |
| --- | --- | --- | --- |
| card_type | varchar(32) | 否 | 建议固定为 \`china_occupation\` |
| page_path | varchar(256) | 是 | 页面路径，如 \`/china-occupations/${sampleSlug}\` |
| launch_batch | varchar(32) | 是 | 本期建议写 \`first_p0_18\` |
| launch_order | integer | 是 | 首发顺序 |

## 五、SEO 字段

| 字段 | 类型建议 | 本期是否必须 | 说明 |
| --- | --- | --- | --- |
| seo_title | varchar(256) | 是 | 页面 title |
| seo_description | varchar(512) | 是 | 页面 description |
| canonical_url | varchar(512) | 否 | 若站点已做 canonical，可直接存 |

## 六、分享字段

| 字段 | 类型建议 | 本期是否必须 | 说明 |
| --- | --- | --- | --- |
| share_title | varchar(256) | 是 | 分享标题 |
| share_summary | varchar(512) | 否 | 分享摘要，可先复用 intro_short |
| share_image | varchar(512) | 否 | 若暂无分享图可先为空 |

## 七、状态字段

| 字段 | 类型建议 | 本期是否必须 | 说明 |
| --- | --- | --- | --- |
| status | varchar(32) | 是 | 控制是否可被前台读取 |
| published_at | timestamp | 否 | 上线时间 |
| archived_at | timestamp | 否 | 下线时间 |

## 八、前端实际取数字段最小集

### 搜索接口最小集

- \`id\`
- \`slug\`
- \`cn_title_display\`
- \`en_title\`
- \`track\`
- \`priority\`
- \`mapping_type\`
- \`independent_card_flag\`
- \`intro_short\`
- \`matched_alias\`
- \`match_type\`
- \`mapped_soc_code\`
- \`mapped_airs_title\`

### 详情接口最小集

- \`id\`
- \`slug\`
- \`cn_code\`
- \`cn_title_display\`
- \`en_title\`
- \`track\`
- \`priority\`
- \`mapping_type\`
- \`independent_card_flag\`
- \`intro_short\`
- \`intro_long\`
- \`reason\`
- \`why_not_merged\`
- \`relation_explainer\`
- \`risk_note\`
- \`china_context_note\`
- \`aliases_json\`
- \`mapped_soc_code\`
- \`mapped_airs_title\`
- \`seo_title\`
- \`seo_description\`
- \`share_title\`

## 九、建议接口

### 1. 中国职业搜索接口

- 方法：\`GET /api/china-occupations/search\`
- 作用：按中国职业主名和别名检索；优先返回中国职业层结果。

请求参数：

| 参数 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- |
| q | 是 | BIM技术员 | 原始查询词 |
| limit | 否 | 10 | 返回条数，默认 10 |
| scene | 否 | global_search | 搜索场景，便于后续排序差异化 |
| include_airs_fallback | 否 | true | 无中国职业命中时是否带 AIRS fallback 提示 |

响应字段建议：

\`\`\`json
{
  "query": "BIM技术员",
  "normalizedQuery": "bim技术员",
  "results": [
    {
      "id": "100023",
      "slug": "bim-technician",
      "cnTitleDisplay": "BIM技术员",
      "enTitle": "BIM Technician",
      "track": "BIM/数字建造",
      "priority": "P0",
      "mappingType": "independent_card",
      "independentCardFlag": true,
      "matchType": "alias_exact",
      "matchedAlias": "BIM技术员",
      "introShort": "BIM技术员主要活跃在建筑数字化建模与协同场景……",
      "parent": {
        "socCode": "17-3011.00",
        "title": "建筑与土木制图员"
      },
      "url": "/china-occupations/bim-technician"
    }
  ],
  "fallback": null
}
\`\`\`

### 2. 中国职业详情接口

- 方法：\`GET /api/china-occupations/:slug\`
- 作用：返回独立卡片详情页需要的全部字段。

路径参数：

| 参数 | 必填 | 示例 |
| --- | --- | --- |
| slug | 是 | ${sampleSlug} |

响应字段建议：

\`\`\`json
{
  "id": "100001",
  "slug": "${sampleSlug}",
  "cnCode": "4-01-06-03",
  "cnTitleDisplay": "跨境电商运营管理师",
  "enTitle": "Cross-Border E-Commerce Operations Manager",
  "track": "平台经济",
  "priority": "P0",
  "mappingType": "independent_card",
  "independentCardFlag": true,
  "introShort": "……",
  "introLong": "……",
  "reason": "……",
  "whyNotMerged": "……",
  "relationExplainer": "当前推荐挂靠 AIRS 主职业为……",
  "riskNote": "页面不要把该职业写成 AIRS 已独立覆盖……",
  "chinaContextNote": "在中国平台经营语境下……",
  "aliases": ["跨境电商运营", "跨境运营"],
  "parent": {
    "socCode": "13-1161.00",
    "airsId": null,
    "title": "市场研究分析师与营销专员",
    "url": "/occupations/13-1161-00"
  },
  "seo": {
    "title": "跨境电商运营管理师是什么职业？工作内容、别名与 AIRS 关系 | AIRS 中国职业层",
    "description": "……"
  },
  "share": {
    "title": "跨境电商运营管理师是什么职业？为什么要单独展示"
  }
}
\`\`\`

状态码建议：

- \`200\`：正常返回
- \`404\`：slug 不存在
- \`410\`：记录已下线或归档
- \`500\`：服务异常

### 3. 中国职业与 AIRS 映射接口

- 方法：\`GET /api/china-occupations/:slug/mapping\`
- 作用：单独返回映射关系，便于后续 merged 和 one-to-many 共用。

响应字段建议：

\`\`\`json
{
  "slug": "bim-technician",
  "mappingType": "independent_card",
  "independentCardFlag": true,
  "parent": {
    "socCode": "17-3011.00",
    "title": "建筑与土木制图员"
  },
  "relationExplainer": "当前推荐挂靠 AIRS 主职业为建筑与土木制图员……",
  "whyNotMerged": "如果直接并入 AIRS“建筑与土木制图员”……",
  "relatedAirsTargets": []
}
\`\`\`

### 4. 推荐职业接口

- 方法：\`GET /api/china-occupations/:slug/related\`
- 作用：返回相关推荐职业，优先同方向，再补同优先级。

请求参数：

| 参数 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- |
| limit | 否 | 3 | 默认 3 |

响应字段建议：

\`\`\`json
{
  "slug": "bim-technician",
  "results": [
    {
      "slug": "carbon-emissions-administrator",
      "cnTitleDisplay": "碳排放管理员",
      "priority": "P0",
      "track": "双碳/绿色经济"
    }
  ]
}
\`\`\`

## 十、实现建议

- 搜索接口与详情接口都只返回 \`status in (ready, online)\` 的记录。
- slug 建议直接存库，不在前端临时拼接。
- \`relation_explainer\`、\`risk_note\`、\`china_context_note\` 建议后端预生成，避免前端再拼文案。
- 即使本期只上 P0，也保留 \`mapping_type\` 字段，避免后续 merged 和 one-to-many 再改接口。
`;
}

function buildStateMachineDoc() {
  return `# AIRS 中国职业层页面状态机

## 适用范围

- 本期上线范围只有 P0 18 个独立建卡页面。
- 但状态机必须覆盖未来会出现的 \`merged_redirect\` 和 \`one_to_many_redirect\`，避免后续返工。

## 总体流程

\`\`\`mermaid
stateDiagram-v2
    [*] --> SearchInput
    SearchInput --> SearchIndependentHit: 搜索命中 independent_card
    SearchInput --> SearchMergedHit: 搜索命中 merged_redirect
    SearchInput --> SearchOneToManyHit: 搜索命中 one_to_many_redirect
    SearchInput --> SearchNoResult: 搜索无结果
    SearchIndependentHit --> DetailLoading
    DetailLoading --> DetailReady: 详情接口成功
    DetailLoading --> DetailEmpty: 详情为空
    DetailLoading --> DetailError: 接口异常
    DetailLoading --> SlugNotFound: 404
    DetailReady --> RelatedEmpty: 推荐职业为空
    SearchMergedHit --> MergedExplain
    SearchOneToManyHit --> OneToManyExplain
\`\`\`

## 状态说明

| 状态 | 触发条件 | 页面表现 | 回退策略 | 埋点建议 |
| --- | --- | --- | --- | --- |
| 搜索命中独立建卡 | 搜索接口返回 \`mapping_type = independent_card\` | 搜索结果显示中国职业卡片，点击进入 \`/china-occupations/:slug\` | 若详情失败，进入对应详情异常态 | \`china_search_hit\`、\`china_search_result_click\` |
| 搜索命中 merged_redirect | 搜索接口返回 \`mapping_type = merged_redirect\` | 展示映射说明页或说明弹层，主按钮跳 AIRS 主职业 | 若 parent 不存在，退回搜索无结果态并记录异常 | \`china_search_hit_merged\`、\`china_mapping_view\`、\`china_parent_click\` |
| 搜索命中 one_to_many_redirect | 搜索接口返回 \`mapping_type = one_to_many_redirect\` | 展示分流页，列出 2-3 个推荐 AIRS 去向 | 若无可用去向，退回搜索无结果态并提示稍后再试 | \`china_search_hit_one_to_many\`、\`china_mapping_view\`、\`china_split_target_click\` |
| 搜索无结果 | 搜索接口返回空数组 | 展示“未找到中国职业结果”提示，并给 AIRS 搜索入口或热门 P0 推荐 | 保留原查询词，允许继续搜 AIRS | \`china_search_zero_result\` |
| 职业详情加载中 | 进入详情路由且接口尚未返回 | 展示骨架屏，保留标题区占位和 9 模块占位顺序 | 超时后进入详情异常态 | \`china_detail_loading\` |
| 职业详情为空 | 接口返回 200，但关键字段缺失或状态不可展示 | 展示空态提示：“该职业内容尚未准备好” | 提供返回搜索页和热门 P0 入口 | \`china_detail_empty\` |
| 职业详情异常 | 接口 5xx、网络失败、解析失败 | 展示错误提示、重试按钮、返回搜索页入口 | 用户可重试；仍失败则回搜索页 | \`china_detail_error\`、\`china_detail_retry\` |
| 推荐职业为空 | 详情页成功，但推荐接口返回空数组 | 页面隐藏相关推荐列表，或替换为“热门中国职业”兜底区 | 优先用热门 P0 兜底；若不做兜底则直接省略模块内容 | \`china_related_empty\` |
| slug 不存在 | 详情接口返回 404 | 展示 404 页面，文案指向中国职业搜索 | 提供搜索框、热门 P0 列表、返回首页 | \`china_detail_404\` |

## 状态细化

### 1. 搜索命中独立建卡

- 触发条件：\`GET /api/china-occupations/search\` 命中一条 \`mapping_type = independent_card\` 的记录。
- 页面表现：结果卡片展示中文标题、英文副标题、短文案、方向标签、父职业关系摘要。
- 回退策略：点击进入详情后若接口失败，前端统一落到“职业详情异常”状态，不回退到 AIRS 主职业页。
- 埋点建议：记录查询词、命中方式（主名/别名/模糊）、点击的 slug 和顺位。

### 2. 搜索命中 merged_redirect

- 触发条件：搜索结果返回 \`mapping_type = merged_redirect\`。
- 页面表现：先给映射说明，再提供“查看相关 AIRS 主职业”按钮。
- 回退策略：若 parent 为空，前端不应直接跳空链接，而应退到“搜索无结果”并给热门中国职业列表。
- 埋点建议：记录用户是否查看了映射说明、是否点击 AIRS 主职业按钮。

### 3. 搜索命中 one_to_many_redirect

- 触发条件：搜索结果返回 \`mapping_type = one_to_many_redirect\`。
- 页面表现：展示“该中国职业对应多个 AIRS 主职业”的说明，并列出候选去向。
- 回退策略：若候选列表为空，退回搜索无结果态。
- 埋点建议：记录用户最终选择了哪个目标职业。

### 4. 搜索无结果

- 触发条件：搜索接口空数组，或搜索接口异常后前端主动兜底。
- 页面表现：提示“未找到对应中国职业”，保留原查询词，并展示 AIRS 搜索入口和热门 P0 推荐。
- 回退策略：允许用户一键切换到 AIRS 主职业搜索。
- 埋点建议：记录原查询词、是否转去 AIRS 搜索、是否点击热门推荐。

### 5. 职业详情加载中

- 触发条件：进入详情页后，详情接口 pending。
- 页面表现：显示骨架屏，不展示空白区域。
- 回退策略：超过超时阈值后进入异常态。
- 埋点建议：记录接口耗时、页面首次可见时间。

### 6. 职业详情为空

- 触发条件：接口成功返回，但关键字段缺失，如 \`cn_title_display\`、\`intro_short\`、\`mapping_type\` 为空，或 \`status != ready/online\`。
- 页面表现：展示内容未准备好的空态文案。
- 回退策略：返回搜索页，或展示热门 P0 推荐。
- 埋点建议：记录缺失字段名和 slug，便于内容修复。

### 7. 职业详情异常

- 触发条件：接口 5xx、网络失败、解析失败。
- 页面表现：错误提示 + 重试按钮 + 返回搜索页。
- 回退策略：用户可重试；如果连续失败，建议回到搜索页。
- 埋点建议：记录错误码、slug、重试次数。

### 8. 推荐职业为空

- 触发条件：相关推荐接口返回空数组。
- 页面表现：相关推荐模块可以显示空标题但不渲染卡片，或直接替换成热门 P0 模块。
- 回退策略：优先兜底到热门 P0，若不做兜底则整块隐藏。
- 埋点建议：记录哪个 slug 触发了推荐为空。

### 9. slug 不存在

- 触发条件：详情接口返回 404。
- 页面表现：展示“页面不存在或已下线”，附带中国职业搜索框和热门 P0 列表。
- 回退策略：允许用户直接回搜索页或首页。
- 埋点建议：记录 404 slug 和来源页面。

## 本期上线约束

- 本期正式数据只有 \`independent_card\`，因此 merged 和 one-to-many 主要是接口预留和状态预留。
- 详情页必须覆盖 loading、404、error、相关推荐为空四个真实可发生状态。
- 无父职业的页面不能显示空按钮；应明确写“当前暂无稳妥的 AIRS 主职业可直接挂靠”。
`;
}

function buildLaunchTimeline(p0Rows) {
  const p0Titles = p0Rows.map((row) => row.title).join("、");
  return `# AIRS 中国职业层最小可上线排期文档

## 上线目标

- 用最小可上线方案完成 P0 18 个中国职业页面的搜索、详情、SEO 和分享接入。
- 本期上线职业：${p0Titles}。
- 建议工期：10 个工作日左右，按 5 个阶段推进。

## 总体原则

- 先稳数据和接口，再接搜索，再接详情，再补 SEO 与分享。
- slug、字段和内容在进入联调前必须冻结，避免反复返工。
- 前端可以在第 1 阶段后半段开始并行做页面骨架，但不能绕过正式字段 contract。

## 第 1 阶段：数据接入

- 建议时长：D1-D2
- 必须先完成：
- 建 \`china_occupations\` 表和索引。
- 导入 P0 18 条记录。
- 生成 slug、page_path、mapping_type、independent_card_flag、SEO 和分享字段。
- 冻结首发 P0 slug 清单。
- 可并行：
- 内容团队确认标题、别名、长短文案。
- 前端先搭页面路由和骨架，用 mock 数据开发。
- 阶段出口：
- 18 条 P0 记录在数据库可查。
- slug 唯一且和首发清单一致。
- 详情和搜索所需字段都已经入库。

## 第 2 阶段：搜索接入

- 建议时长：D3-D4
- 依赖：第 1 阶段完成主表、别名和 slug 入库。
- 必须先完成：
- 实现 \`GET /api/china-occupations/search\`。
- 实现查询词归一化和别名命中逻辑。
- 接前端搜索结果卡片。
- 可并行：
- 埋点接入搜索曝光和点击。
- 内容团队补别名白名单。
- 阶段出口：
- P0 18 个职业主名可搜。
- 高优先别名可搜。
- 搜索命中后中国职业结果优先于 AIRS 主职业结果。

## 第 3 阶段：详情页接入

- 建议时长：D4-D7
- 依赖：第 1 阶段完成详情字段入库；第 2 阶段完成基本搜索链路。
- 必须先完成：
- 实现 \`GET /api/china-occupations/:slug\`。
- 实现 \`GET /api/china-occupations/:slug/mapping\`。
- 实现 \`GET /api/china-occupations/:slug/related\`。
- 前端完成 9 个固定模块接入。
- 前端完成 loading、404、error、相关推荐为空状态。
- 可并行：
- 相关 AIRS 主职业按钮与跳转。
- 埋点接入详情曝光和相关推荐点击。
- 阶段出口：
- 18 个 P0 slug 可打开详情页。
- 9 个模块完整出现。
- 状态页可正确兜底。

## 第 4 阶段：SEO/分享接入

- 建议时长：D8
- 依赖：第 1 阶段 slug 冻结；第 3 阶段详情页结构稳定。
- 必须先完成：
- 接入 \`seo_title\` 和 \`seo_description\`。
- 接入 \`share_title\` 和分享按钮。
- 校验 canonical 或 page_path。
- 可并行：
- 内容团队校对 SEO 文案。
- QA 做分享和页面 source 检查。
- 阶段出口：
- 18 个 P0 页面都有稳定的 title、description、分享标题。
- 页面路径与 slug 完全一致。

## 第 5 阶段：验收上线

- 建议时长：D9-D10
- 依赖：前四阶段全部完成。
- 必须先完成：
- 按 P0 清单逐页验收。
- 搜索、详情、SEO、分享、状态页全链路回归。
- 发布前最后一次检查 slug、文案和父职业关系说明。
- 可并行：
- 运营或内容做上线前抽查。
- 研发做线上监控和埋点确认。
- 阶段出口：
- 18 个页面线上可访问。
- 搜索与详情链路可用。
- 无明显误导文案、空页或错误链接。

## 依赖关系说明

### 必须先完成

1. 数据表、字段、slug 入库
2. 搜索和详情接口
3. 内容字段冻结
4. 详情页 9 模块接入
5. SEO 与分享接入
6. 验收回归

### 可并行

- 数据接入后，前端即可用 mock 数据做页面骨架。
- 搜索接口开发和内容别名整理可并行。
- 详情页模块开发和相关推荐接口开发可并行。
- SEO 文案校对和 QA 检查可并行。

## 最小上线门槛

- 18 个 P0 页面全部可访问。
- 主名和高频别名搜索可命中。
- 页面 9 个模块齐全。
- 无父职业页面能正确空态处理。
- title、description、share_title 已接入。
- loading、404、error 三个关键状态可用。
`;
}

function main() {
  ensureDir(OUTPUT_DIR);
  assertInputs();

  const p0Rows = loadP0Rows();
  if (p0Rows.length !== 18) {
    throw new Error(`P0 清单数量应为 18，当前为 ${p0Rows.length}`);
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "china_occupation_dev_plan.md"),
    buildDevPlan(p0Rows),
    "utf8",
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "china_occupation_api_fields.md"),
    buildApiFieldsDoc(p0Rows),
    "utf8",
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "china_occupation_page_state_machine.md"),
    buildStateMachineDoc(),
    "utf8",
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "china_occupation_launch_timeline.md"),
    buildLaunchTimeline(p0Rows),
    "utf8",
  );

  console.log(`Generated implementation docs for ${p0Rows.length} P0 occupations.`);
}

main();
