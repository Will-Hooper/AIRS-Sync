import type { OccupationAliasType } from "./types";
import { CHINA_P0_SEARCH_SEEDS } from "./occupation-search-china-p0";

export { CHINA_P0_SEARCH_SEEDS };

export interface OccupationSearchSeedAliasInput {
  // Chinese-facing alias or abbreviation users may type into the search box.
  alias: string;
  // Semantic class for ranking, QA and later log-driven maintenance.
  aliasType?: OccupationAliasType;
  // Stronger aliases win when multiple normalized aliases collide.
  weight?: number;
  // Keep the seed source explicit so log-derived terms can be reviewed later.
  source?: "seed_manual" | "seed_generated" | "log_derived";
}

export interface OccupationSearchSeedEntry {
  // Stable internal id for the Chinese-facing search entry.
  id: string;
  // Existing AIRS occupation / SOC id this entry maps to.
  occupationId: string;
  // Primary Chinese label shown to users.
  label: string;
  labelEn?: string;
  categoryLv1: string;
  categoryLv2: string;
  // Existing template / analysis layer stays unchanged.
  analysisTemplateId: string;
  // Higher priority entries sort earlier in suggestions and fallbacks.
  searchPriority: number;
  // Accepts plain strings for simple seeds and structured records for weighted aliases.
  aliases: Array<string | OccupationSearchSeedAliasInput>;
}

export interface OccupationSearchCategoryFallback {
  label: string;
  keywords: string[];
  entryIds: string[];
}

