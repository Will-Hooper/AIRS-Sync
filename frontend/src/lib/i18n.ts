export type AppLanguage = "en" | "zh";

type LabelKey = "stable" | "light" | "augmenting" | "restructuring" | "high_risk";

const STORAGE_KEY = "airs-language";

export const messages = {
  en: {
    appName: "AIRS",
    heroKicker: "AI Recruitment Stability Score",
    heroTitleLines: [
      "Read every occupation clearly,",
      "and see whether AI is assisting or compressing it."
    ],
    heroText:
      "AIRS stands for AI Recruitment Stability Score. It does not try to guess whether a job will disappear someday. It asks a narrower and more useful question: once AI enters a workflow, are employers already reducing openings, simplifying roles, or reorganizing how that occupation is staffed?",
    summaryCards: [
      { code: "01", label: "Average score" },
      { code: "02", label: "Concentration" },
      { code: "03", label: "Rewrite share" },
      { code: "04", label: "Earliest signal" }
    ],
    summaryTexts: {
      concentrationTitle: "Risk clusters instead of spreading evenly.",
      rewriteTitle: "Many jobs are changing shape before they stop hiring.",
      signalTitle: "The earliest shifts usually show up in job postings first."
    },
    liveFieldKicker: "Live occupation field",
    liveFieldTitle: "A zoomable market map of every BLS SOC occupation.",
    date: "Date",
    region: "Region",
    group: "Group",
    label: "Impact type",
    searchPlaceholder: "SOC code or occupation name",
    allGroups: "All groups",
    allLabels: "All labels",
    currentFocus: "Current focus",
    localTime: "Local time",
    socSourceNote: "Occupation counts and classification standards are based on the U.S. Standard Occupational Classification (SOC) system.",
    detectTimezone: "Detecting timezone...",
    noData: "No occupations match the current filter.",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    resetView: "Reset view",
    mapModeMarket: "Market map",
    mapModeGroup: "SOC groups",
    mapModeLabel: "Risk clusters",
    axisX: "AIRS score: left = more compressed by AI, right = less affected right now",
    axisY: "Hiring heat: top = weaker hiring, bottom = stronger hiring",
    openDetail: "Open detail",
    detailKicker: "Occupation detail",
    definitionKicker: "SOC definition",
    readKicker: "AIRS read",
    statusLabel: "Current state",
    breakdownTitle: "Score breakdown",
    trendTitle: "Twelve-month AIRS movement",
    evidenceTitle: "Recruitment-side evidence",
    tasksTitle: "Tasks most likely to be touched by AI",
    tasksIntro:
      "Higher task exposure means the work item is more likely to be assisted, rewritten, or partially compressed by AI first.",
    backToUniverse: "Back to universe",
    loading: "Loading...",
    notFoundTitle: "Page not found",
    notFoundText: "The route you opened does not exist in the new React application.",
    returnHome: "Return home",
    openPostings: "Open postings",
    relatedMedian2Y: "Related major median earnings (2y)",
    relatedMedian1Y: "Related major median earnings (1y)",
    relatedSamples: "Related major outcome samples",
    impactExposure: "AI exposure",
    evidenceEmpty: "No evidence text is available for this occupation yet.",
    tasksEmpty: "No task-level data is available for this occupation.",
    detailSearchPlaceholder: "Search by occupation, alias, or SOC code",
    taskCountSuffix: "tasks",
    footerCopyright: "© 2026 [DOMAIN], all rights reserved DSDPM",
    footerContact: "Contact",
    h5Title: "Search one occupation and see whether AI is assisting it or compressing it.",
    h5Intro: "This mobile page is designed for phone viewing and sharing. Enter an occupation name or SOC code to jump straight to a lightweight detail view.",
    h5AverageLabel: "Current AIRS average",
    h5SearchPlaceholder: "Occupation, alias, or SOC code",
    h5OpenDesktop: "Open desktop version",
    h5SearchButton: "Search now",
    h5ResultTitle: "Mobile quick view",
    h5ResultAverage: "Current AIRS",
    h5ResultGlobalAverage: "Overall average",
    h5ShareButton: "Generate share image",
    h5SaveImage: "Save image",
    h5ShareReady: "Share image ready",
    h5NoSelection: "No occupation selected yet.",
    h5BottomCaption: "AIRS tracks how hiring is changing after AI enters the workflow.",
    shareImageTitle: "AIRS occupation share card",
    shareImageQrNote: "Scan to open the website",
    shareImageBreakdown: "Breakdown",
    shareImageAverage: "Average AIRS"
  },
  zh: {
    appName: "AIRS",
    heroKicker: "AI 招聘稳定指数",
    heroTitleLines: ["看清每一种职业，", "正被AI辅助，还是被AI压缩。"],
    heroText:
      "AIRS是AI Recruitment Stability Score的缩写，即“AI招聘稳定指数”。它不是在猜某个职业未来会不会消失，而是在回答一个更直接的问题：当 AI 进入工作流程后，企业现在是否已经开始减少招聘、简化岗位，或重组这个职业的用人方式。",
    summaryCards: [
      { code: "01", label: "平均分" },
      { code: "02", label: "风险集中" },
      { code: "03", label: "改写占比" },
      { code: "04", label: "最早变化" }
    ],
    summaryTexts: {
      concentrationTitle: "风险不是平均分布，而是集中在少数职业。",
      rewriteTitle: "不少职业不是停止招人，而是先改写工作方式。",
      signalTitle: "最早的变化，往往先出现在招聘信息里。"
    },
    liveFieldKicker: "实时职业场",
    liveFieldTitle: "把全部 BLS SOC 职业放进一张可缩放的市场地图里。",
    date: "日期",
    region: "地区",
    group: "职业大类",
    label: "影响类型",
    searchPlaceholder: "输入 SOC 代码或职业名称",
    allGroups: "全部大类",
    allLabels: "全部影响类型",
    currentFocus: "当前聚焦职业",
    localTime: "你所在地区时间",
    socSourceNote: "职业数的来源和分类标准来自美国标准职业分类系统（SOC）。",
    detectTimezone: "正在识别时区...",
    noData: "当前筛选条件下没有匹配职业。",
    zoomIn: "放大",
    zoomOut: "缩小",
    resetView: "回到全局视图",
    mapModeMarket: "整体市场",
    mapModeGroup: "职业大类",
    mapModeLabel: "风险聚类",
    axisX: "横轴是 AIRS 分数：越靠左，AI 对招聘压缩越明显；越靠右，当前影响越小。",
    axisY: "纵轴是招聘热度：越靠上，招聘越弱；越靠下，招聘越活跃。",
    openDetail: "查看详情",
    detailKicker: "职业详情",
    definitionKicker: "SOC 定义",
    readKicker: "AIRS 解读",
    statusLabel: "当前状态",
    breakdownTitle: "分项拆解",
    trendTitle: "12 个月 AIRS 变化",
    evidenceTitle: "招聘侧证据",
    tasksTitle: "AI 更容易影响这个职业的哪些工作内容",
    tasksIntro: "这里的“影响程度”越高，表示这项具体工作内容越容易被 AI 辅助、重写或部分压缩。",
    backToUniverse: "返回职业全景",
    loading: "正在加载…",
    notFoundTitle: "页面不存在",
    notFoundText: "当前链接在新的 React 应用里没有对应页面。",
    returnHome: "返回首页",
    openPostings: "在招岗位数",
    relatedMedian2Y: "高校相关专业 2 年收入中位数",
    relatedMedian1Y: "高校相关专业 1 年收入中位数",
    relatedSamples: "高校相关专业结果样本数",
    impactExposure: "影响程度",
    evidenceEmpty: "该职业暂时没有可展示的招聘侧证据文本。",
    tasksEmpty: "该职业暂时没有可用的任务级数据。",
    detailSearchPlaceholder: "输入职业名、常用叫法或 SOC 代码",
    taskCountSuffix: "项",
    footerCopyright: "© 2026 [DOMAIN], all rights reserved DSDPM",
    footerContact: "联系我",
    h5Title: "输入一个职业，直接看它正被 AI 辅助，还是被 AI 压缩。",
    h5Intro: "这是面向手机访问和分享传播的极简页面。输入职业名称或 SOC 代码，即可快速查看该职业的 AIRS 与分项拆解。",
    h5AverageLabel: "当前 AIRS 平均指数",
    h5SearchPlaceholder: "输入职业名、常用叫法或 SOC 代码",
    h5OpenDesktop: "查看桌面版",
    h5SearchButton: "立即查询",
    h5ResultTitle: "移动端快速结果",
    h5ResultAverage: "当前 AIRS",
    h5ResultGlobalAverage: "全局平均值",
    h5ShareButton: "生成分享图",
    h5SaveImage: "保存图片",
    h5ShareReady: "分享图已生成",
    h5NoSelection: "还没有选中职业。",
    h5BottomCaption: "AIRS 关注的是：AI 进入工作流程后，招聘是否已经开始变化。",
    shareImageTitle: "AIRS 职业分享图",
    shareImageQrNote: "扫码进入网站",
    shareImageBreakdown: "分项拆解",
    shareImageAverage: "平均 AIRS"
  }
} as const;

