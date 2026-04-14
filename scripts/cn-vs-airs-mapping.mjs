import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "output");
const AIRS_PATH = path.join(ROOT, "backend", "data", "airs_data.json");

const OSTA_BASE_URL = "https://www.osta.org.cn/api";
const REQUEST_TIMEOUT_MS = 30_000;
const DEFAULT_VERSION_ID = 2;
const SMALL_CLASS_RE = /^\d-\d{2}-\d{2}$/;
const OCCUPATION_CODE_RE = /^\d-\d{2}-\d{2}-\d{2}$/;

const CN_GENERIC_STOPWORDS = [
  "人员",
  "工作",
  "从事",
  "进行",
  "相关",
  "运用",
  "使用",
  "负责",
  "开展",
  "管理",
  "技术",
  "工程",
  "服务",
  "生产",
  "专业",
  "产品",
  "设备",
  "系统",
  "企业",
  "职业",
  "业务",
  "活动",
  "工作任务",
  "主要",
  "岗位",
  "信息",
  "平台",
  "数据",
  "操作",
  "辅助",
  "其他",
];

const CN_ALIAS_GROUPS = [
  ["互联网营销师", ["网络营销师"]],
  ["网约配送员", ["即时配送员", "同城配送员"]],
  ["整理收纳师", ["收纳整理师"]],
  ["全媒体运营师", ["新媒体运营师"]],
  ["健康照护师", ["健康照护员"]],
  ["养老护理员", ["老年照护员", "养老照护员"]],
  ["陪诊师", ["陪诊员"]],
  ["人工智能训练师", ["AI训练师"]],
  ["网络与信息安全管理员", ["信息安全管理员"]],
  ["电子数据取证分析师", ["电子取证分析师"]],
  ["供应链管理师", ["供应链运营师"]],
  ["跨境电商运营管理师", ["跨境电子商务运营管理师"]],
  ["家庭教育指导师", ["家庭教育顾问"]],
  ["民宿管家", ["民宿运营管家"]],
  ["调饮师", ["饮品调制师", "饮品师"]],
  ["健康管理师", ["健康管理人员"]],
];

const EN_ALIAS_GROUPS = [
  ["software developer", ["software engineer"]],
  ["web and digital interface designer", ["web designer", "ui designer", "ux designer", "product designer"]],
  ["market research analyst and marketing specialist", ["marketing specialist", "digital marketing specialist", "growth marketer"]],
  ["courier and messenger", ["delivery worker", "delivery rider", "courier driver"]],
  ["logistician", ["supply chain specialist", "supply chain analyst"]],
  ["demonstrator and product promoter", ["product promoter", "live commerce promoter"]],
  ["public relations specialist", ["communications specialist", "media relations specialist"]],
  ["community health worker", ["health navigator", "community care worker"]],
  ["health education specialist", ["health promoter", "wellness educator"]],
  ["personal care and service worker all other", ["professional organizer", "escort care worker"]],
  ["home health aide", ["home care aide"]],
  ["personal care aide", ["care aide"]],
  ["nursing assistant", ["care assistant"]],
  ["compliance officer", ["regulatory specialist"]],
  ["environmental scientist and specialist including health", ["environmental specialist", "sustainability specialist"]],
];

const AIRS_SPECIAL_ALIASES = new Map([
  ["13-1161.00", ["数字营销", "网络营销", "内容营销", "营销专员", "增长运营"]],
  ["41-9011.00", ["产品推广", "产品演示", "直播销售", "带货推广"]],
  ["41-3091.00", ["服务销售", "平台招商", "商务拓展"]],
  ["43-5021.00", ["配送员", "骑手", "派送员", "同城配送"]],
  ["53-3033.00", ["配送司机", "送货司机"]],
  ["13-1081.00", ["供应链", "物流规划", "供应链管理"]],
  ["13-1041.00", ["合规", "监管合规", "排放合规"]],
  ["19-2041.00", ["环保", "环境治理", "碳管理"]],
  ["21-1094.00", ["社区健康", "健康服务"]],
  ["21-1091.00", ["健康教育", "健康促进"]],
  ["31-1121.00", ["居家照护", "家庭照护"]],
  ["31-1122.00", ["生活照护", "个人照护"]],
  ["31-1131.00", ["护理员", "护理助理"]],
  ["39-9099.00", ["收纳师", "陪诊师", "生活服务定制"]],
  ["15-2051.00", ["人工智能训练", "数据标注", "模型训练"]],
  ["15-1244.00", ["网络系统管理", "网络运维"]],
  ["15-1234.00", ["信息安全", "网络安全"]],
  ["15-1255.00", ["网页与界面设计", "交互设计"]],
]);

const PRIORITY_NEW_OCCUPATION_TITLES = new Set([
  "互联网营销师",
  "全媒体运营师",
  "民宿管家",
  "二手车经纪人",
  "数字孪生应用技术员",
  "信息安全测试员",
  "城市管理网格员",
  "工业视觉系统运维员",
  "人工智能训练师",
  "工业机器人系统运维员",
  "数字化解决方案设计师",
  "物联网安装调试员",
  "网约配送员",
  "碳排放管理员",
  "碳汇计量评估师",
  "建筑节能减排咨询师",
  "建筑信息模型技术员",
  "装配式建筑施工员",
  "建筑幕墙设计师",
  "食品安全管理师",
  "供应链管理师",
  "调饮师",
  "家庭教育指导师",
  "区块链应用操作员",
  "老年人能力评估师",
  "健康照护师",
  "智能制造工程技术人员",
  "工业互联网工程技术人员",
  "虚拟现实工程技术人员",
  "连锁经营管理师",
  "呼吸治疗师",
  "出生缺陷防控咨询师",
  "康复辅助技术咨询师",
  "无人机装调检修工",
  "铁路综合维修工",
  "跨境电商运营管理师",
  "用户增长运营师",
  "智能网联汽车测试员",
  "智能制造系统运维员",
]);

const SPECIAL_MATCH_RULES = [
  {
    pattern: /^互联网营销师$/,
    match_status: "one_to_many",
    socCodes: ["13-1161.00", "41-9011.00", "41-3091.00"],
    needNewIndependentEntry: true,
    reason:
      "定义同时覆盖数字营销策划、直播/短视频推广和销售转化，AIRS 只能拆分到营销专员、产品推广员和服务销售代表等多个 SOC。",
  },
  {
    pattern: /^全媒体运营师$/,
    match_status: "one_to_many",
    socCodes: ["13-1161.00", "27-3031.00", "41-9011.00"],
    needNewIndependentEntry: true,
    reason:
      "该职业兼具内容运营、传播推广和转化运营职责，AIRS 中缺少与中国“全媒体运营”完全对应的独立职业。",
  },
  {
    pattern: /^网约配送员$/,
    match_status: "merged_match",
    socCodes: ["43-5021.00"],
    needNewIndependentEntry: true,
    reason:
      "AIRS 最接近的是“快递员与信使”，但其未单列平台即时配送场景，仍属于中国平台经济下的细分独立职业。",
  },
  {
    pattern: /^整理收纳师$/,
    match_status: "merged_match",
    socCodes: ["39-9099.00"],
    needNewIndependentEntry: true,
    reason:
      "AIRS 没有“整理收纳”独立职业，只能牵强并入其他个人护理与服务类岗位，建议补独立条目。",
  },
  {
    pattern: /^陪诊师$/,
    match_status: "missing",
    socCodes: [],
    needNewIndependentEntry: true,
    reason:
      "该职业的核心是跨医疗流程陪同、就诊协助与流程协调，AIRS 中没有足够贴合的独立或稳定并入对象。",
  },
  {
    pattern: /^健康照护师$/,
    match_status: "one_to_many",
    socCodes: ["31-1121.00", "31-1122.00", "31-1131.00"],
    needNewIndependentEntry: true,
    reason:
      "定义兼具居家照护、生活照护和基础护理协助，AIRS 需拆分到家庭卫生助理、个人护理助理和护理助理等多个 SOC。",
  },
  {
    pattern: /^养老护理员$/,
    match_status: "one_to_many",
    socCodes: ["31-1121.00", "31-1122.00", "31-1131.00"],
    needNewIndependentEntry: true,
    reason:
      "中国“养老护理员”通常同时承担生活照护、长期照护与基础护理协助，难以由 AIRS 单一 SOC 独立覆盖。",
  },
  {
    pattern: /^碳排放管理员$/,
    match_status: "missing",
    socCodes: [],
    needNewIndependentEntry: true,
    reason:
      "AIRS 只有环境/合规等宽泛职业，没有专门对应碳排放核算、监测、履约与交易管理的独立职业。",
  },
  {
    pattern: /^碳汇计量评估师$/,
    match_status: "missing",
    socCodes: [],
    needNewIndependentEntry: true,
    reason:
      "碳汇计量评估兼具生态监测、方法学核算和减排项目评估职责，AIRS 中缺少相应独立职业。",
  },
  {
    pattern: /^家庭教育指导师$/,
    match_status: "merged_match",
    socCodes: ["21-1012.00"],
    needNewIndependentEntry: true,
    reason:
      "AIRS 最接近教育/升学与职业咨询顾问，但未单列以家庭教育指导为核心服务对象的职业。",
  },
  {
    pattern: /^老年人能力评估师$/,
    match_status: "missing",
    socCodes: [],
    needNewIndependentEntry: true,
    reason:
      "AIRS 缺少专门面向老年失能失智评估、照护等级判定和福利适配评估的独立职业。",
  },
  {
    pattern: /^民宿管家$/,
    match_status: "merged_match",
    socCodes: ["39-6012.00", "43-4081.00"],
    needNewIndependentEntry: true,
    reason:
      "AIRS 可部分并入礼宾员或住宿前台文员，但中国“民宿管家”通常同时承担房态、接待、活动体验和平台运营。",
  },
  {
    pattern: /^供应链管理师$/,
    match_status: "merged_match",
    socCodes: ["13-1081.00"],
    needNewIndependentEntry: true,
    reason:
      "AIRS 中“物流师”最接近，但中国“供应链管理师”职责通常覆盖采购、库存、计划协同与供应链优化，边界更宽。",
  },
  {
    pattern: /^跨境电商运营管理师$/,
    match_status: "merged_match",
    socCodes: ["13-1161.00", "11-2021.00"],
    needNewIndependentEntry: true,
    reason:
      "AIRS 无“跨境电商运营”独立职业，只能并入营销或市场管理相关职业，建议单列。",
  },
  {
    pattern: /^用户增长运营师$/,
    match_status: "missing",
    socCodes: [],
    needNewIndependentEntry: true,
    reason:
      "该职业以增长分析、转化实验和用户生命周期运营为核心，AIRS 中暂无与中国互联网增长运营相当的独立职业。",
  },
  {
    pattern: /^人工智能训练师$/,
    match_status: "merged_match",
    socCodes: ["15-2051.00"],
    needNewIndependentEntry: true,
    reason:
      "AIRS 最接近数据科学家，但未单列面向数据标注、模型训练、评测与调优的人工智能训练职业。",
  },
  {
    pattern: /^区块链应用操作员$/,
    match_status: "missing",
    socCodes: [],
    needNewIndependentEntry: true,
    reason:
      "AIRS 缺少面向区块链业务部署、节点管理和链上应用操作的专门职业条目。",
  },
  {
    pattern: /^城市管理网格员$/,
    match_status: "missing",
    socCodes: [],
    needNewIndependentEntry: false,
    reason:
      "该职业高度依赖中国基层治理与城市管理体系，AIRS 中没有可稳定复用的职业对应关系。",
  },
  {
    pattern: /^行政办事员$/,
    match_status: "merged_match",
    socCodes: ["43-9061.00"],
    needNewIndependentEntry: false,
    reason:
      "属于常规行政事务办理岗位，AIRS 中可保守并入“办公文员、综合”，无须作为独立缺失职业处理。",
  },
  {
    pattern: /^政务服务办事员$/,
    match_status: "merged_match",
    socCodes: ["43-4171.00"],
    needNewIndependentEntry: false,
    reason:
      "其核心职责是窗口咨询引导、业务受理和信息服务，AIRS 中可保守并入“前台接待与信息文员”。",
  },
  {
    pattern: /^收发员$/,
    match_status: "merged_match",
    socCodes: ["43-9051.00"],
    needNewIndependentEntry: false,
    reason:
      "属于传统收发与传递岗位，AIRS 中可保守并入“邮件文员与邮件机器操作员（不含邮政服务）”。",
  },
  {
    pattern: /^建筑信息模型技术员$/,
    match_status: "merged_match",
    socCodes: ["17-3011.00"],
    needNewIndependentEntry: true,
    reason:
      "AIRS 最接近“建筑与土木制图员”，但未单列以 BIM 建模、协同和信息管理为核心的职业。",
  },
  {
    pattern: /^物流服务师$/,
    match_status: "merged_match",
    socCodes: ["13-1081.00"],
    needNewIndependentEntry: true,
    reason:
      "AIRS 中“物流师”最接近，但中国“物流服务师”通常同时覆盖采购、仓储、配送、国际单证与系统运维等更综合的作业组织职责。",
  },
  {
    pattern: /^医疗临床辅助服务员$/,
    match_status: "merged_match",
    socCodes: ["31-9092.00", "31-9099.00"],
    needNewIndependentEntry: false,
    reason:
      "AIRS 可并入医疗助理或其他医疗保健支持从业人员，但没有完全对应中国临床辅助服务的独立职业。",
  },
];

