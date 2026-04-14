import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "output");
const SEED_PATH = path.join(OUTPUT_DIR, "china_occupation_p0_seed.json");

const TRACK_NOTES = {
  平台经济: "在中国平台经营与即时履约语境下，该职业通常直接以中文岗位名出现在招聘、培训和行业内容中，用户不会先从英文 AIRS 主职业开始理解它。",
  产业运营: "在中国供应网络和制造零售协同场景中，这类职业通常直接以“供应链”命名，强调跨采购、计划、仓储和履约的整合能力。",
  "BIM/数字建造": "在中国数字建造场景中，这类职业围绕模型协同、专项设计和交付标准展开，中文职业名本身就具有稳定行业认知。",
  "双碳/绿色经济": "在中国“双碳”政策、碳履约和绿色项目推进语境下，这类职业通常绑定明确治理流程和项目目标，不能简单压缩到传统环境岗位。",
  "AI/数据新职业": "在中国企业数字化和产业落地语境中，这类岗位往往强调训练、实施、运维、应用或治理，而不只是纯研发职位。",
  健康照护: "在中国医疗与照护服务体系里，这类职业通常绑定特定人群、评估流程、咨询链路或辅具服务场景，用户搜索时更依赖中文职业名。",
  家庭服务: "在中国家庭服务和社区服务语境下，这类职业通常直接以中文名称被搜索、购买和传播，用户认知高度依赖本土表达。",
  数字农业: "在中国智慧农业和农服体系里，这类职业通常连接传感设备、平台数据和农事执行，是典型的本土化新职业表达。",
};

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function loadSeed() {
  const items = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));
  if (!Array.isArray(items) || items.length !== 18) {
    throw new Error(`P0 seed 数量应为 18，当前为 ${Array.isArray(items) ? items.length : "invalid"}`);
  }
  return items;
}

function socToAirsUrl(socCode) {
  if (!socCode) {
    return "";
  }
  return `/occupations/${socCode.replace(/\./g, "-")}`;
}

function buildReason(record) {
  return "用户搜索心智独立，适合用中国职业层单独呈现，并承接本土招聘、搜索和内容理解场景。";
}

function buildParent(record) {
  if (!record.mapped_soc_code || !record.mapped_airs_title) {
    return null;
  }
  return {
    socCode: record.mapped_soc_code,
    airsId: null,
    title: record.mapped_airs_title,
    url: socToAirsUrl(record.mapped_soc_code),
  };
}

function toSearchResult(record, matchType, matchedAlias) {
  return {
    id: record.id,
    slug: record.slug,
    cnTitleDisplay: record.cn_title_display,
    enTitle: record.en_title,
    track: record.direction,
    priority: record.priority,
    mappingType: record.mapping_type,
    independentCardFlag: record.independent_card_flag,
    matchType,
    matchedAlias,
    introShort: record.intro_short,
    mappedSocCode: record.mapped_soc_code,
    mappedAirsTitle: record.mapped_airs_title,
    parent: buildParent(record),
    url: record.page_path,
  };
}

function toDetailResponse(record) {
  return {
    id: record.id,
    slug: record.slug,
    cnCode: record.cn_code,
    cnTitleDisplay: record.cn_title_display,
    enTitle: record.en_title,
    track: record.direction,
    priority: record.priority,
    mappingType: record.mapping_type,
    independentCardFlag: record.independent_card_flag,
    status: record.status,
    introShort: record.intro_short,
    introLong: record.intro_long,
    reason: buildReason(record),
    whyNotMerged: record.why_not_merged,
    relationExplainer: record.relation_explainer,
    riskNote: record.risk_note,
    chinaContextNote: TRACK_NOTES[record.direction] ?? "该职业在中国语境中已形成独立认知。",
    aliases: record.aliases_json,
    mappedSocCode: record.mapped_soc_code,
    mappedAirsTitle: record.mapped_airs_title,
    parent: buildParent(record),
    seo: {
      title: record.seo_title,
      description: record.seo_description,
    },
    share: {
      title: record.share_title,
      description: record.share_description,
    },
    pagePath: record.page_path,
  };
}

function toMappingResponse(record) {
  return {
    slug: record.slug,
    cnTitleDisplay: record.cn_title_display,
    mappingType: record.mapping_type,
    independentCardFlag: record.independent_card_flag,
    mappedSocCode: record.mapped_soc_code,
    mappedAirsTitle: record.mapped_airs_title,
    parent: buildParent(record),
    relationExplainer: record.relation_explainer,
    whyNotMerged: record.why_not_merged,
    relatedAirsTargets: [],
  };
}