const LABELS: Record<LabelKey, { en: string; zh: string }> = {
  stable: { en: "Stable", zh: "稳定" },
  light: { en: "Light", zh: "轻度影响" },
  augmenting: { en: "Augmenting", zh: "AI辅助增强中" },
  restructuring: { en: "Restructuring", zh: "招聘结构调整中" },
  high_risk: { en: "High risk", zh: "高风险" }
};

const GROUPS_ZH = new Map([
  ["Management", "管理"],
  ["Business and Financial Operations", "商业与财务运营"],
  ["Computer and Mathematical", "计算机与数学"],
  ["Architecture and Engineering", "建筑与工程"],
  ["Life, Physical, and Social Science", "生命、物理与社会科学"],
  ["Community and Social Service", "社区与社会服务"],
  ["Legal", "法律"],
  ["Educational Instruction and Library", "教育与图书馆"],
  ["Arts, Design, Entertainment, Sports, and Media", "艺术、设计、娱乐、体育与媒体"],
  ["Healthcare Practitioners and Technical", "医疗专业与技术"],
  ["Healthcare Support", "医疗支持"],
  ["Protective Service", "保护服务"],
  ["Food Preparation and Serving Related", "餐饮制备与服务"],
  ["Building and Grounds Cleaning and Maintenance", "楼宇与场地清洁维护"],
  ["Personal Care and Service", "个人护理与服务"],
  ["Sales and Related", "销售及相关"],
  ["Office and Administrative Support", "办公室与行政支持"],
  ["Farming, Fishing, and Forestry", "农业、渔业与林业"],
  ["Construction and Extraction", "建筑与采掘"],
  ["Installation, Maintenance, and Repair", "安装、维护与维修"],
  ["Production", "生产制造"],
  ["Transportation and Material Moving", "运输与物料搬运"],
  ["Military Specific Occupations", "军事特定职业"],
  ["Other", "其他"]
]);

export function normalizeLanguage(value: string | null | undefined): AppLanguage {
  return value === "en" ? "en" : "zh";
}

export function getInitialLanguage(search: string) {
  const params = new URLSearchParams(search);
  const fromQuery = params.get("lang");
  if (fromQuery === "en" || fromQuery === "zh") return fromQuery;
  const fromStorage = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  if (fromStorage === "en" || fromStorage === "zh") return fromStorage;
  if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh")) return "zh";
  return "en";
}

export function persistLanguage(language: AppLanguage) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, language);
  }
}

export function labelText(language: AppLanguage, label: string) {
  return LABELS[label as LabelKey]?.[language] || label;
}

export function groupText(language: AppLanguage, group: string) {
  return language === "zh" ? GROUPS_ZH.get(group) || group : group;
}