export const COMMON_OCCUPATION_SEARCH_SEEDS: OccupationSearchSeedEntry[] = [
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
    id: "common:cashier-accounts",
    occupationId: "43-3031.00",
    label: "出纳",
    labelEn: "Accounting Clerk",
    categoryLv1: "文职",
    categoryLv2: "财务",
    analysisTemplateId: "soc:43-3031.00",
    searchPriority: 94,
    aliases: ["出纳", "会计文员", "记账员", "财务文员", "会计员"]
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
    aliases: ["电商运营", "电商", "淘宝运营", "天猫运营", "店铺运营", "运营专员", "搞电商的", "店铺上链接"]
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
    id: "common:livestream-operator",
    occupationId: "13-1161.00",
    label: "直播运营",
    labelEn: "Livestream Operations Specialist",
    categoryLv1: "运营",
    categoryLv2: "直播",
    analysisTemplateId: "soc:13-1161.00",
    searchPriority: 106,
    aliases: ["直播运营", "直播间运营", "带货运营", "搞直播间的"]
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
    aliases: ["视频剪辑", "剪辑师", "视频后期", "后期制作", "短视频剪辑", "剪视频", "拍视频", "拍视频的"]
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
    id: "common:ui-designer",
    occupationId: "15-1255.00",
    label: "UI设计师",
    labelEn: "UI Designer",
    categoryLv1: "设计",
    categoryLv2: "界面",
    analysisTemplateId: "soc:15-1255.00",
    searchPriority: 108,
    aliases: ["ui", "ui设计", "ui设计师", "ux", "交互设计", "网页设计"]
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
    id: "common:frontend-developer",
    occupationId: "15-1254.00",
    label: "前端开发",
    labelEn: "Frontend Developer",
    categoryLv1: "技术",
    categoryLv2: "开发",
    analysisTemplateId: "soc:15-1254.00",
    searchPriority: 102,
    aliases: ["前端", "前端开发", "前端工程师", "web前端"]
  },
  {
    id: "common:backend-developer",
    occupationId: "15-1252.00",
    label: "后端开发",
    labelEn: "Backend Developer",
    categoryLv1: "技术",
    categoryLv2: "开发",
    analysisTemplateId: "soc:15-1252.00",
    searchPriority: 102,
    aliases: ["后端", "后端开发", "后端工程师", "服务端开发"]
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
    id: "common:test-engineer",
    occupationId: "15-1253.00",
    label: "软件测试工程师",
    labelEn: "Software QA Analyst",
    categoryLv1: "技术",
    categoryLv2: "测试",
    analysisTemplateId: "soc:15-1253.00",
    searchPriority: 96,
    aliases: ["软件测试", "测试工程师", "qa", "功能测试", "测试开发"]
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
  },
  {
    id: "common:project-manager",
    occupationId: "13-1082.00",
    label: "项目经理",
    labelEn: "Project Manager",
    categoryLv1: "运营",
    categoryLv2: "项目",
    analysisTemplateId: "soc:13-1082.00",
    searchPriority: 96,
    aliases: ["项目经理", "项目管理", "项目专员", "pm"]
  },
  {
    id: "common:sales-specialist",
    occupationId: "41-3091.00",
    label: "销售专员",
    labelEn: "Sales Specialist",
    categoryLv1: "销售",
    categoryLv2: "销售",
    analysisTemplateId: "soc:41-3091.00",
    searchPriority: 106,
    aliases: ["销售", "销售专员", "业务员", "客户经理", "bd", "商务拓展", "跑业务", "跑业务的"]
  },
  {
    id: "common:telesales",
    occupationId: "41-3091.00",
    label: "电话销售",
    labelEn: "Telesales Representative",
    categoryLv1: "销售",
    categoryLv2: "电话销售",
    analysisTemplateId: "soc:41-3091.00",
    searchPriority: 96,
    aliases: ["电话销售", "电销", "课程顾问"]
  },
  {
    id: "common:retail-sales",
    occupationId: "41-2031.00",
    label: "门店销售",
    labelEn: "Retail Salesperson",
    categoryLv1: "销售",
    categoryLv2: "零售",
    analysisTemplateId: "soc:41-2031.00",
    searchPriority: 92,
    aliases: ["导购", "店员", "营业员", "门店销售", "柜员", "卖东西", "门店卖东西", "在店里卖货", "看店"]
  },
  {
    id: "common:logistics-specialist",
    occupationId: "13-1081.00",
    label: "物流专员",
    labelEn: "Logistics Specialist",
    categoryLv1: "物流",
    categoryLv2: "物流",
    analysisTemplateId: "soc:13-1081.00",
    searchPriority: 96,
    aliases: ["物流专员", "物流", "物流助理", { alias: "发货专员", aliasType: "recruitment", weight: 72 }]
  },
  {
    id: "common:warehouse-clerk",
    occupationId: "43-5071.00",
    label: "仓库管理员",
    labelEn: "Warehouse Clerk",
    categoryLv1: "物流",
    categoryLv2: "仓储",
    analysisTemplateId: "soc:43-5071.00",
    searchPriority: 98,
    aliases: [
      "仓库管理员",
      "仓管",
      "库管",
      "库存管理员",
      "仓储管理员",
      "管仓库的",
      { alias: "发货的", aliasType: "spoken", weight: 96 },
      { alias: "管发货", aliasType: "task_based", weight: 92 }
    ]
  },
  {
    id: "common:stocker",
    occupationId: "53-7065.00",
    label: "理货员",
    labelEn: "Stocker",
    categoryLv1: "物流",
    categoryLv2: "仓储",
    analysisTemplateId: "soc:53-7065.00",
    searchPriority: 90,
    aliases: ["理货员", "补货员", "上货员", "配货员"]
  },
  {
    id: "common:delivery-rider",
    occupationId: "43-5021.00",
    label: "配送员",
    labelEn: "Delivery Rider",
    categoryLv1: "物流",
    categoryLv2: "配送",
    analysisTemplateId: "soc:43-5021.00",
    searchPriority: 108,
    aliases: ["配送员", "快递员", "外卖员", "跑外卖", "跑外卖的", "送外卖", "骑手", "送快递", "送快递的"]
  },
  {
    id: "common:ride-hailing-driver",
    occupationId: "53-3054.00",
    label: "网约车司机",
    labelEn: "Ride-Hailing Driver",
    categoryLv1: "物流",
    categoryLv2: "司机",
    analysisTemplateId: "soc:53-3054.00",
    searchPriority: 102,
    aliases: ["网约车司机", "滴滴司机", "跑滴滴", "出租车司机"]
  },
  {
    id: "common:truck-driver",
    occupationId: "53-3032.00",
    label: "货车司机",
    labelEn: "Truck Driver",
    categoryLv1: "物流",
    categoryLv2: "司机",
    analysisTemplateId: "soc:53-3032.00",
    searchPriority: 96,
    aliases: ["货车司机", "卡车司机", "货运司机", "大车司机"]
  },
  {
    id: "common:delivery-driver",
    occupationId: "53-3033.00",
    label: "配送司机",
    labelEn: "Delivery Driver",
    categoryLv1: "物流",
    categoryLv2: "司机",
    analysisTemplateId: "soc:53-3033.00",
    searchPriority: 94,
    aliases: ["配送司机", "送货司机"]
  },
  {
    id: "common:nurse",
    occupationId: "29-1141.00",
    label: "护士",
    labelEn: "Registered Nurse",
    categoryLv1: "教育医疗",
    categoryLv2: "护理",
    analysisTemplateId: "soc:29-1141.00",
    searchPriority: 102,
    aliases: ["护士", "注册护士", "护理", "护理人员"]
  },
  {
    id: "common:pharmacist",
    occupationId: "29-1051.00",
    label: "药师",
    labelEn: "Pharmacist",
    categoryLv1: "教育医疗",
    categoryLv2: "医药",
    analysisTemplateId: "soc:29-1051.00",
    searchPriority: 108,
    aliases: ["药师", "药剂师", "药店上班", "药店上班的", { alias: "药房", aliasType: "common", weight: 100 }]
  },
  {
    id: "common:doctor",
    occupationId: "29-1229.00",
    label: "医生",
    labelEn: "Physician",
    categoryLv1: "教育医疗",
    categoryLv2: "医疗",
    analysisTemplateId: "soc:29-1229.00",
    searchPriority: 96,
    aliases: ["医生", "医师", "大夫", "临床医生", "门诊医生", { alias: "医疗", aliasType: "common", weight: 98 }]
  },
  {
    id: "common:legal-specialist",
    occupationId: "23-2011.00",
    label: "法务专员",
    labelEn: "Legal Specialist",
    categoryLv1: "文职",
    categoryLv2: "法务",
    analysisTemplateId: "soc:23-2011.00",
    searchPriority: 92,
    aliases: [
      "法务",
      "法务专员",
      { alias: "律师助理", aliasType: "recruitment", weight: 98 },
      { alias: "法律助理", aliasType: "recruitment", weight: 96 },
      "合同法务"
    ]
  },
  {
    id: "common:teacher",
    occupationId: "25-3099.00",
    label: "老师",
    labelEn: "Teacher",
    categoryLv1: "教育医疗",
    categoryLv2: "教育",
    analysisTemplateId: "soc:25-3099.00",
    searchPriority: 96,
    aliases: ["老师", "教师", "讲师", "教培", "培训老师"]
  },
  {
    id: "common:factory-worker",
    occupationId: "51-9199.00",
    label: "普工",
    labelEn: "Factory Worker",
    categoryLv1: "制造",
    categoryLv2: "普工",
    analysisTemplateId: "soc:51-9199.00",
    searchPriority: 92,
    aliases: ["普工", "操作工", "工厂工人", "在工厂上班", "在工厂上班的", "厂里上班", "流水线工人"]
  },
  {
    id: "common:cook",
    occupationId: "35-2014.00",
    label: "厨师",
    labelEn: "Cook",
    categoryLv1: "服务",
    categoryLv2: "餐饮",
    analysisTemplateId: "soc:35-2014.00",
    searchPriority: 94,
    aliases: ["厨师", "炒菜师傅", "后厨", "厨工"]
  },
  {
    id: "common:waiter",
    occupationId: "35-3031.00",
    label: "服务员",
    labelEn: "Waiter",
    categoryLv1: "服务",
    categoryLv2: "餐饮",
    analysisTemplateId: "soc:35-3031.00",
    searchPriority: 92,
    aliases: ["服务员", "餐厅服务员", "服务生", { alias: "餐饮", aliasType: "common", weight: 96 }]
  },
  {
    id: "common:security-guard",
    occupationId: "33-9032.00",
    label: "保安",
    labelEn: "Security Guard",
    categoryLv1: "服务",
    categoryLv2: "安保",
    analysisTemplateId: "soc:33-9032.00",
    searchPriority: 92,
    aliases: ["保安", "安保", "安保员", "门卫"]
  }
];