function toRecommendItems(record, seedBySlug) {
  return record.recommended_related_slugs.map((slug) => {
    const target = seedBySlug.get(slug);
    if (!target) {
      throw new Error(`${record.cn_title_display} 的推荐 slug 不存在：${slug}`);
    }
    return {
      slug: target.slug,
      cnTitleDisplay: target.cn_title_display,
      enTitle: target.en_title,
      priority: target.priority,
      track: target.direction,
      introShort: target.intro_short,
      url: target.page_path,
    };
  });
}

function buildErrorResponse(endpoint, httpStatus, code, message, retryable, details = {}) {
  return {
    success: false,
    endpoint,
    requestId: `mock-${code}`,
    error: {
      status: httpStatus,
      code,
      message,
      retryable,
      details,
    },
  };
}

function buildSearchMocks(seed) {
  const bySlug = new Map(seed.map((item) => [item.slug, item]));
  const bim = bySlug.get("bim-technician");
  const crossBorder = bySlug.get("cross-border-e-commerce-operations-manager");

  const mergedDemo = {
    id: "200001",
    slug: "logistics-service-specialist",
    cnTitleDisplay: "物流服务师",
    enTitle: "Logistics Service Specialist",
    track: "产业运营",
    priority: "P1",
    mappingType: "merged_redirect",
    independentCardFlag: false,
    matchType: "title_exact",
    matchedAlias: "物流服务师",
    introShort: "该职业当前按 AIRS 主职业统一展示，适合前端联调 merged_redirect 搜索命中状态。",
    mappedSocCode: "13-1081.00",
    mappedAirsTitle: "物流师",
    parent: {
      socCode: "13-1081.00",
      title: "物流师",
    },
    url: "/china-occupations/logistics-service-specialist",
  };

  const oneToManyDemo = {
    id: "200002",
    slug: "health-caregiver",
    cnTitleDisplay: "健康照护师",
    enTitle: "Health Caregiver",
    track: "健康照护",
    priority: "P1",
    mappingType: "one_to_many_redirect",
    independentCardFlag: false,
    matchType: "title_exact",
    matchedAlias: "健康照护师",
    introShort: "该中国职业对应多个 AIRS 主职业，前端应先进入分流说明页再决定去向。",
    mappedSocCode: "",
    mappedAirsTitle: "",
    parent: null,
    url: "/china-occupations/health-caregiver",
  };

  return {
    endpoint: "GET /api/china-occupations/search",
    successCases: {
      independentCardTitleExact: {
        request: {
          q: "跨境电商运营管理师",
          limit: 10,
          scene: "global_search",
          includeAirsFallback: true,
        },
        response: {
          query: "跨境电商运营管理师",
          normalizedQuery: "跨境电商运营管理师",
          results: [toSearchResult(crossBorder, "title_exact", "跨境电商运营管理师")],
          fallback: null,
        },
      },
      independentCardAliasExact: {
        request: {
          q: "BIM工程师",
          limit: 10,
          scene: "global_search",
          includeAirsFallback: true,
        },
        response: {
          query: "BIM工程师",
          normalizedQuery: "bim工程师",
          results: [toSearchResult(bim, "alias_exact", "BIM工程师")],
          fallback: null,
        },
      },
      mergedRedirectDemo: {
        request: {
          q: "物流服务师",
          limit: 10,
          scene: "global_search",
          includeAirsFallback: true,
        },
        response: {
          query: "物流服务师",
          normalizedQuery: "物流服务师",
          results: [mergedDemo],
          fallback: null,
        },
      },
      oneToManyRedirectDemo: {
        request: {
          q: "健康照护师",
          limit: 10,
          scene: "global_search",
          includeAirsFallback: true,
        },
        response: {
          query: "健康照护师",
          normalizedQuery: "健康照护师",
          results: [oneToManyDemo],
          fallback: null,
        },
      },
    },
    emptyCases: {
      noResult: {
        request: {
          q: "宇宙农场体验师",
          limit: 10,
          scene: "global_search",
          includeAirsFallback: true,
        },
        response: {
          query: "宇宙农场体验师",
          normalizedQuery: "宇宙农场体验师",
          results: [],
          fallback: {
            type: "airs_search",
            message: "未找到中国职业结果，可继续检索 AIRS 主职业。",
            url: "/search?q=宇宙农场体验师",
          },
        },
      },
    },
    errorCases: {
      serviceError: buildErrorResponse(
        "GET /api/china-occupations/search",
        503,
        "china_occupation_search_unavailable",
        "中国职业搜索服务暂时不可用，请稍后重试。",
        true,
        { q: "BIM技术员" },
      ),
    },
  };
}