const BIG_GROUP_TO_AIRS_GROUPS = new Map([
  ["1", new Set(["Management", "Legal"])],
  [
    "2",
    new Set([
      "Management",
      "Business and Financial Operations",
      "Computer and Mathematical",
      "Architecture and Engineering",
      "Life, Physical, and Social Science",
      "Community and Social Service",
      "Legal",
      "Education, Training, and Library",
      "Arts, Design, Entertainment, Sports, and Media",
      "Healthcare Practitioners and Technical",
    ]),
  ],
  ["3", new Set(["Office and Administrative Support", "Protective Service", "Legal", "Community and Social Service"])],
  [
    "4",
    new Set([
      "Sales and Related",
      "Food Preparation and Serving Related",
      "Personal Care and Service",
      "Healthcare Support",
      "Transportation and Material Moving",
      "Protective Service",
      "Building and Grounds Cleaning and Maintenance",
    ]),
  ],
  ["5", new Set(["Farming, Fishing, and Forestry"])],
  [
    "6",
    new Set([
      "Production",
      "Construction and Extraction",
      "Installation, Maintenance, and Repair",
      "Transportation and Material Moving",
      "Architecture and Engineering",
    ]),
  ],
  ["7", new Set(["Military Specific"])],
]);

const GENERIC_TITLE_SUFFIXES = [
  "专业人员",
  "工程技术人员",
  "技术人员",
  "管理人员",
  "服务人员",
  "辅助人员",
  "从业人员",
  "工作人员",
  "负责人",
];

const TITLE_HEAD_TERMS = [
  "律师",
  "记者",
  "教师",
  "会计",
  "审计",
  "程序员",
  "工程师",
  "设计师",
  "分析师",
  "护理员",
  "收银员",
  "经理",
  "管理员",
  "经纪人",
  "顾问",
  "咨询师",
  "导游",
  "司机",
  "药师",
  "医师",
  "护士",
  "治疗师",
  "翻译",
  "编辑",
  "导演",
  "演员",
  "播音员",
  "主持人",
  "摄影师",
  "测量师",
  "技师",
];

const TRADITIONAL_SECTOR_PATTERNS = [
  {
    key: "manufacturing",
    label: "制造业常规职业",
    pattern:
      /工|制造|加工|装配|铸|锻|焊|钳|车工|铣工|镗工|磨工|模具|机修|机床|表面处理|热处理|印刷|纺织|服装|皮革|制鞋|冶炼|炼钢|炼铁|化工|制药|食品生产|包装|机械冷加工|机械热加工/,
  },
  {
    key: "construction",
    label: "建筑业常规职业",
    pattern:
      /建筑|施工|土木|砌筑|钢筋|混凝土|安装工|装饰|装修|桥隧|道路|桥梁|园林|古建筑|给排水|燃气|供热|勘察|岩土|幕墙|测量员|工程测量/,
  },
  {
    key: "transport",
    label: "交通运输常规职业",
    pattern: /运输|仓储|物流|驾驶员|司机|列车|铁路|船舶|港口|民航|装卸|货运|客运|邮政|快递|乘务|票务|航标|打捞/,
  },
  {
    key: "admin",
    label: "行政文员类职业",
    pattern: /行政|文员|秘书|档案|录入|统计员|收发员|出纳员|前台|客服|办事员|票务员|行政事务|政务服务/,
  },
  {
    key: "professional",
    label: "传统教育医疗财会职业",
    pattern:
      /教师|医师|医生|护士|药师|会计|审计|财务|记者|编辑|翻译|图书|检验师|技师|治疗师|助产士|乡村医生|公证员|审判辅助|检察辅助/,
  },
  {
    key: "agriculture",
    label: "农林牧渔传统职业",
    pattern: /农业|农机|农艺|种植|养殖|畜牧|渔业|林业|植保|园艺|水产|护林|兽医|农产品|作物|苗圃/,
  },
];

const DISPLAY_NAME_OVERRIDES = new Map([
  ["4-08-08-23", "BIM技术员"],
  ["4-07-02-06", "用户增长运营师"],
  ["4-09-07-04", "碳排放管理员"],
  ["4-09-07-05", "碳汇计量评估师"],
  ["4-09-07-06", "建筑节能减排咨询师"],
  ["4-01-06-02", "互联网营销师"],
  ["4-01-06-03", "跨境电商运营管理师"],
  ["4-10-08-01", "网约配送员"],
  ["4-14-01-03", "健康照护师"],
  ["4-13-04-03", "家庭教育指导师"],
]);

const ENGLISH_NAME_OVERRIDES = new Map([
  ["互联网营销师", "Internet Marketing Specialist"],
  ["全媒体运营师", "All-Media Operations Specialist"],
  ["民宿管家", "Homestay Steward"],
  ["二手车经纪人", "Used Car Broker"],
  ["数字孪生应用技术员", "Digital Twin Application Technician"],
  ["信息安全测试员", "Information Security Testing Specialist"],
  ["城市管理网格员", "Urban Grid Management Worker"],
  ["工业视觉系统运维员", "Industrial Vision System O&M Technician"],
  ["人工智能训练师", "AI Training Specialist"],
  ["人工智能工程技术人员", "AI Engineering Technician"],
  ["工业机器人系统运维员", "Industrial Robot Systems O&M Technician"],
  ["数字化解决方案设计师", "Digital Solution Designer"],
  ["物联网安装调试员", "IoT Installation and Commissioning Technician"],
  ["网约配送员", "On-Demand Delivery Rider"],
  ["碳排放管理员", "Carbon Emissions Administrator"],
  ["碳管理工程技术人员", "Carbon Management Engineering Technician"],
  ["碳汇计量评估师", "Carbon Sink Measurement and Assessment Specialist"],
  ["建筑节能减排咨询师", "Building Energy-Saving and Emissions-Reduction Consultant"],
  ["建筑信息模型技术员", "BIM Technician"],
  ["装配式建筑施工员", "Prefabricated Building Construction Technician"],
  ["建筑幕墙设计师", "Building Curtain Wall Designer"],
  ["食品安全管理师", "Food Safety Manager"],
  ["供应链管理师", "Supply Chain Manager"],
  ["供应链工程技术人员", "Supply Chain Engineering Technician"],
  ["调饮师", "Beverage Mixologist"],
  ["家庭教育指导师", "Family Education Guidance Specialist"],
  ["区块链应用操作员", "Blockchain Application Operator"],
  ["老年人能力评估师", "Elderly Functional Assessment Specialist"],
  ["健康照护师", "Health Caregiver"],
  ["智能制造工程技术人员", "Intelligent Manufacturing Engineering Technician"],
  ["工业互联网工程技术人员", "Industrial Internet Engineering Technician"],
  ["虚拟现实工程技术人员", "Virtual Reality Engineering Technician"],
  ["连锁经营管理师", "Chain Operations Manager"],
  ["呼吸治疗师", "Respiratory Therapist"],
  ["出生缺陷防控咨询师", "Birth Defect Prevention Counselor"],
  ["康复辅助技术咨询师", "Assistive Technology Consultant"],
  ["无人机装调检修工", "UAV Assembly, Commissioning and Maintenance Worker"],
  ["铁路综合维修工", "Railway Comprehensive Maintenance Worker"],
  ["跨境电商运营管理师", "Cross-Border E-Commerce Operations Manager"],
  ["用户增长运营师", "User Growth Operations Specialist"],
  ["智能网联汽车测试员", "Intelligent Connected Vehicle Test Technician"],
  ["智能制造系统运维员", "Intelligent Manufacturing Systems O&M Technician"],
  ["陪诊师", "Medical Visit Escort Specialist"],
  ["整理收纳师", "Home Organizing Specialist"],
  ["供应链管理师", "Supply Chain Manager"],
  ["供应链工程技术人员", "Supply Chain Engineering Technician"],
  ["网约配送员", "On-Demand Delivery Rider"],
  ["健康教育医师", "Health Education Physician"],
  ["生殖健康咨询师", "Reproductive Health Counselor"],
  ["科技咨询师", "Technology Consultant"],
  ["心理咨询师", "Psychological Counselor"],
]);

const ENGLISH_FALLBACK_REPLACEMENTS = [
  ["地球物理地球化学与遥感勘查", "Geophysical, Geochemical and Remote Sensing Exploration"],
  ["摄影测量与遥感", "Photogrammetry and Remote Sensing"],
  ["地理国情监测", "National Geographic Conditions Monitoring"],
  ["地理信息系统", "Geographic Information Systems"],
  ["导航与位置服务", "Navigation and Location Services"],
  ["海洋测绘", "Marine Surveying and Mapping"],
  ["地质测绘", "Geological Surveying and Mapping"],
  ["水工环地质", "Hydrogeological, Engineering and Environmental Geological"],
  ["农业数字化", "Agricultural Digitalization"],
  ["冶金热能", "Metallurgical Thermal Energy"],
  ["电子商务", "E-Commerce"],
  ["招聘", "Recruitment"],
  ["工程技术人员", "Engineering Technician"],
  ["技术员", "Technician"],
  ["管理员", "Administrator"],
  ["咨询师", "Consultant"],
  ["指导师", "Guidance Specialist"],
  ["评估师", "Assessment Specialist"],
  ["运营管理师", "Operations Manager"],
  ["运营师", "Operations Specialist"],
  ["管理师", "Manager"],
  ["设计师", "Designer"],
  ["配送员", "Delivery Worker"],
  ["护理员", "Care Worker"],
  ["服务员", "Service Worker"],
  ["经纪人", "Broker"],
  ["技师", "Technician"],
  ["医师", "Physician"],
  ["测试员", "Test Technician"],
  ["装调检修工", "Assembly, Commissioning and Maintenance Worker"],
  ["维修工", "Maintenance Worker"],
  ["施工员", "Construction Technician"],
  ["运维员", "O&M Technician"],
  ["操作员", "Operator"],
  ["营销师", "Marketing Specialist"],
  ["师", "Specialist"],
];

const THIRD_PASS_SUSPICIOUS_ANCHOR_CODES = new Set([
  "27-1023.00",
  "35-3031.00",
  "53-6021.00",
  "41-9021.00",
  "33-3031.00",
  "29-1241.00",
  "29-1242.00",
  "29-1243.00",
  "29-1024.00",
  "29-1071.00",
  "29-2051.00",
  "21-1015.00",
  "29-9092.00",
]);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toHalfWidth(input) {
  return String(input ?? "").replace(/[\uFF01-\uFF5E]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0),
  );
}

function stripOccupationFlags(title) {
  return String(title ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*(L\/S|L|S)\s*$/i, "")
    .trim();
}

function detectTitleFlags(rawTitle) {
  const value = String(rawTitle ?? "").trim();
  const hasGreen = /\bL\/S\b|\bL\b/.test(value);
  const hasDigital = /\bL\/S\b|\bS\b/.test(value);
  return { hasGreen, hasDigital };
}

function removeBrackets(input) {
  return String(input ?? "")
    .replace(/（[^（）]*）/g, "")
    .replace(/\([^()]*\)/g, "")
    .replace(/\[[^\]]*]/g, "")
    .replace(/【[^】]*】/g, "");
}