export const POPULAR_SEARCH_ENTRY_IDS = [
  "common:admin-clerk",
  "common:hr-specialist",
  "common:customer-service",
  "common:ecommerce-operator",
  "common:douyin-operator",
  "common:video-editor",
  "common:software-developer",
  "common:accountant",
  "common:delivery-rider",
  "common:logistics-specialist",
  "china:bim-technician",
  "china:ai-training-specialist",
  "china:cross-border-e-commerce-operations-manager"
];

export const CATEGORY_FALLBACKS: OccupationSearchCategoryFallback[] = [
  {
    label: "文职热门职业",
    keywords: ["文职", "行政", "办公室", "坐班"],
    entryIds: ["common:admin-clerk", "common:receptionist", "common:hr-specialist", "common:customer-service"]
  },
  {
    label: "设计热门职业",
    keywords: ["设计", "美工", "ui", "ux", "平面"],
    entryIds: ["common:graphic-designer", "common:ui-designer", "common:video-editor"]
  },
  {
    label: "销售热门职业",
    keywords: ["销售", "业务", "顾问", "招商"],
    entryIds: ["common:sales-specialist", "common:telesales", "common:retail-sales"]
  },
  {
    label: "司机热门职业",
    keywords: ["司机", "开车", "驾驶"],
    entryIds: ["common:ride-hailing-driver", "common:truck-driver", "common:delivery-driver", "common:delivery-rider"]
  },
  {
    label: "运营热门职业",
    keywords: ["运营", "电商", "新媒体", "抖音", "直播"],
    entryIds: [
      "common:ecommerce-operator",
      "common:new-media-operator",
      "common:douyin-operator",
      "common:livestream-operator",
      "common:livestream-host"
    ]
  },
  {
    label: "技术热门职业",
    keywords: ["技术", "程序", "开发", "it", "软件"],
    entryIds: [
      "common:software-developer",
      "common:frontend-developer",
      "common:backend-developer",
      "common:data-analyst",
      "common:test-engineer"
    ]
  },
  {
    label: "教育医疗热门职业",
    keywords: ["教育", "老师", "教师", "讲师", "教培"],
    entryIds: ["common:teacher", "china:family-education-guidance-specialist"]
  },
  {
    label: "医疗热门职业",
    keywords: ["医疗", "医院", "医生", "护士", "护理", "药店", "药师", "药剂师"],
    entryIds: ["common:doctor", "common:nurse", "common:pharmacist"]
  },
  {
    label: "物流热门职业",
    keywords: ["物流", "仓储", "仓库", "配送", "骑手"],
    entryIds: [
      "common:logistics-specialist",
      "common:warehouse-clerk",
      "common:stocker",
      "common:delivery-rider",
      "common:delivery-driver",
      "china:supply-chain-manager"
    ]
  },
  {
    label: "制造热门职业",
    keywords: ["工厂", "普工", "生产", "车间", "技工", "操作工"],
    entryIds: ["common:factory-worker", "common:warehouse-clerk", "common:truck-driver"]
  },
  {
    label: "后勤热门职业",
    keywords: ["后勤"],
    entryIds: ["common:admin-clerk", "common:warehouse-clerk", "common:receptionist"]
  },
  {
    label: "餐饮服务热门职业",
    keywords: ["餐饮", "服务", "服务员", "门店"],
    entryIds: ["common:waiter", "common:cook", "common:retail-sales"]
  }
];