function buildDetailMocks(seed) {
  const successCases = {};
  seed.forEach((record) => {
    successCases[record.slug] = {
      request: { slug: record.slug },
      response: toDetailResponse(record),
    };
  });

  const partialSource = seed.find((item) => item.slug === "digital-twin-application-technician");
  const partialResponse = toDetailResponse(partialSource);
  partialResponse.introLong = "";
  partialResponse.seo.description = "";
  partialResponse.share.title = "";

  return {
    endpoint: "GET /api/china-occupations/:slug",
    successCases,
    emptyCases: {
      partialButRenderable: {
        request: { slug: partialSource.slug },
        response: partialResponse,
        fallbackHint: "前端仍可用 cnTitleDisplay、enTitle、introShort、relationExplainer 和 whyNotMerged 先完成首屏渲染。",
      },
    },
    errorCases: {
      slugNotFound: buildErrorResponse(
        "GET /api/china-occupations/:slug",
        404,
        "china_occupation_not_found",
        "当前 slug 对应的中国职业不存在或已下线。",
        false,
        { slug: "not-exists-slug" },
      ),
      serviceError: buildErrorResponse(
        "GET /api/china-occupations/:slug",
        500,
        "china_occupation_detail_unavailable",
        "中国职业详情服务暂时不可用，请稍后重试。",
        true,
        { slug: "bim-technician" },
      ),
    },
  };
}

function buildMappingMocks(seed) {
  const successCases = {};
  seed.forEach((record) => {
    successCases[record.slug] = {
      request: { slug: record.slug },
      response: toMappingResponse(record),
    };
  });

  return {
    endpoint: "GET /api/china-occupations/:slug/mapping",
    successCases,
    emptyCases: {
      noMappedSocCode: {
        request: { slug: "elderly-functional-assessment-specialist" },
        response: successCases["elderly-functional-assessment-specialist"].response,
      },
    },
    errorCases: {
      serviceError: buildErrorResponse(
        "GET /api/china-occupations/:slug/mapping",
        500,
        "china_occupation_mapping_unavailable",
        "中国职业映射关系服务暂时不可用，请稍后重试。",
        true,
        { slug: "elderly-functional-assessment-specialist" },
      ),
    },
  };
}

function buildRecommendMocks(seed) {
  const seedBySlug = new Map(seed.map((item) => [item.slug, item]));
  const successCases = {};

  seed.forEach((record) => {
    successCases[record.slug] = {
      request: { slug: record.slug, limit: 3 },
      response: {
        slug: record.slug,
        results: toRecommendItems(record, seedBySlug),
      },
    };
  });

  return {
    endpoint: "GET /api/china-occupations/:slug/related",
    successCases,
    emptyCases: {
      noRecommendations: {
        request: { slug: "blockchain-application-operator", limit: 3 },
        response: {
          slug: "blockchain-application-operator",
          results: [],
        },
      },
    },
    errorCases: {
      serviceError: buildErrorResponse(
        "GET /api/china-occupations/:slug/related",
        500,
        "china_occupation_related_unavailable",
        "相关推荐服务暂时不可用，请稍后重试。",
        true,
        { slug: "blockchain-application-operator" },
      ),
    },
  };
}

function buildErrorCases() {
  return {
    errorFormat: {
      success: false,
      endpoint: "GET /api/example",
      requestId: "mock-error-code",
      error: {
        status: 500,
        code: "china_occupation_service_error",
        message: "错误提示文案",
        retryable: true,
        details: {
          slug: "bim-technician",
        },
      },
    },
    cases: {
      searchServiceError: buildErrorResponse(
        "GET /api/china-occupations/search",
        503,
        "china_occupation_search_unavailable",
        "中国职业搜索服务暂时不可用，请稍后重试。",
        true,
        { q: "BIM技术员" },
      ),
      detailNotFound: buildErrorResponse(
        "GET /api/china-occupations/:slug",
        404,
        "china_occupation_not_found",
        "当前 slug 对应的中国职业不存在或已下线。",
        false,
        { slug: "not-exists-slug" },
      ),
      detailServiceError: buildErrorResponse(
        "GET /api/china-occupations/:slug",
        500,
        "china_occupation_detail_unavailable",
        "中国职业详情服务暂时不可用，请稍后重试。",
        true,
        { slug: "bim-technician" },
      ),
      mappingServiceError: buildErrorResponse(
        "GET /api/china-occupations/:slug/mapping",
        500,
        "china_occupation_mapping_unavailable",
        "中国职业映射关系服务暂时不可用，请稍后重试。",
        true,
        { slug: "elderly-functional-assessment-specialist" },
      ),
      recommendServiceError: buildErrorResponse(
        "GET /api/china-occupations/:slug/related",
        500,
        "china_occupation_related_unavailable",
        "相关推荐服务暂时不可用，请稍后重试。",
        true,
        { slug: "blockchain-application-operator" },
      ),
    },
  };
}