function normalizePunctuation(input) {
  return toHalfWidth(input)
    .replace(/[，、；：]/g, " ")
    .replace(/[。！？]/g, " ")
    .replace(/[“”‘’"'`]/g, "")
    .replace(/[·•]/g, "")
    .replace(/[\/\\]/g, " ")
    .replace(/[^\p{L}\p{N}\s()-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCnTitle(input) {
  return applyCnAlias(
    normalizePunctuation(removeBrackets(stripOccupationFlags(input)))
      .replace(/\s+/g, "")
      .replace(/及其/g, "")
      .replace(/职业资格/g, "")
      .trim(),
  );
}

function normalizeEnTitle(input) {
  return applyEnAlias(
    normalizePunctuation(removeBrackets(input))
      .toLowerCase()
      .replace(/\ball other\b/g, "all other")
      .replace(/\bworkers\b/g, "worker")
      .replace(/\bspecialists\b/g, "specialist")
      .replace(/\bmanagers\b/g, "manager")
      .replace(/\btechnicians\b/g, "technician")
      .replace(/\bdevelopers\b/g, "developer")
      .trim(),
  );
}

function buildAliasLookup(groups, normalizer) {
  const map = new Map();
  for (const [canonical, aliases] of groups) {
    const normalizedCanonical = normalizer(canonical);
    map.set(normalizedCanonical, normalizedCanonical);
    for (const alias of aliases) {
      map.set(normalizer(alias), normalizedCanonical);
    }
  }
  return map;
}

const CN_ALIAS_LOOKUP = buildAliasLookup(CN_ALIAS_GROUPS, (value) =>
  normalizePunctuation(removeBrackets(stripOccupationFlags(value))).replace(/\s+/g, ""),
);
const EN_ALIAS_LOOKUP = buildAliasLookup(EN_ALIAS_GROUPS, (value) =>
  normalizePunctuation(value).toLowerCase().replace(/\s+/g, " "),
);

function applyCnAlias(normalizedTitle) {
  return CN_ALIAS_LOOKUP.get(normalizedTitle) ?? normalizedTitle;
}

function applyEnAlias(normalizedTitle) {
  return EN_ALIAS_LOOKUP.get(normalizedTitle) ?? normalizedTitle;
}

function cleanText(input) {
  return normalizePunctuation(input);
}

function onlyChinese(input) {
  return String(input ?? "").replace(/[^\p{sc=Han}\p{N}]/gu, "");
}

function onlyEnglishTokens(input) {
  return String(input ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => applyEnAlias(token));
}

function makeNgrams(text, sizes = [2, 3]) {
  const value = onlyChinese(text);
  const tokens = new Set();
  if (!value) {
    return tokens;
  }
  if (value.length === 1) {
    tokens.add(value);
    return tokens;
  }
  for (const size of sizes) {
    if (value.length < size) {
      continue;
    }
    for (let index = 0; index <= value.length - size; index += 1) {
      const gram = value.slice(index, index + size);
      if (CN_GENERIC_STOPWORDS.includes(gram)) {
        continue;
      }
      tokens.add(gram);
    }
  }
  return tokens;
}

function makeKeywordSet(text) {
  const normalized = cleanText(text).replace(/\s+/g, "");
  return makeNgrams(normalized, [2, 3, 4]);
}

function extractTitleStems(title) {
  const normalized = normalizeCnTitle(title);
  const stems = new Set();
  if (normalized) {
    stems.add(normalized);
  }
  for (const suffix of GENERIC_TITLE_SUFFIXES) {
    if (normalized.endsWith(suffix)) {
      const stripped = normalized.slice(0, -suffix.length);
      if (stripped.length >= 2) {
        stems.add(stripped);
      }
    }
  }
  for (const term of TITLE_HEAD_TERMS) {
    if (!normalized.includes(term)) {
      continue;
    }
    stems.add(term);
    const index = normalized.indexOf(term);
    const phraseStart = Math.max(0, index - 2);
    const phrase = normalized.slice(phraseStart, index + term.length);
    if (phrase.length >= 2) {
      stems.add(phrase);
    }
  }
  return [...stems].filter((item) => item.length >= 2);
}

function buildIdf(docs) {
  const docFreq = new Map();
  const totalDocs = docs.length || 1;
  for (const doc of docs) {
    const seen = new Set(doc);
    for (const token of seen) {
      docFreq.set(token, (docFreq.get(token) ?? 0) + 1);
    }
  }
  const idf = new Map();
  for (const [token, freq] of docFreq.entries()) {
    idf.set(token, Math.log((totalDocs + 1) / (freq + 1)) + 1);
  }
  return idf;
}

function weightedJaccard(setA, setB, idf) {
  if (!setA.size || !setB.size) {
    return 0;
  }
  let intersection = 0;
  let union = 0;
  const all = new Set([...setA, ...setB]);
  for (const token of all) {
    const weight = idf.get(token) ?? 1;
    if (setA.has(token) && setB.has(token)) {
      intersection += weight;
    }
    union += weight;
  }
  return union ? intersection / union : 0;
}

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

async function fetchJson(endpoint, params = {}) {
  const url = new URL(`${OSTA_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json,text/plain,*/*",
          "user-agent": "Mozilla/5.0 Codex occupation mapping",
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      const data = await response.json();
      if (data.code !== 200) {
        throw new Error(`API ${url} returned code ${data.code}: ${data.msg}`);
      }
      return data.body;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt < 4) {
        await sleep(500 * attempt);
      }
    }
  }
  throw lastError;
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function runWorker() {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= items.length) {
        return;
      }
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length || 1) }, runWorker));
  return results;
}

function collectSmallClasses(treeNodes) {
  const smallClasses = [];
  function walk(node) {
    if (!node || typeof node !== "object") {
      return;
    }
    if (SMALL_CLASS_RE.test(String(node.careerCode ?? ""))) {
      smallClasses.push({
        careerCode: node.careerCode,
        careerName: node.careerName,
        versionId: node.versionId ?? DEFAULT_VERSION_ID,
      });
    }
    for (const child of node.children ?? []) {
      walk(child);
    }
  }
  for (const node of treeNodes) {
    walk(node);
  }
  return smallClasses;
}

function parseOccupationDetail(detail) {
  const flags = detectTitleFlags(detail.name);
  const cleanTitle = stripOccupationFlags(detail.name);
  const works = (detail.works ?? []).map((work) => stripOccupationFlags(work.name));
  return {
    cn_code: detail.careerCode,
    cn_title: cleanTitle,
    cn_title_raw: detail.name,
    cn_definition: String(detail.text ?? "").trim(),
    cn_tasks: String(detail.task ?? "").trim(),
    cn_works: works,
    cn_big_code: detail.bigCode ?? "",
    cn_big_name: detail.bigName ?? "",
    cn_centre_code: detail.centreCode ?? "",
    cn_centre_name: detail.centreName ?? "",
    cn_small_code: detail.smallCode ?? "",
    cn_small_name: detail.smallName ?? "",
    is_green: flags.hasGreen,
    is_digital: flags.hasDigital,
  };
}

async function loadCnOccupations() {
  const tree = await fetchJson("/client/get/tree");
  const smallClasses = collectSmallClasses(tree);
  const subordinateLists = await mapWithConcurrency(smallClasses, 10, async (smallClass) => {
    const body = await fetchJson("/client/subordinate/data", {
      careerCode: smallClass.careerCode,
      versionId: smallClass.versionId,
    });
    return body
      .filter((item) => OCCUPATION_CODE_RE.test(String(item.careerCode ?? "")))
      .map((item) => ({
        careerCode: item.careerCode,
        versionId: item.versionId ?? smallClass.versionId ?? DEFAULT_VERSION_ID,
      }));
  });

  const occupationRefs = unique(
    subordinateLists.flat().map((item) => `${item.careerCode}|${item.versionId ?? DEFAULT_VERSION_ID}`),
  ).map((value) => {
    const [careerCode, versionId] = value.split("|");
    return { careerCode, versionId: Number(versionId) || DEFAULT_VERSION_ID };
  });

  const details = await mapWithConcurrency(occupationRefs, 12, async (ref) => {
    const body = await fetchJson("/client/career/detail", {
      careerCode: ref.careerCode,
      versionId: ref.versionId,
    });
    return parseOccupationDetail(body);
  });

  return details.sort((left, right) => left.cn_code.localeCompare(right.cn_code, "zh-Hans-CN"));
}

function loadAirsOccupations() {
  const airsJson = JSON.parse(fs.readFileSync(AIRS_PATH, "utf8"));
  const rows = airsJson.occupations ?? airsJson;
  return rows.map((row) => {
    const titleZh = row.titleZh ?? "";
    const titleEn = row.title ?? "";
    const definitionZh = row.definitionZh ?? "";
    const definitionEn = row.definition ?? "";
    const taskTextZh = Array.isArray(row.tasks) ? row.tasks.join("；") : "";
    const specialAliases = AIRS_SPECIAL_ALIASES.get(row.socCode) ?? [];
    const allZhTitleVariants = unique([titleZh, ...specialAliases].map((value) => stripOccupationFlags(value)));
    const normalizedZhVariants = unique(allZhTitleVariants.map((value) => normalizeCnTitle(value)));
    const normalizedEn = normalizeEnTitle(titleEn);
    const bodyTextZh = [titleZh, definitionZh, taskTextZh, ...specialAliases].filter(Boolean).join(" ");
    const bodyTextEn = [titleEn, definitionEn, row.majorGroup ?? ""].filter(Boolean).join(" ");
    return {
      soc_code: row.socCode,
      title_en: titleEn,
      title_zh: titleZh,
      definition_zh: definitionZh,
      definition_en: definitionEn,
      major_group: row.majorGroup ?? "",
      normalized_zh_variants: normalizedZhVariants,
      normalized_en: normalizedEn,
      title_stems: unique(allZhTitleVariants.flatMap((value) => extractTitleStems(value))),
      title_tokens: makeKeywordSet(allZhTitleVariants.join(" ")),
      body_tokens: makeKeywordSet(bodyTextZh),
      en_tokens: new Set(onlyEnglishTokens(bodyTextEn)),
      is_all_other: /\ball other\b/i.test(titleEn) || /^其他/.test(titleZh),
    };
  });
}

function buildDocsForIdf(cnOccupations, airsOccupations) {
  return [
    ...cnOccupations.map((item) => new Set([...item.title_tokens, ...item.body_tokens])),
    ...airsOccupations.map((item) => new Set([...item.title_tokens, ...item.body_tokens])),
  ];
}

function withPreparedCnFeatures(cnOccupations) {
  return cnOccupations.map((item) => {
    const normalizedTitle = normalizeCnTitle(item.cn_title);
    const textBody = [item.cn_title, item.cn_definition, item.cn_tasks, ...(item.cn_works ?? [])].join(" ");
    return {
      ...item,
      normalized_title: normalizedTitle,
      title_stems: extractTitleStems(item.cn_title),
      title_tokens: makeKeywordSet(item.cn_title),
      body_tokens: makeKeywordSet(textBody),
      hint_text: textBody,
    };
  });
}

function getCategoryFlags(cnRecord) {
  const titleText = `${cnRecord.cn_title}${(cnRecord.cn_works ?? []).join("")}${cnRecord.cn_small_name}${cnRecord.cn_centre_name}`.replace(/\s+/g, "");
  const isPlatform = /互联网营销|电商|直播|短视频|网约|配送|外卖|带货|选品|跨境电商|用户增长|社交媒体|内容运营/.test(titleText);
  const isGreen =
    cnRecord.is_green ||
    /碳|低碳|节能减排|环保|生态|环境监测|水生态|绿色|新能源|储能|光伏|风电/.test(titleText);
  const isDigitalAgriculture = /农业|农机|农作物|植保|养殖|畜牧|水产/.test(titleText) && /数字|智能|遥感|无人机|物联网|数据/.test(titleText);
  const isCare = /养老|照护|护理|托育|家政|母婴|康复|陪诊|社群健康|健康照护|老年|家庭教育|出生缺陷/.test(titleText);
  const clearlyNotIndependent = /负责人|其他.*人员|其他.*职业|辅助人员|机关负责人|基层组织负责人|义务兵|军官|警官|军士|警士/.test(
    cnRecord.cn_title,
  );
  const isNewOccupation = PRIORITY_NEW_OCCUPATION_TITLES.has(cnRecord.cn_title);
  return {
    isPlatform,
    isGreen,
    isDigitalAgriculture,
    isCare,
    clearlyNotIndependent,
    isNewOccupation,
  };
}

function matchAllowedMajorGroupBonus(cnRecord, airsRecord) {
  const bigCode = cnRecord.cn_big_code || cnRecord.cn_code.split("-")[0];
  const allowed = BIG_GROUP_TO_AIRS_GROUPS.get(bigCode);
  if (!allowed) {
    return 0;
  }
  return allowed.has(airsRecord.major_group) ? 0.04 : -0.03;
}

function keywordHintBonus(cnRecord, airsRecord) {
  const text = `${cnRecord.cn_title} ${cnRecord.cn_definition} ${cnRecord.cn_tasks}`.replace(/\s+/g, "");
  const title = airsRecord.title_en.toLowerCase();
  let bonus = 0;
  if (/(营销|运营|品牌|推广|公关|传播)/.test(text) && /(market|marketing|public relations|promoter|sales)/.test(title)) {
    bonus += 0.08;
  }
  if (/(配送|快递|骑手|派送)/.test(text) && /(courier|messenger|driver)/.test(title)) {
    bonus += 0.08;
  }
  if (/(供应链|物流)/.test(text) && /(logistic|supply|transportation)/.test(title)) {
    bonus += 0.08;
  }
  if (/(人工智能|算法|模型|训练|数据标注)/.test(text) && /(data scientist|software|computer occupation)/.test(title)) {
    bonus += 0.08;
  }
  if (/(信息安全|网络安全|安全测试)/.test(text) && /(information security|computer|network)/.test(title)) {
    bonus += 0.08;
  }
  if (/(碳|环保|生态|环境)/.test(text) && /(environmental|compliance)/.test(title)) {
    bonus += 0.06;
  }
  if (/(养老|照护|护理|家政|陪诊)/.test(text) && /(nursing|home health|personal care|healthcare support|service worker)/.test(title)) {
    bonus += 0.08;
  }
  if (/(农业|农机|种植|养殖|水产)/.test(text) && /(agricultural|farm)/.test(title)) {
    bonus += 0.08;
  }
  if (/(无人机)/.test(text) && /(aircraft|photogrammetrist|aviation)/.test(title)) {
    bonus += 0.05;
  }
  return bonus;
}

function exactMatchBonus(cnRecord, airsRecord) {
  if (airsRecord.normalized_zh_variants.includes(cnRecord.normalized_title)) {
    return 0.35;
  }
  return 0;
}

function stemMatchBonus(cnRecord, airsRecord) {
  for (const cnStem of cnRecord.title_stems ?? []) {
    for (const airsStem of airsRecord.title_stems ?? []) {
      if (cnStem === airsStem) {
        return 0.18;
      }
      if (cnStem.includes(airsStem) || airsStem.includes(cnStem)) {
        return 0.1;
      }
    }
  }
  return 0;
}

function buildCandidateScore(cnRecord, airsRecord, idf) {
  const titleScore = Math.max(
    ...airsRecord.normalized_zh_variants.map((variant) =>
      weightedJaccard(makeKeywordSet(variant), cnRecord.title_tokens, idf),
    ),
    0,
  );
  const bodyScore = weightedJaccard(cnRecord.body_tokens, airsRecord.body_tokens, idf);
  const exactBonus = exactMatchBonus(cnRecord, airsRecord);
  const stemBonus = stemMatchBonus(cnRecord, airsRecord);
  const majorGroupBonus = matchAllowedMajorGroupBonus(cnRecord, airsRecord);
  const hintBonus = keywordHintBonus(cnRecord, airsRecord);
  const allOtherPenalty = airsRecord.is_all_other ? 0.06 : 0;
  const score =
    titleScore * 0.58 + bodyScore * 0.32 + exactBonus + stemBonus + majorGroupBonus + hintBonus - allOtherPenalty;
  return {
    soc_code: airsRecord.soc_code,
    title_en: airsRecord.title_en,
    title_zh: airsRecord.title_zh,
    major_group: airsRecord.major_group,
    score,
    titleScore,
    bodyScore,
    exactBonus,
    stemBonus,
    hintBonus,
    is_all_other: airsRecord.is_all_other,
  };
}

function readableCnDefinition(cnRecord) {
  const worksText = cnRecord.cn_works?.length ? `工种示例：${cnRecord.cn_works.join("、")}。` : "";
  const definition = cnRecord.cn_definition ? `定义：${cnRecord.cn_definition}` : "";
  const tasks = cnRecord.cn_tasks ? `主要工作：${cnRecord.cn_tasks}` : "";
  return [definition, tasks, worksText].filter(Boolean).join(" ");
}

function pickSpecialRule(cnRecord) {
  return SPECIAL_MATCH_RULES.find((rule) => rule.pattern.test(cnRecord.cn_title));
}

function buildSpecialRuleResult(cnRecord, airsByCode, rule) {
  const candidates = rule.socCodes.map((socCode) => airsByCode.get(socCode)).filter(Boolean);
  return {
    cn_code: cnRecord.cn_code,
    cn_title: cnRecord.cn_title,
    cn_definition: readableCnDefinition(cnRecord),
    airs_soc_code: candidates.map((item) => item.soc_code).join(" | "),
    airs_title_en: candidates.map((item) => item.title_en).join(" | "),
    airs_title_zh: candidates.map((item) => item.title_zh).join(" | "),
    match_status: rule.match_status,
    reason: rule.reason,
    need_new_independent_entry: String(rule.needNewIndependentEntry),
    _flags: getCategoryFlags(cnRecord),
    _best: candidates[0]
      ? {
          soc_code: candidates[0].soc_code,
          title_en: candidates[0].title_en,
          title_zh: candidates[0].title_zh,
          score: 1,
          is_all_other: false,
        }
      : undefined,
  };
}

function chooseOneToManyCandidates(candidates) {
  const filtered = candidates
    .filter((candidate) => candidate.score >= 0.28 && !candidate.is_all_other)
    .slice(0, 3);
  if (filtered.length < 2) {
    return [];
  }
  const distinctTitles = new Set(filtered.map((candidate) => candidate.title_en));
  return distinctTitles.size >= 2 ? filtered.slice(0, 3) : [];
}

function buildReasonFromBest(best, matchStatus) {
  if (!best) {
    return "AIRS 中未找到足够可信的对应职业；现有 SOC 只能形成非常宽泛或牵强的近似。";
  }
  if (matchStatus === "exact_match") {
    return `名称与定义均与 AIRS 条目“${best.title_zh || best.title_en}”高度一致，AIRS 中已有较明确独立职业。`;
  }
  if (matchStatus === "merged_match") {
    return `AIRS 中没有完全同名独立条目，最合理的是并入“${best.title_zh || best.title_en}”（${best.soc_code}）；但该 SOC 的覆盖范围更宽。`;
  }
  if (matchStatus === "missing") {
    return `最接近的 AIRS 职业仅为“${best.title_zh || best.title_en}”，但名称、定义或工作内容差距仍较大，不足以认定为已覆盖。`;
  }
  return "该职业同时覆盖多个职责面向，单一 AIRS SOC 无法完整覆盖。";
}

function buildOneToManyReason(candidates) {
  const labels = candidates.map((candidate) => `${candidate.title_zh || candidate.title_en}（${candidate.soc_code}）`);
  return `该职业的职责需要拆分映射到多个 AIRS SOC：${labels.join("、")}。`;
}

function decideNeedIndependentEntry(cnRecord, matchStatus, bestCandidate) {
  const flags = getCategoryFlags(cnRecord);
  if (matchStatus === "exact_match") {
    return false;
  }
  if (flags.clearlyNotIndependent) {
    return false;
  }
  if (flags.isNewOccupation || flags.isPlatform || flags.isGreen || flags.isDigitalAgriculture || flags.isCare) {
    return true;
  }
  if (matchStatus === "missing") {
    return !bestCandidate || bestCandidate.is_all_other || bestCandidate.score < 0.4;
  }
  return Boolean(bestCandidate?.is_all_other);
}

function classifyByCandidates(cnRecord, candidates, airsByCode) {
  const specialRule = pickSpecialRule(cnRecord);
  if (specialRule) {
    return buildSpecialRuleResult(cnRecord, airsByCode, specialRule);
  }

  const best = candidates[0];
  const second = candidates[1];
  const exactByName = Boolean(best && best.exactBonus > 0);
  const strongExact = Boolean(
    best &&
      (exactByName ||
        (best.score >= 0.56 && best.titleScore >= 0.36 && !best.is_all_other && best.bodyScore >= 0.18) ||
        (best.stemBonus >= 0.18 && best.score >= 0.42 && !best.is_all_other)),
  );
  const oneToManyCandidates = chooseOneToManyCandidates(candidates);
  const text = `${cnRecord.cn_title}${cnRecord.cn_definition}${cnRecord.cn_tasks}`;
  const compositeTitle = /和|及|与|兼|复合|综合/.test(cnRecord.cn_title) || /直播|短视频|订单|售后/.test(text);

  let matchStatus = "missing";
  let selectedCandidates = [];

  if (strongExact) {
    matchStatus = "exact_match";
    selectedCandidates = [best];
  } else if (compositeTitle && oneToManyCandidates.length >= 2 && best?.score >= 0.32 && second?.score >= 0.29) {
    matchStatus = "one_to_many";
    selectedCandidates = oneToManyCandidates;
  } else if (
    best &&
    !best.is_all_other &&
    (best.score >= 0.28 || best.stemBonus >= 0.1 || (best.titleScore >= 0.18 && best.bodyScore >= 0.05))
  ) {
    matchStatus = "merged_match";
    selectedCandidates = [best];
  } else {
    matchStatus = "missing";
    selectedCandidates = [];
  }

  const reason =
    matchStatus === "one_to_many"
      ? buildOneToManyReason(selectedCandidates)
      : buildReasonFromBest(best, matchStatus);
  const needNewIndependentEntry = decideNeedIndependentEntry(cnRecord, matchStatus, best);
  return {
    cn_code: cnRecord.cn_code,
    cn_title: cnRecord.cn_title,
    cn_definition: readableCnDefinition(cnRecord),
    airs_soc_code: selectedCandidates.map((item) => item.soc_code).join(" | "),
    airs_title_en: selectedCandidates.map((item) => item.title_en).join(" | "),
    airs_title_zh: selectedCandidates.map((item) => item.title_zh).join(" | "),
    match_status: matchStatus,
    reason,
    need_new_independent_entry: String(needNewIndependentEntry),
    _flags: getCategoryFlags(cnRecord),
    _best: best,
  };
}

function detectTraditionalSector(cnRecord) {
  const text = `${cnRecord.cn_title}${cnRecord.cn_small_name}${cnRecord.cn_centre_name}${cnRecord.cn_big_name}`.replace(/\s+/g, "");
  return TRADITIONAL_SECTOR_PATTERNS.find((item) => item.pattern.test(text));
}

function shouldKeepMissingInSecondPass(cnRecord, result) {
  const flags = result._flags ?? getCategoryFlags(cnRecord);
  if (flags.isPlatform || flags.isGreen || flags.isDigitalAgriculture || flags.isCare || flags.isNewOccupation) {
    return true;
  }
  if (flags.clearlyNotIndependent) {
    return true;
  }
  const bigCode = cnRecord.cn_big_code || cnRecord.cn_code.split("-")[0];
  return !["2", "3", "4", "5", "6"].includes(bigCode);
}

function isReasonableTraditionalMerge(bestCandidate, sectorKey) {
  if (!bestCandidate) {
    return false;
  }
  const strongTitleMatch =
    bestCandidate.stemBonus >= 0.1 || bestCandidate.titleScore >= 0.12 || bestCandidate.exactBonus > 0;
  const solidOverall = bestCandidate.score >= 0.2 || (bestCandidate.titleScore >= 0.08 && bestCandidate.bodyScore >= 0.05);
  if (!strongTitleMatch || !solidOverall) {
    return false;
  }
  if (!bestCandidate.is_all_other) {
    return true;
  }
  return ["manufacturing", "construction", "transport", "agriculture"].includes(sectorKey) && bestCandidate.score >= 0.24;
}

function buildSecondPassReason(cnRecord, bestCandidate, sector) {
  return `第二轮人工规则收敛：该职业属于${sector.label}，虽然 AIRS 未单列同名条目，但可保守并入“${bestCandidate.title_zh || bestCandidate.title_en}”（${bestCandidate.soc_code}），不再作为优先补库缺失项。`;
}

function applySecondPassConvergence(initialResults, cnByCode, candidateMap) {
  let changedMissingToMerged = 0;
  const adjusted = initialResults.map((row) => {
    if (row.match_status !== "missing") {
      return row;
    }
    const cnRecord = cnByCode.get(row.cn_code);
    if (!cnRecord || shouldKeepMissingInSecondPass(cnRecord, row)) {
      return row;
    }
    const sector = detectTraditionalSector(cnRecord);
    if (!sector) {
      return row;
    }
    const bestCandidate = (candidateMap.get(row.cn_code) ?? [])[0];
    if (!isReasonableTraditionalMerge(bestCandidate, sector.key)) {
      return row;
    }
    changedMissingToMerged += 1;
    return {
      ...row,
      airs_soc_code: bestCandidate.soc_code,
      airs_title_en: bestCandidate.title_en,
      airs_title_zh: bestCandidate.title_zh,
      match_status: "merged_match",
      reason: buildSecondPassReason(cnRecord, bestCandidate, sector),
      need_new_independent_entry: "false",
      _best: bestCandidate,
      _second_pass_sector: sector.key,
    };
  });
  return { adjusted, changedMissingToMerged };
}

function toFlatRows(results) {
  return results.map((row) => ({
    cn_code: row.cn_code,
    cn_title: row.cn_title,
    cn_definition: row.cn_definition,
    airs_soc_code: row.airs_soc_code,
    airs_title_en: row.airs_title_en,
    airs_title_zh: row.airs_title_zh,
    match_status: row.match_status,
    reason: row.reason,
    need_new_independent_entry: row.need_new_independent_entry,
  }));
}

function suggestDisplayName(entry) {
  return DISPLAY_NAME_OVERRIDES.get(entry.cn_code) ?? entry.cn_title;
}

function recommendedAnchor(entry) {
  if (entry.airs_title_zh) {
    return {
      titleZh: entry.airs_title_zh.replace(/\s*\|\s*/g, " / "),
      socCode: entry.airs_soc_code.replace(/\s*\|\s*/g, " / "),
    };
  }
  if (entry._best && !entry._best.is_all_other && entry._best.score >= 0.24) {
    return {
      titleZh: entry._best.title_zh || entry._best.title_en,
      socCode: entry._best.soc_code,
    };
  }
  return { titleZh: "", socCode: "" };
}

function suggestEnglishName(entry) {
  const override = ENGLISH_NAME_OVERRIDES.get(entry.cn_title);
  if (override) {
    return override;
  }
  const anchorEnglish = entry.airs_title_en.split(" | ")[0]?.trim();
  if (anchorEnglish) {
    return anchorEnglish;
  }
  let translated = entry.cn_title;
  for (const [cn, en] of ENGLISH_FALLBACK_REPLACEMENTS) {
    translated = translated.replaceAll(cn, `${en} `);
  }
  translated = translated.replace(/\s+/g, " ").trim();
  return /[\u4e00-\u9fff]/.test(translated) ? `${entry.cn_title} (CN Occupation)` : translated;
}

function splitSocCodes(value) {
  return String(value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function primarySocCode(row) {
  return splitSocCodes(row.airs_soc_code)[0] ?? "";
}

function makeCandidateFromAirsRecord(record) {
  if (!record) {
    return undefined;
  }
  return {
    soc_code: record.soc_code,
    title_en: record.title_en,
    title_zh: record.title_zh,
    score: 0.5,
    is_all_other: record.is_all_other ?? false,
  };
}

function buildThirdPassMissingReason(row, failureText, missingText) {
  const previousLabel = row.airs_title_zh || row.airs_title_en || "原 AIRS 职业";
  const previousCode = row.airs_soc_code || "—";
  return `第三轮清洗：原挂靠“${previousLabel}”（${previousCode}）${failureText}，该挂靠不成立；${missingText}，因此应保留为 missing。`;
}

function buildThirdPassRemapReason(row, candidate, whyText) {
  const previousLabel = row.airs_title_zh || row.airs_title_en || "原 AIRS 职业";
  const previousCode = row.airs_soc_code || "—";
  return `第三轮清洗：原挂靠“${previousLabel}”（${previousCode}）过窄或方向失准；改为并入“${candidate.title_zh || candidate.title_en}”（${candidate.soc_code}）更稳妥，因为${whyText}。AIRS 仍未单列该中国细分职业。`;
}

function buildThirdPassMissingReview(
  row,
  airsByCode,
  failureText,
  missingText,
  recommendedSocCode = "",
  needNewIndependentEntry = row.need_new_independent_entry === "true",
) {
  return {
    action: "missing",
    reason: buildThirdPassMissingReason(row, failureText, missingText),
    recommendedCandidate: makeCandidateFromAirsRecord(recommendedSocCode ? airsByCode.get(recommendedSocCode) : undefined),
    needNewIndependentEntry,
  };
}

function buildThirdPassRemapReview(
  row,
  airsByCode,
  socCode,
  whyText,
  needNewIndependentEntry = row.need_new_independent_entry === "true",
) {
  const candidate = makeCandidateFromAirsRecord(airsByCode.get(socCode));
  if (!candidate) {
    return null;
  }
  return {
    action: "remap",
    candidate,
    reason: buildThirdPassRemapReason(row, candidate, whyText),
    needNewIndependentEntry,
  };
}

function isChineseMedicineTitle(title) {
  return /中医|中西医结合|少数民族医/.test(title);
}

function choosePhysicianThirdPassTarget(title) {
  if (!/医师$/.test(title)) {
    return null;
  }
  const chineseMedicine = isChineseMedicineTitle(title);
  if (title === "宠物医师") {
    return {
      socCode: "29-1131.00",
      whyText: "该职业本质上属于兽医执业，比任何人类专科医师都更贴合",
      needNewIndependentEntry: false,
    };
  }
  if (title === "中医亚健康医师") {
    return { action: "missing" };
  }
  if (title === "健康教育医师") {
    return { action: "missing" };
  }
  if (title === "口腔科医师") {
    return {
      socCode: "29-1021.00",
      whyText: "其核心仍是口腔疾病诊疗，与综合牙医的职责边界明显更接近",
      needNewIndependentEntry: false,
    };
  }
  if (/全科医师$/.test(title)) {
    return {
      socCode: chineseMedicine ? "29-1229.00" : "29-1215.00",
      whyText: chineseMedicine
        ? "AIRS 未单列中医全科，只能保守挂靠到更宽口径的“其他医师”"
        : "其核心职责就是面向综合诊疗的全科/家庭医学服务",
      needNewIndependentEntry: false,
    };
  }
  if (/外科医师$/.test(title)) {
    return {
      socCode: chineseMedicine ? "29-1229.00" : "29-1249.00",
      whyText: chineseMedicine
        ? "AIRS 未单列中医外科，只能保守并入更宽口径的“其他医师”"
        : "其核心仍属于外科诊疗，较“小儿外科医师”明显更贴合",
      needNewIndependentEntry: false,
    };
  }
  if (/超声|核医学/.test(title)) {
    return {
      socCode: "29-1224.00",
      whyText: "其主要工作都落在医学影像或检查诊断领域，和放射/影像类医师更接近",
      needNewIndependentEntry: false,
    };
  }
  if (/妇科|妇幼/.test(title)) {
    return {
      socCode: chineseMedicine ? "29-1229.00" : "29-1218.00",
      whyText: chineseMedicine
        ? "AIRS 未单列中医妇科或妇幼保健专科，以“其他医师”作为保守挂靠更稳妥"
        : "其主要诊疗对象和职责都更接近妇产相关专科医师",
      needNewIndependentEntry: false,
    };
  }
  if (
    /耳鼻咽喉|传染病|肿瘤|疼痛|重症|医学遗传|临床检验|职业病|疾病控制|公共卫生|康复|针灸|推拿|营养|整脊|骨伤|肛肠|眼科/.test(
      title,
    ) ||
    chineseMedicine
  ) {
    return {
      socCode: "29-1229.00",
      whyText: "AIRS 未单列该细分专科，以“其他医师”作为更宽但不至于误导的保守挂靠更合适",
      needNewIndependentEntry: false,
    };
  }
  return {
    socCode: "29-1229.00",
    whyText: "AIRS 缺少对应专科时，用更宽口径的“其他医师”比误挂到无关专科更稳妥",
    needNewIndependentEntry: false,
  };
}

function reviewDesignMergeThirdPass(row, cnRecord, airsByCode) {
  const title = cnRecord.cn_title;
  if (/花艺/.test(title)) {
    return { action: "keep" };
  }
  if (title === "会展设计师") {
    return buildThirdPassRemapReview(row, airsByCode, "27-1027.00", "其核心职责是展陈与会展空间方案设计", false);
  }
  if (title === "装潢美术设计师") {
    return buildThirdPassRemapReview(row, airsByCode, "27-1025.00", "其核心职责更接近室内与装饰空间设计", false);
  }
  if (/纺织面料|家用纺织品|首饰|皮具|鞋类/.test(title)) {
    return buildThirdPassRemapReview(row, airsByCode, "27-1022.00", "其核心职责更接近服饰、配饰或面料方向的时尚设计", false);
  }
  if (/玩具|家具|陶瓷产品|灯具|照明|乐器|钟表|地毯/.test(title)) {
    return buildThirdPassRemapReview(row, airsByCode, "27-1021.00", "其核心职责更接近产品与工业设计", false);
  }
  if (title === "电子电路设计师") {
    return buildThirdPassRemapReview(row, airsByCode, "17-3012.00", "其工作内容更接近电气电子方案表达与制图", false);
  }
  if (title === "建筑幕墙设计师") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "只因“设计师”字面相似而被误挂，和建筑幕墙系统设计几乎没有职责重合",
      "AIRS 缺少可稳定代表幕墙专项设计的独立职业，继续并入会误导为花艺设计",
      "17-3011.00",
      true,
    );
  }
  if (title === "虚拟现实产品设计师") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "只因“设计师”字面相似而被误挂，和虚拟现实产品/交互设计没有实质重合",
      "AIRS 现有职业无法稳定表达虚拟现实产品设计这一数字化岗位",
      "15-1255.00",
      true,
    );
  }
  if (title === "形象设计师") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "只因“设计师”字面相似而被误挂，和花艺设计的服务对象与工作内容差异明显",
      "AIRS 缺少与中国形象设计服务稳定对应的独立职业，继续并入会误导前端展示",
      "27-1022.00",
      true,
    );
  }
  if (title === "酒体设计师") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "只因“设计师”字面相似而被误挂，和酒体研发调配职责不重合",
      "AIRS 现有设计类职业无法稳定覆盖酒体风味设计与调配工作",
      "",
      true,
    );
  }
  return buildThirdPassMissingReview(
    row,
    airsByCode,
    "只因“设计师”字面相似而被误挂，原锚点不具备足够职责重合",
    "当前 AIRS 中没有足够可信的更稳妥设计类挂靠对象",
    "",
    false,
  );
}

function reviewServiceMergeThirdPass(row, cnRecord, airsByCode) {
  const title = cnRecord.cn_title;
  if (title === "餐厅服务员") {
    return { action: "keep" };
  }
  if (title === "前厅服务员" || title === "旅店服务员") {
    return buildThirdPassRemapReview(row, airsByCode, "43-4081.00", "其核心职责是住宿接待与前台服务", false);
  }
  if (title === "客房服务员") {
    return buildThirdPassRemapReview(row, airsByCode, "37-2012.00", "其核心职责更接近客房整理与保洁服务", false);
  }
  if (title === "殡仪服务员") {
    return buildThirdPassRemapReview(row, airsByCode, "39-4021.00", "其核心职责落在殡葬流程服务，明显不是餐饮服务", false);
  }
  if (title === "呼叫中心服务员") {
    return buildThirdPassRemapReview(row, airsByCode, "43-4051.00", "其核心职责是电话受理、咨询答复与客户服务", false);
  }
  if (title === "航空运输地面服务员") {
    return buildThirdPassRemapReview(row, airsByCode, "53-6032.00", "其核心职责是航空地面或飞机服务保障", false);
  }
  if (title === "公共游览场所服务员") {
    return buildThirdPassRemapReview(row, airsByCode, "39-3031.00", "其核心职责更接近引导、检票和大厅接待", false);
  }
  if (title === "城市轨道交通服务员") {
    return buildThirdPassRemapReview(row, airsByCode, "53-6061.00", "其核心职责是客运服务与乘客协助", false);
  }
  if (title === "图书馆服务员") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "仅因“服务员”字面接近而被误挂，和餐饮服务职责并不相同",
      "AIRS 缺少稳定覆盖图书馆公共服务支持的独立职业",
      "25-4031.00",
      false,
    );
  }
  if (title === "家政服务员") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "只覆盖餐饮场景的服务流程，不能代表入户家政和家庭照料职责",
      "家政服务细分在 AIRS 中缺少稳定表达，继续并入会误导为餐饮岗位",
      "39-9099.00",
      true,
    );
  }
  return buildThirdPassMissingReview(
    row,
    airsByCode,
    "仅因“服务员”字面相似而被误挂，原锚点的工作场景明显不符",
    "AIRS 中暂无足够稳定的并入对象，继续保留为 missing 更稳妥",
    "",
    false,
  );
}

function reviewParkingMergeThirdPass(row, cnRecord, airsByCode) {
  const title = cnRecord.cn_title;
  if (title === "停车管理员") {
    return { action: "keep" };
  }
  if (title === "信息通信网络运行管理员" || title === "信息通信信息化系统管理员") {
    return buildThirdPassRemapReview(row, airsByCode, "15-1244.00", "其核心职责是网络与信息系统运行维护，而不是停车场值守", false);
  }
  if (title === "网络与信息安全管理员") {
    return buildThirdPassRemapReview(row, airsByCode, "15-1212.00", "其核心职责是信息安全监测、防护与风险处置", false);
  }
  if (title === "数据库运行管理员") {
    return buildThirdPassRemapReview(row, airsByCode, "15-1242.00", "其核心职责是数据库运行、备份和维护", false);
  }
  if (title === "智能楼宇管理员") {
    return buildThirdPassRemapReview(row, airsByCode, "11-3013.00", "其核心职责更接近楼宇设施与系统运行管理", false);
  }
  if (title === "仓储管理员") {
    return buildThirdPassRemapReview(row, airsByCode, "11-3071.00", "其核心职责更接近仓储与配送环节的运营管理", false);
  }
  if (title === "后勤管理员") {
    return buildThirdPassRemapReview(row, airsByCode, "11-3012.00", "其核心职责更接近行政后勤与综合事务管理", false);
  }
  if (title === "保卫管理员") {
    return buildThirdPassRemapReview(row, airsByCode, "33-1091.00", "其核心职责更接近安全保卫人员的组织与管理", false);
  }
  if (title === "劳务派遣管理员") {
    return buildThirdPassRemapReview(row, airsByCode, "13-1071.00", "其核心职责更接近招聘、用工匹配和人力资源服务", false);
  }
  if (title === "公墓管理员") {
    return buildThirdPassRemapReview(row, airsByCode, "39-4021.00", "其工作场景和服务对象更接近殡葬服务", false);
  }
  if (title === "公共场所卫生管理员" || title === "消防安全管理员") {
    return buildThirdPassRemapReview(row, airsByCode, "19-5011.00", "其核心职责是卫生或安全风险控制，与安全卫生专员更接近", false);
  }
  if (title === "体育场馆管理员") {
    return buildThirdPassRemapReview(row, airsByCode, "11-9072.00", "其核心职责更接近场馆与康乐设施运营管理", false);
  }
  if (title === "客户服务管理员") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "只因“管理员”字面相似而被误挂，和停车场值守职责没有实质重合",
      "AIRS 中缺少与中国客户服务管理岗位稳定对应的独立职业",
      "43-4051.00",
      false,
    );
  }
  if (title === "市场管理员" || title === "社团会员管理员" || title === "消防装备管理员") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "只因“管理员”字面相似而被误挂，和停车场管理员的职责边界明显不同",
      "当前 AIRS 中没有足够可信的稳定挂靠对象，继续并入会误导前端理解",
      "",
      false,
    );
  }
  if (/储能|电能质量|电力可靠性/.test(title)) {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "只因“管理员”字面相似而被误挂，和电力运行、储能运维职责明显不符",
      "该类绿色电力新岗位在 AIRS 中缺少足够贴合的独立职业",
      "",
      true,
    );
  }
  return buildThirdPassMissingReview(
    row,
    airsByCode,
    "只因“管理员”字面相似而被误挂，原锚点无法解释其真实工作内容",
    "AIRS 中暂无足够稳定的更优挂靠对象，保留为 missing 更稳妥",
    "",
    false,
  );
}

function reviewBrokerMergeThirdPass(row, cnRecord, airsByCode) {
  const title = cnRecord.cn_title;
  if (title === "保险经纪人") {
    return buildThirdPassRemapReview(row, airsByCode, "41-3021.00", "其核心职责是保险产品配置、解释与销售服务", false);
  }
  if (title === "文化经纪人" || title === "体育经纪人" || title === "版权经纪人") {
    return buildThirdPassRemapReview(row, airsByCode, "13-1011.00", "其核心职责是文体资源或版权代理与商务经纪", false);
  }
  if (title === "劳务经纪人") {
    return buildThirdPassRemapReview(row, airsByCode, "13-1071.00", "其核心职责更接近劳务撮合、招聘和人力资源服务", false);
  }
  return buildThirdPassMissingReview(
    row,
    airsByCode,
    "只因“经纪人”字面相似而被误挂，和房地产经纪的交易对象与职责差异明显",
    "AIRS 缺少与该类商品、车辆或农业服务经纪稳定对应的独立职业",
    "",
    false,
  );
}

function reviewCounselorMergeThirdPass(row, cnRecord, airsByCode) {
  const title = cnRecord.cn_title;
  if (title === "心理咨询师") {
    return buildThirdPassRemapReview(row, airsByCode, "21-1014.00", "其核心职责是心理与行为问题咨询，比康复咨询更直接贴合", false);
  }
  if (title === "工伤预防咨询师") {
    return buildThirdPassRemapReview(row, airsByCode, "19-5011.00", "其核心职责是职业伤害预防与安全风险管理", false);
  }
  if (title === "科技咨询师") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "只因“咨询师”字面相似而被误挂，和康复咨询在服务对象与知识结构上差异明显",
      "AIRS 缺少稳定对应科技咨询与技术顾问服务的独立职业",
      "",
      false,
    );
  }
  if (title === "家庭教育指导师") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "只能覆盖学校/升学导向的咨询场景，无法代表以家庭教育关系和养育指导为核心的职业",
      "该职业已有较强独立社会认知，继续并入会误导前端展示为教育升学顾问",
      "21-1012.00",
      true,
    );
  }
  if (title === "生殖健康咨询师") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "遗传咨询只覆盖其中一部分遗传风险沟通，不能代表生殖健康全流程咨询职责",
      "AIRS 缺少稳定覆盖中国生殖健康咨询服务的独立职业",
      "29-9092.00",
      true,
    );
  }
  if (title === "出生缺陷防控咨询师") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "遗传咨询只能覆盖其中一部分遗传风险沟通，无法代表筛查、干预和防控协同职责",
      "该职业已具较强独立认知，继续并入会误导为单纯遗传咨询",
      "29-9092.00",
      true,
    );
  }
  if (title === "康复辅助技术咨询师") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "康复咨询无法完整覆盖辅具评估、适配和辅助技术方案设计职责",
      "AIRS 缺少稳定对应康复辅助技术咨询的独立职业，保留为 missing 更稳妥",
      "21-1015.00",
      true,
    );
  }
  return { action: "keep" };
}

function reviewMergedMatchThirdPass(row, cnRecord, airsByCode) {
  const title = cnRecord.cn_title;
  const currentCode = primarySocCode(row);

  if (title === "网约配送员") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "只覆盖一般快递/信使场景，不能代表平台接单、众包履约和即时配送逻辑",
      "AIRS 现有职业无法稳定呈现中国平台即时配送这一独立职业形态",
      "43-5021.00",
      true,
    );
  }
  if (title === "民宿管家") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "只能覆盖部分礼宾或前台接待场景，无法代表房态管理、住客体验与平台运营一体化职责",
      "该职业已有较强独立认知，继续并入会误导为传统酒店前台/礼宾岗位",
      "39-6012.00",
      true,
    );
  }
  if (title === "供应链管理师") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "仅能覆盖物流分析的一部分职责，无法代表采购、计划协同、库存优化与供应网络治理",
      "该职业边界已明显超出传统物流师，继续并入会弱化其独立职业认知",
      "13-1081.00",
      true,
    );
  }
  if (title === "跨境电商运营管理师") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "只能覆盖营销管理中的局部职责，无法代表跨境平台、商品、物流、合规和店铺运营一体化工作",
      "该职业具有明确平台经济和跨境电商属性，继续并入会误导为传统市场营销岗位",
      "13-1161.00",
      true,
    );
  }
  if (title === "人工智能训练师") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "只覆盖算法分析的一部分职责，无法代表数据标注、训练集构建、评测和模型调优工作",
      "该职业已形成较强独立认知，继续并入会误导为数据科学家",
      "15-2051.00",
      true,
    );
  }
  if (title === "建筑信息模型技术员") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "只能覆盖制图环节，无法代表 BIM 建模、协同、碰撞检查与信息管理职责",
      "BIM 已具有明确独立社会认知，继续并入会误导前端展示为传统制图员",
      "17-3011.00",
      true,
    );
  }
  if (title === "碳管理工程技术人员") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "只覆盖环境科学的一部分观察分析职责，无法代表碳核算、履约、减排方案与管理闭环",
      "该职业属于双碳方向新岗位，AIRS 中暂无足够稳定的独立或并入对象",
      "19-2041.00",
      true,
    );
  }
  if (title === "供应链工程技术人员") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "只覆盖物流分析的一部分职责，无法代表工程化的供应网络设计、系统协同和流程优化工作",
      "AIRS 暂无足够稳定的供应链工程技术类独立职业，继续并入会误导为传统物流岗位",
      "13-1081.00",
      false,
    );
  }
  if (title === "人工智能工程技术人员") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "只覆盖数据科学的一部分职责，无法代表工程化的模型部署、系统开发和应用落地",
      "AIRS 暂无足够稳定的人工智能工程技术独立职业，继续并入会误导为纯数据科学岗位",
      "15-2051.00",
      true,
    );
  }
  if (title === "健康教育医师") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "只能覆盖一般健康教育职责，无法代表具有医师执业属性的健康教育岗位",
      "AIRS 中缺少既保留医师属性又覆盖健康教育职责的稳定独立职业，继续并入会误导前端理解",
      "21-1091.00",
      false,
    );
  }
  if (title === "孤残儿童护理员") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "只能覆盖一般护理辅助，无法代表福利机构场景下对孤残儿童的长期照护与康复支持",
      "该职业属于家政/照护细分岗位，继续并入会弱化其独立服务场景",
      "31-1131.00",
      true,
    );
  }
  if (title === "宠物健康护理员") {
    return buildThirdPassRemapReview(row, airsByCode, "31-9096.00", "其服务对象是宠物健康护理，更接近兽医助理体系", false);
  }
  if (title === "口腔修复技师") {
    return buildThirdPassRemapReview(row, airsByCode, "51-9081.00", "其核心职责是修复体和义齿制作，更接近牙科实验室技术员", false);
  }
  if (title === "病理技师") {
    return buildThirdPassRemapReview(row, airsByCode, "29-2012.00", "其核心职责是病理标本处理与临床实验室技术支持", false);
  }
  if (title === "消毒技师" || title === "神经电生理脑电图技师" || title === "康复技师") {
    return buildThirdPassRemapReview(row, airsByCode, "29-2099.00", "其核心职责是专项卫生技术支持，用宽口径卫生技师挂靠更稳妥", false);
  }

  if (currentCode === "27-1023.00") {
    return reviewDesignMergeThirdPass(row, cnRecord, airsByCode);
  }
  if (currentCode === "35-3031.00") {
    return reviewServiceMergeThirdPass(row, cnRecord, airsByCode);
  }
  if (currentCode === "53-6021.00" || currentCode === "33-3031.00") {
    return reviewParkingMergeThirdPass(row, cnRecord, airsByCode);
  }
  if (currentCode === "41-9021.00") {
    return reviewBrokerMergeThirdPass(row, cnRecord, airsByCode);
  }
  if (currentCode === "21-1015.00" || currentCode === "21-1012.00" || currentCode === "29-9092.00") {
    return reviewCounselorMergeThirdPass(row, cnRecord, airsByCode);
  }
  if (
    /医师$/.test(title) &&
    ["29-1241.00", "29-1242.00", "29-1243.00", "29-1024.00", "29-1071.00"].includes(currentCode)
  ) {
    const target = choosePhysicianThirdPassTarget(title);
    if (target?.action === "missing") {
      const recommendedSocCode = title === "健康教育医师" ? "21-1091.00" : "29-1229.00";
      return buildThirdPassMissingReview(
        row,
        airsByCode,
        "仅靠专科名称的局部相似被误挂，原锚点无法代表该医师岗位的实际执业范围",
        "AIRS 暂无足够贴合的独立专科职业，继续强行并入会误导前端理解",
        recommendedSocCode,
        title !== "健康教育医师",
      );
    }
    if (target?.socCode) {
      return buildThirdPassRemapReview(row, airsByCode, target.socCode, target.whyText, target.needNewIndependentEntry);
    }
  }
  if (currentCode === "29-2051.00" && title !== "临床营养技师") {
    return buildThirdPassMissingReview(
      row,
      airsByCode,
      "原挂靠只适合营养技术场景，无法代表该卫生技术岗位的核心工作内容",
      "AIRS 缺少与该细分卫生技术岗位稳定对应的独立职业，保留为 missing 更稳妥",
      "29-2099.00",
      false,
    );
  }
  return { action: "keep" };
}

function applyThirdPassMergedCleanup(resultsV2, cnByCode, airsByCode) {
  let changedMergedToMissing = 0;
  const revoked = [];

  const adjusted = resultsV2.map((row) => {
    if (row.match_status !== "merged_match") {
      return row;
    }
    const cnRecord = cnByCode.get(row.cn_code) ?? { cn_title: row.cn_title };
    const review = reviewMergedMatchThirdPass(row, cnRecord, airsByCode);
    if (!review || review.action === "keep") {
      return row;
    }
    if (review.action === "missing") {
      changedMergedToMissing += 1;
      const updated = {
        ...row,
        airs_soc_code: "",
        airs_title_en: "",
        airs_title_zh: "",
        match_status: "missing",
        reason: review.reason,
        need_new_independent_entry: String(review.needNewIndependentEntry),
        _best: review.recommendedCandidate,
      };
      revoked.push({
        ...updated,
        previous_soc_code: row.airs_soc_code,
        previous_title_en: row.airs_title_en,
        previous_title_zh: row.airs_title_zh,
      });
      return updated;
    }
    if (review.action === "remap") {
      return {
        ...row,
        airs_soc_code: review.candidate.soc_code,
        airs_title_en: review.candidate.title_en,
        airs_title_zh: review.candidate.title_zh,
        reason: review.reason,
        need_new_independent_entry: String(review.needNewIndependentEntry),
        _best: review.candidate,
      };
    }
    return row;
  });

  return { adjusted, changedMergedToMissing, revoked };
}

function scoreMergedConfidence(row) {
  if (row.match_status !== "merged_match") {
    return -999;
  }
  const title = row.cn_title;
  const anchorText = `${row.airs_title_en} ${row.airs_title_zh}`;
  const flags = row._flags ?? {};
  let score = 0;

  if (row.need_new_independent_entry === "false") {
    score += 8;
  }
  if (!flags.isPlatform && !flags.isGreen && !flags.isDigitalAgriculture && !flags.isCare && !flags.isNewOccupation) {
    score += 10;
  }
  if (!splitSocCodes(row.airs_soc_code).some((code) => THIRD_PASS_SUSPICIOUS_ANCHOR_CODES.has(code))) {
    score += 12;
  } else {
    score -= 10;
  }
  if (/医师/.test(title) && /(Physician|Surgeon|Dentist|Veterinarian)/i.test(anchorText)) {
    score += 16;
  }
  if (/护士/.test(title) && /Nurse/i.test(anchorText)) {
    score += 16;
  }
  if (/演员/.test(title) && /\bActors\b/i.test(anchorText)) {
    score += 16;
  }
  if (/编辑/.test(title) && /\bEditors\b/i.test(anchorText)) {
    score += 14;
  }
  if (/记者/.test(title) && /(Journalists|Reporters)/i.test(anchorText)) {
    score += 14;
  }
  if (/办事员|收发员|文员/.test(title) && /(Clerk|Reception|Mail)/i.test(anchorText)) {
    score += 14;
  }
  if (/服务员/.test(title) && /(Customer Service|Desk Clerks|Passenger Attendants|Funeral Attendants|Waiters|Ushers|Aircraft Service Attendants)/i.test(anchorText)) {
    score += 10;
  }
  if (/经纪人/.test(title) && /(Agent|Broker|Managers)/i.test(anchorText)) {
    score += 10;
  }
  if (/管理员/.test(title) && /(Administrator|Managers|Supervisors|Security)/i.test(anchorText)) {
    score += 10;
  }
  if (/技师|技术员/.test(title) && /(Technician|Technologists)/i.test(anchorText)) {
    score += 10;
  }
  if (row.reason.startsWith("第三轮清洗：原挂靠")) {
    score += 4;
  }
  return score;
}

function retainedExampleCategory(row) {
  const title = row.cn_title;
  if (/医师/.test(title)) {
    return "physician";
  }
  if (/护士/.test(title)) {
    return "nurse";
  }
  if (/演员/.test(title)) {
    return "actor";
  }
  if (/编辑|记者/.test(title)) {
    return "media";
  }
  if (/办事员|收发员|文员/.test(title)) {
    return "clerical";
  }
  if (/管理员/.test(title)) {
    return "administrator";
  }
  if (/设计师/.test(title)) {
    return "designer";
  }
  if (/服务员/.test(title)) {
    return "service";
  }
  if (/经纪人/.test(title)) {
    return "broker";
  }
  if (/技师|技术员/.test(title)) {
    return "technician";
  }
  return "other";
}

function pickDiverseRetainedMergedExamples(rows, limit = 30, perCategoryLimit = 6) {
  const picked = [];
  const categoryCounts = new Map();
  for (const row of rows) {
    if (picked.length >= limit) {
      break;
    }
    const category = retainedExampleCategory(row);
    const count = categoryCounts.get(category) ?? 0;
    if (count >= perCategoryLimit) {
      continue;
    }
    picked.push(row);
    categoryCounts.set(category, count + 1);
  }
  if (picked.length >= limit) {
    return picked;
  }
  for (const row of rows) {
    if (picked.length >= limit) {
      break;
    }
    if (picked.some((item) => item.cn_code === row.cn_code)) {
      continue;
    }
    picked.push(row);
  }
  return picked;
}

function buildSummaryV3Markdown(results, changedMergedToMissing, revokedExamples) {
  const counts = {
    total: results.length,
    exact_match: 0,
    merged_match: 0,
    one_to_many: 0,
    missing: 0,
  };
  for (const row of results) {
    counts[row.match_status] += 1;
  }

  const retainedMerged = pickDiverseRetainedMergedExamples(
    results
    .filter((row) => row.match_status === "merged_match")
    .map((row) => ({ ...row, confidence_score: scoreMergedConfidence(row) }))
    .sort((left, right) => {
      if (right.confidence_score !== left.confidence_score) {
        return right.confidence_score - left.confidence_score;
      }
      return left.cn_code.localeCompare(right.cn_code, "zh-Hans-CN");
    }),
    30,
    6,
  );

  const revoked = revokedExamples
    .map((row) => ({
      ...row,
      priority_score: calculatePriority(row),
      priority: priorityLabel(calculatePriority(row)),
    }))
    .sort((left, right) => {
      if (right.priority_score !== left.priority_score) {
        return right.priority_score - left.priority_score;
      }
      return left.cn_code.localeCompare(right.cn_code, "zh-Hans-CN");
    })
    .slice(0, 30);

  const priorityCandidates = results
    .filter(
      (row) =>
        row.match_status === "missing" ||
        row.match_status === "one_to_many" ||
        row.need_new_independent_entry === "true",
    )
    .map((row) => {
      const priorityScore = calculatePriority(row);
      const anchor = recommendedAnchor(row);
      return {
        ...row,
        priority_score: priorityScore,
        priority: priorityLabel(priorityScore),
        priority_factors: buildPriorityFactors(row),
        suggested_display_name: suggestDisplayName(row),
        suggested_english_name: suggestEnglishName(row),
        anchor_title_zh: anchor.titleZh,
        anchor_soc_code: anchor.socCode,
        suggest_independent_card: row.need_new_independent_entry === "true" ? "yes" : "no",
      };
    })
    .sort((left, right) => {
      if (right.priority_score !== left.priority_score) {
        return right.priority_score - left.priority_score;
      }
      if (left.match_status !== right.match_status) {
        const order = { missing: 0, one_to_many: 1, merged_match: 2, exact_match: 3 };
        return order[left.match_status] - order[right.match_status];
      }
      return left.cn_code.localeCompare(right.cn_code, "zh-Hans-CN");
    });

  const top100 = priorityCandidates.slice(0, 100);
  const lines = [];
  lines.push("# 中国职业 vs AIRS 覆盖总结（第三轮清洗）");
  lines.push("");
  lines.push("## 统计");
  lines.push("");
  lines.push(`- 中国职业总数：${counts.total}`);
  lines.push(`- exact_match：${counts.exact_match}`);
  lines.push(`- merged_match：${counts.merged_match}`);
  lines.push(`- one_to_many：${counts.one_to_many}`);
  lines.push(`- missing：${counts.missing}`);
  lines.push(`- 本轮从 merged_match 调整回 missing 的数量：${changedMergedToMissing}`);
  lines.push("");
  lines.push("## 第三轮原则");
  lines.push("");
  lines.push("- 本轮不再追求大幅压缩 missing，重点清洗明显不合理的 merged 挂靠项。");
  lines.push("- 对平台经济、电商/直播/内容、双碳/绿色经济、BIM/数字建造、健康照护、互联网运营、社区服务和中国新职业从严复核。");
  lines.push("- 对传统常规职业，若能改挂到更稳妥的 AIRS 主职业则保留 merged；若只能落到过宽或错误锚点，则改回 missing。");
  lines.push("");
  lines.push("## 本轮保留的高置信 merged_match 示例 30 条");
  lines.push("");
  lines.push("| cn_code | cn_title | airs_soc_code | airs_title_zh | confidence | reason |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const row of retainedMerged) {
    lines.push(
      `| ${row.cn_code} | ${row.cn_title} | ${row.airs_soc_code} | ${row.airs_title_zh} | ${row.confidence_score} | ${row.reason.replace(/\|/g, "／")} |`,
    );
  }
  lines.push("");
  lines.push("## 本轮撤销的低置信 merged_match 示例 30 条");
  lines.push("");
  lines.push("| cn_code | cn_title | original_airs | priority | reason |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const row of revoked) {
    const originalAirs = [row.previous_title_zh || row.previous_title_en || "—", row.previous_soc_code || ""]
      .filter(Boolean)
      .join(" / ");
    lines.push(
      `| ${row.cn_code} | ${row.cn_title} | ${originalAirs.replace(/\|/g, "／")} | ${row.priority} | ${row.reason.replace(/\|/g, "／")} |`,
    );
  }
  lines.push("");
  lines.push("## 当前最可信的前 100 个优先补库职业");
  lines.push("");
  lines.push("| priority | cn_code | cn_title | suggested_display_name | recommended_english_name | match_status | recommended_anchor_airs | recommended_anchor_soc_code | suggest_independent_card | priority_factors | reason |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const row of top100) {
    const anchorTitle = row.anchor_title_zh || "—";
    const anchorCode = row.anchor_soc_code || "—";
    const factors = (row.priority_factors || "—").replace(/\|/g, "／");
    const reason = row.reason.replace(/\|/g, "／");
    lines.push(
      `| ${row.priority} | ${row.cn_code} | ${row.cn_title} | ${row.suggested_display_name} | ${row.suggested_english_name} | ${row.match_status} | ${anchorTitle} | ${anchorCode} | ${row.suggest_independent_card} | ${factors} | ${reason} |`,
    );
  }
  return `${lines.join("\n")}\n`;
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
  for (const row of rows) {
    lines.push(columns.map((column) => csvEscape(row[column] ?? "")).join(","));
  }
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

function calculatePriority(entry) {
  const flags = entry._flags ?? {};
  let score = 0;
  if (entry.need_new_independent_entry === "true") {
    score += 40;
  }
  if (flags.isNewOccupation) {
    score += 30;
  }
  if (flags.isPlatform) {
    score += 24;
  }
  if (flags.isGreen) {
    score += 22;
  }
  if (flags.isDigitalAgriculture) {
    score += 18;
  }
  if (flags.isCare) {
    score += 16;
  }
  if (entry.match_status === "missing") {
    score += 12;
  } else if (entry.match_status === "one_to_many") {
    score += 8;
  } else if (entry.match_status === "merged_match") {
    score += 6;
  }
  if (flags.clearlyNotIndependent) {
    score -= 28;
  }
  return Math.max(score, 0);
}

function priorityLabel(score) {
  if (score >= 80) {
    return "P1";
  }
  if (score >= 60) {
    return "P2";
  }
  if (score >= 40) {
    return "P3";
  }
  return "P4";
}

function buildPriorityFactors(entry) {
  const flags = entry._flags ?? {};
  const labels = [];
  if (flags.isNewOccupation) {
    labels.push("新职业");
  }
  if (flags.isPlatform) {
    labels.push("平台/电商/直播");
  }
  if (flags.isGreen) {
    labels.push("双碳/绿色");
  }
  if (flags.isDigitalAgriculture) {
    labels.push("数字农业");
  }
  if (flags.isCare) {
    labels.push("家政/照护");
  }
  if (flags.clearlyNotIndependent) {
    labels.push("不宜独立");
  }
  return labels.join("、");
}

function buildSummaryMarkdown(results) {
  const counts = {
    total: results.length,
    exact_match: 0,
    merged_match: 0,
    one_to_many: 0,
    missing: 0,
  };
  for (const row of results) {
    counts[row.match_status] += 1;
  }

  const priorityCandidates = results
    .filter(
      (row) =>
        row.match_status === "missing" ||
        row.need_new_independent_entry === "true" ||
        row.match_status === "one_to_many",
    )
    .map((row) => {
      const priorityScore = calculatePriority(row);
      return {
        ...row,
        priority_score: priorityScore,
        priority: priorityLabel(priorityScore),
        priority_factors: buildPriorityFactors(row),
      };
    })
    .sort((left, right) => {
      if (right.priority_score !== left.priority_score) {
        return right.priority_score - left.priority_score;
      }
      if (left.match_status !== right.match_status) {
        const order = { missing: 0, one_to_many: 1, merged_match: 2, exact_match: 3 };
        return order[left.match_status] - order[right.match_status];
      }
      return left.cn_code.localeCompare(right.cn_code, "zh-Hans-CN");
    });

  const top50 = priorityCandidates.slice(0, 50);
  const lines = [];
  lines.push("# 中国职业 vs AIRS 覆盖总结");
  lines.push("");
  lines.push("## 数据说明");
  lines.push("");
  lines.push("- AIRS 数据源：`backend/data/airs_data.json`。");
  lines.push("- 中国职业数据源：官方职业分类系统 API `https://www.osta.org.cn/api/client/...`（工作区中未发现用户提供的 csv/xlsx，因此改用官方结构化接口）。");
  lines.push("- 判定流程：精确名称匹配 -> 别名匹配 -> 关键词/定义近似匹配 -> 人工可审核规则。");
  lines.push("");
  lines.push("## 统计");
  lines.push("");
  lines.push(`- 中国职业总数：${counts.total}`);
  lines.push(`- exact_match：${counts.exact_match}`);
  lines.push(`- merged_match：${counts.merged_match}`);
  lines.push(`- one_to_many：${counts.one_to_many}`);
  lines.push(`- missing：${counts.missing}`);
  lines.push("");
  lines.push("## 最值得优先补库的前 50 个职业");
  lines.push("");
  lines.push("| priority | cn_code | cn_title | match_status | suggested_soc | priority_factors | reason |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const row of top50) {
    const suggestedSoc = (row.airs_title_zh || "—").replace(/\s*\|\s*/g, " / ");
    const factors = (row.priority_factors || "—").replace(/\|/g, "／");
    const reason = row.reason.replace(/\|/g, "／");
    lines.push(
      `| ${row.priority} | ${row.cn_code} | ${row.cn_title} | ${row.match_status} | ${suggestedSoc} | ${factors} | ${reason} |`,
    );
  }
  lines.push("");
  lines.push("## 备注");
  lines.push("");
  lines.push("- `merged_match` 表示 AIRS 里没有足够清晰的独立中国职业条目，只能并入更宽泛的 SOC。");
  lines.push("- `missing` 表示没有找到足够可信的对应关系，或只能落到很宽泛/牵强的 SOC。");
  lines.push("- `priority` 主要由“新职业”“平台经济/电商/直播”“双碳/绿色经济”“数字农业”“家政/照护”以及“是否适合单独建库”共同决定。");
  return `${lines.join("\n")}\n`;
}

function buildSummaryV2Markdown(results, changedMissingToMerged) {
  const counts = {
    total: results.length,
    exact_match: 0,
    merged_match: 0,
    one_to_many: 0,
    missing: 0,
  };
  for (const row of results) {
    counts[row.match_status] += 1;
  }

  const priorityCandidates = results
    .filter(
      (row) =>
        row.match_status === "missing" ||
        row.need_new_independent_entry === "true" ||
        row.match_status === "one_to_many",
    )
    .map((row) => {
      const priorityScore = calculatePriority(row);
      const anchor = recommendedAnchor(row);
      return {
        ...row,
        priority_score: priorityScore,
        priority: priorityLabel(priorityScore),
        priority_factors: buildPriorityFactors(row),
        suggested_display_name: suggestDisplayName(row),
        anchor_title_zh: anchor.titleZh,
        anchor_soc_code: anchor.socCode,
      };
    })
    .sort((left, right) => {
      if (right.priority_score !== left.priority_score) {
        return right.priority_score - left.priority_score;
      }
      if (left.match_status !== right.match_status) {
        const order = { missing: 0, one_to_many: 1, merged_match: 2, exact_match: 3 };
        return order[left.match_status] - order[right.match_status];
      }
      return left.cn_code.localeCompare(right.cn_code, "zh-Hans-CN");
    });

  const top100 = priorityCandidates.slice(0, 100);
  const lines = [];
  lines.push("# 中国职业 vs AIRS 覆盖总结（第二轮收敛）");
  lines.push("");
  lines.push("## 统计");
  lines.push("");
  lines.push(`- 中国职业总数：${counts.total}`);
  lines.push(`- exact_match：${counts.exact_match}`);
  lines.push(`- merged_match：${counts.merged_match}`);
  lines.push(`- one_to_many：${counts.one_to_many}`);
  lines.push(`- missing：${counts.missing}`);
  lines.push(`- 本轮从 missing 调整为 merged_match 的数量：${changedMissingToMerged}`);
  lines.push("");
  lines.push("## 第二轮原则");
  lines.push("");
  lines.push("- 重点压缩制造业、建筑业、交通运输、行政文员、传统教育医疗财会、农林牧渔常规职业中的明显可并入项。");
  lines.push("- 平台经济、电商/直播/内容、双碳/绿色经济、数字农业、家政/照护细分、中国新职业等方向继续保持谨慎，默认不因第二轮而放宽。");
  lines.push("");
  lines.push("## 仍建议优先补库的前 100 个职业");
  lines.push("");
  lines.push("| priority | cn_code | cn_title | suggested_display_name | match_status | anchor_airs | anchor_soc_code | priority_factors | reason |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const row of top100) {
    const anchorTitle = row.anchor_title_zh || "—";
    const anchorCode = row.anchor_soc_code || "—";
    const factors = (row.priority_factors || "—").replace(/\|/g, "／");
    const reason = row.reason.replace(/\|/g, "／");
    lines.push(
      `| ${row.priority} | ${row.cn_code} | ${row.cn_title} | ${row.suggested_display_name} | ${row.match_status} | ${anchorTitle} | ${anchorCode} | ${factors} | ${reason} |`,
    );
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  ensureDir(OUTPUT_DIR);

  console.log("Loading official CN occupation data...");
  const cnOccupations = withPreparedCnFeatures(await loadCnOccupations());
  console.log(`CN occupations loaded: ${cnOccupations.length}`);

  console.log("Loading AIRS occupations...");
  const airsOccupations = loadAirsOccupations();
  const airsByCode = new Map(airsOccupations.map((item) => [item.soc_code, item]));
  const cnByCode = new Map(cnOccupations.map((item) => [item.cn_code, item]));

  console.log("Building similarity index...");
  const idf = buildIdf(buildDocsForIdf(cnOccupations, airsOccupations));

  console.log("Matching occupations...");
  const candidateMap = new Map();
  const results = cnOccupations.map((cnRecord) => {
    const candidates = airsOccupations
      .map((airsRecord) => buildCandidateScore(cnRecord, airsRecord, idf))
      .sort((left, right) => right.score - left.score)
      .slice(0, 8);
    candidateMap.set(cnRecord.cn_code, candidates);
    return classifyByCandidates(cnRecord, candidates, airsByCode);
  });

  const fullRows = toFlatRows(results);

  writeCsv(path.join(OUTPUT_DIR, "cn_vs_airs_full_mapping.csv"), fullRows, [
    "cn_code",
    "cn_title",
    "cn_definition",
    "airs_soc_code",
    "airs_title_en",
    "airs_title_zh",
    "match_status",
    "reason",
    "need_new_independent_entry",
  ]);

  writeCsv(
    path.join(OUTPUT_DIR, "cn_missing_in_airs.csv"),
    fullRows.filter((row) => row.match_status === "missing"),
    [
      "cn_code",
      "cn_title",
      "cn_definition",
      "airs_soc_code",
      "airs_title_en",
      "airs_title_zh",
      "match_status",
      "reason",
      "need_new_independent_entry",
    ],
  );

  writeCsv(
    path.join(OUTPUT_DIR, "cn_independent_but_merged_in_airs.csv"),
    fullRows.filter(
      (row) => row.match_status === "merged_match" && row.need_new_independent_entry === "true",
    ),
    [
      "cn_code",
      "cn_title",
      "cn_definition",
      "airs_soc_code",
      "airs_title_en",
      "airs_title_zh",
      "match_status",
      "reason",
      "need_new_independent_entry",
    ],
  );

  fs.writeFileSync(path.join(OUTPUT_DIR, "summary.md"), buildSummaryMarkdown(results), "utf8");

  console.log("Applying second-pass convergence for traditional occupations...");
  const { adjusted: resultsV2, changedMissingToMerged } = applySecondPassConvergence(results, cnByCode, candidateMap);
  const fullRowsV2 = toFlatRows(resultsV2);

  writeCsv(path.join(OUTPUT_DIR, "cn_vs_airs_full_mapping_v2.csv"), fullRowsV2, [
    "cn_code",
    "cn_title",
    "cn_definition",
    "airs_soc_code",
    "airs_title_en",
    "airs_title_zh",
    "match_status",
    "reason",
    "need_new_independent_entry",
  ]);

  writeCsv(
    path.join(OUTPUT_DIR, "cn_missing_in_airs_v2.csv"),
    fullRowsV2.filter((row) => row.match_status === "missing"),
    [
      "cn_code",
      "cn_title",
      "cn_definition",
      "airs_soc_code",
      "airs_title_en",
      "airs_title_zh",
      "match_status",
      "reason",
      "need_new_independent_entry",
    ],
  );

  writeCsv(
    path.join(OUTPUT_DIR, "cn_independent_but_merged_in_airs_v2.csv"),
    fullRowsV2.filter(
      (row) => row.match_status === "merged_match" && row.need_new_independent_entry === "true",
    ),
    [
      "cn_code",
      "cn_title",
      "cn_definition",
      "airs_soc_code",
      "airs_title_en",
      "airs_title_zh",
      "match_status",
      "reason",
      "need_new_independent_entry",
    ],
  );

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "summary_v2.md"),
    buildSummaryV2Markdown(resultsV2, changedMissingToMerged),
    "utf8",
  );

  console.log("Applying third-pass merged cleanup...");
  const { adjusted: resultsV3, changedMergedToMissing, revoked } = applyThirdPassMergedCleanup(
    resultsV2,
    cnByCode,
    airsByCode,
  );
  const fullRowsV3 = toFlatRows(resultsV3);

  writeCsv(path.join(OUTPUT_DIR, "cn_vs_airs_full_mapping_v3_clean.csv"), fullRowsV3, [
    "cn_code",
    "cn_title",
    "cn_definition",
    "airs_soc_code",
    "airs_title_en",
    "airs_title_zh",
    "match_status",
    "reason",
    "need_new_independent_entry",
  ]);

  writeCsv(
    path.join(OUTPUT_DIR, "cn_missing_in_airs_v3_clean.csv"),
    fullRowsV3.filter((row) => row.match_status === "missing"),
    [
      "cn_code",
      "cn_title",
      "cn_definition",
      "airs_soc_code",
      "airs_title_en",
      "airs_title_zh",
      "match_status",
      "reason",
      "need_new_independent_entry",
    ],
  );

  writeCsv(
    path.join(OUTPUT_DIR, "cn_independent_but_merged_in_airs_v3_clean.csv"),
    fullRowsV3.filter(
      (row) => row.match_status === "merged_match" && row.need_new_independent_entry === "true",
    ),
    [
      "cn_code",
      "cn_title",
      "cn_definition",
      "airs_soc_code",
      "airs_title_en",
      "airs_title_zh",
      "match_status",
      "reason",
      "need_new_independent_entry",
    ],
  );

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "summary_v3_clean.md"),
    buildSummaryV3Markdown(resultsV3, changedMergedToMissing, revoked),
    "utf8",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