function buildReadme() {
  return `# 中国职业层接口 Mock 使用说明

## 文件与页面状态对应关系

- \`china_occupation_mock_search_response.json\`
  对应页面状态：搜索命中独立建卡、搜索命中 merged_redirect、搜索命中 one_to_many_redirect、搜索无结果、搜索服务异常。
- \`china_occupation_mock_detail_responses.json\`
  对应页面状态：职业详情正常、字段缺省但可回退、slug 不存在、职业详情异常。
- \`china_occupation_mock_mapping_response.json\`
  对应页面状态：有明确 parent AIRS 职业、无 mapped_soc_code、映射服务异常。
- \`china_occupation_mock_recommend_response.json\`
  对应页面状态：相关推荐正常返回、相关推荐为空、相关推荐服务异常。
- \`china_occupation_mock_error_cases.json\`
  对应页面状态：所有接口统一异常结构；建议直接被 mock server 或前端错误分支复用。

## 建议的前端使用场景

- 搜索页或全局搜索框：优先读取 \`china_occupation_mock_search_response.json\`。
- 详情页主渲染：读取 \`china_occupation_mock_detail_responses.json\` 中对应 slug 的成功样例。
- 详情页关系模块：读取 \`china_occupation_mock_mapping_response.json\`。
- 相关推荐模块：读取 \`china_occupation_mock_recommend_response.json\`。
- 错误兜底页：统一读取 \`china_occupation_mock_error_cases.json\`。

## 首屏最小必需响应字段

前端详情页首屏真正必需的字段：

- \`slug\`
- \`cnTitleDisplay\`
- \`enTitle\`
- \`priority\`
- \`track\`
- \`introShort\`
- \`mappedSocCode\`
- \`mappedAirsTitle\`
- \`relationExplainer\`
- \`whyNotMerged\`

## 可延迟加载字段

以下字段可以在首屏之后再使用，不阻塞首屏渲染：

- \`introLong\`
- \`riskNote\`
- \`chinaContextNote\`
- \`aliases\`
- \`parent.url\`
- \`seo.title\`
- \`seo.description\`
- \`share.title\`
- \`share.description\`
- \`results\`（相关推荐列表）

## 统一异常返回格式

所有异常都使用同一套结构：

\`\`\`json
{
  "success": false,
  "endpoint": "GET /api/china-occupations/:slug",
  "requestId": "mock-china_occupation_detail_unavailable",
  "error": {
    "status": 500,
    "code": "china_occupation_detail_unavailable",
    "message": "中国职业详情服务暂时不可用，请稍后重试。",
    "retryable": true,
    "details": {
      "slug": "bim-technician"
    }
  }
}
\`\`\`

## 使用建议

1. 前端本地开发时，可直接把这几份 JSON 挂到 mock server 或静态文件服务。
2. 若页面先做首屏联调，只需要详情成功样例和搜索成功样例即可开始。
3. 状态页联调时，再切到 error_cases 和 emptyCases。
4. 真实后端接入时，优先保证字段名与这些 mock 一致，减少前端重复改动。
`;
}

function main() {
  ensureDir(OUTPUT_DIR);
  const seed = loadSeed();

  const files = [
    ["china_occupation_mock_search_response.json", buildSearchMocks(seed)],
    ["china_occupation_mock_detail_responses.json", buildDetailMocks(seed)],
    ["china_occupation_mock_mapping_response.json", buildMappingMocks(seed)],
    ["china_occupation_mock_recommend_response.json", buildRecommendMocks(seed)],
    ["china_occupation_mock_error_cases.json", buildErrorCases()],
  ];

  files.forEach(([name, payload]) => {
    fs.writeFileSync(path.join(OUTPUT_DIR, name), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "china_occupation_mock_readme.md"),
    buildReadme(),
    "utf8",
  );

  console.log(`Generated mock response files for ${seed.length} P0 occupations.`);
}

main();
