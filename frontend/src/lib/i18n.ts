import type { AppLanguage } from "../shared/language";

export type { AppLanguage } from "../shared/language";

type LabelKey = "stable" | "light" | "augmenting" | "restructuring" | "high_risk";

const STORAGE_KEY = "airs-language";

export const messages = {
  en: {
    appName: "AIRS",
    appSubtitle: "Higher scores mean lower AI impact.",
    heroKicker: "AI Recruitment Stability Score",
    heroTitleLines: ["Will AI replace you?"],
    heroText:
      "AIRS, the AI Recruitment Stability Score. Higher scores mean your occupation is safer; lower scores mean the AI shock has already begun. We track real occupation hiring changes in the United States and layer in how quickly AI is expanding across industries to show what is already happening: which jobs are still in demand, and which roles have already been quietly replaced by AI.",
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
    liveFieldKicker: "AI impact live",
    liveFieldTitle: "Change never happens overnight. It unfolds quietly. We hope all of us can see here, with our own eyes, how AI is changing more than 800 occupations.",
    date: "Date",
    region: "Region",
    group: "Group",
    label: "Impact type",
    searchLabel: "Search occupation",
    searchPlaceholder: "Check the AIRS score of your occupation",
    allGroups: "All groups",
    allLabels: "All labels",
    currentFocus: "Current focus",
    localTime: "Local time",
    socSourceNote: "Occupation counts and classification standards are based on the U.S. Standard Occupational Classification (SOC) system.",
    dataFreshness: "Data freshness",
    dataFileUpdatedLabel: "Current data file update",
    generatedAtLabel: "Dataset generated",
    dataCoverageDateLabel: "Data coverage date",
    recruitmentUpdatedLabel: "Recruitment sync",
    airsUpdatedLabel: "AIRS recalculation",
    onetUpdatedLabel: "O*NET sync",
    collegeScorecardUpdatedLabel: "College Scorecard sync",
    analyticsUpdatedLabel: "Analytics report",
    datasetVersionLabel: "Dataset version",
    syncStatusLabel: "Sync status",
    syncStatusOk: "Healthy",
    syncStatusWarning: "Warning",
    syncStatusError: "Error",
    syncModeHourly: "Hourly recruitment refresh",
    syncModeFull: "Daily full rebuild",
    syncStateUnknown: "Unknown",
    shareGeneratedAtLabel: "Image generated",
    shareDataUpdatedLabel: "Dataset updated",
    detectTimezone: "Detecting timezone...",
    noData: "No occupations match the current filter.",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    resetView: "Reset view",
    axisXTitle: "AI Replacement Pressure",
    axisYTitle: "Human Moat",
    axisX: "Further left means lower AI replacement pressure. Further right means stronger replacement pressure.",
    axisY: "Higher up means the job still depends more on human judgment, trust, responsibility, field work, or non-standard handling.",
    openDetail: "Open detail",
    detailKicker: "Occupation detail",
    definitionKicker: "SOC definition",
    readKicker: "AIRS read",
    statusLabel: "Current state",
    breakdownTitle: "Score breakdown",
    breakdownLabels: {
      replacement: "Erosion rate: how much of this job can already be replaced by AI",
      augmentation: "Rewrite rate: how much of this job's workflow now expects AI involvement",
      hiring: "Hiring impact: whether AI's shock is already showing up in hiring",
      historical: "Cumulative penetration: how deeply AI has permeated this job so far"
    },
    trendTitle: "Twelve-month AIRS movement",
    evidenceTitle: "Recruitment-side evidence",
    tasksTitle: "Which parts of this job are easiest for AI to take over first",
    tasksIntro:
      "Scores here use a 0-100 safety scale. Higher scores mean the task is less likely to be replaced, rewritten, or compressed by AI first.",
    backToUniverse: "Back to universe",
    loading: "Loading...",
    notFoundTitle: "Page not found",
    notFoundText: "The route you opened does not exist in the new React application.",
    returnHome: "Return home",
    openPostings: "Open postings",
    relatedMedian2Y: "Related major median earnings (2y)",
    relatedMedian1Y: "Related major median earnings (1y)",
    relatedSamples: "Related major outcome samples",
    impactExposure: "AI safety",
    evidenceEmpty: "No evidence text is available for this occupation yet.",
    tasksEmpty: "No task-level data is available for this occupation.",
    detailSearchPlaceholder: "Check the AIRS score of your occupation",
    taskCountSuffix: "tasks",
    currentAirsLabel: "Current AIRS",
    globalAverageLabel: "Overall average",
    noReading: "No occupation reading is available yet.",
    shareModuleTitle: "Generate share image",
    shareModuleText: "Create a desktop share card for this occupation. The QR code points to airsindex.com.",
    shareGenerate: "Generate image",
    shareSave: "Save image",
    shareReady: "Share image is ready.",
    shareError: "Failed to generate the share image. Please retry.",
    sharePreviewTitle: "Preview",
    shareQrTitle: "QR code",
    shareQrHint: "QR target: airsindex.com",
    shareQrDescription: "Search and see whether AI will replace your occupation.",
    footerCopyright: "© 2026 airsindex.com, all rights reserved DSDPM",
    footerRecordNumber: "京ICP备2026017743号",
    footerContact: "Contact",
    fullscreenEnter: "Fullscreen",
    fullscreenExit: "Exit fullscreen"
  },
  zh: {
    appName: "AIRS",
    appSubtitle: "分数越高，受AI影响越小",
    heroKicker: "AI 招聘稳定指数",
    heroTitleLines: ["AI会取代你吗？"],
    heroText:
      "AIRS，AI Recruitment Stability Score——AI招聘稳定指数。分数越高，你的职业越安全；分数越低，AI的冲击开始发生。我们追踪美国当下真实的职业招聘变化，叠加AI在各行业的扩张速度，呈现正在发生的事实：哪些工作还在被需要，哪些岗位已经被AI悄悄取代。",
    summaryCards: [
      { code: "01", label: "平均分" },
      { code: "02", label: "风险集中" },
      { code: "03", label: "改写占比" },
      { code: "04", label: "最早变化" }
    ],
    summaryTexts: {
      concentrationTitle: "风险不会平均落到所有职业，而是先集中在少数岗位。",
      rewriteTitle: "不少职业还在招人，但工作方式已经先被改写。",
      signalTitle: "最早出现的变化，通常先写进招聘启事。"
    },
    liveFieldKicker: "AI冲击现场",
    liveFieldTitle: "改变从来不是一夜之间，而是在悄无声息中发生。希望我们都能在这里亲眼看见800多个职业正如何被AI改变。",
    date: "日期",
    region: "地区",
    group: "职业大类",
    label: "影响类型",
    searchLabel: "职业搜索",
    searchPlaceholder: "搜搜看你的职业AIRS值是多少",
    allGroups: "全部大类",
    allLabels: "全部影响类型",
    currentFocus: "当前聚焦职业",
    localTime: "你所在地区时间",
    socSourceNote: "职业数的来源和分类标准来自美国标准职业分类系统（SOC）。",
    dataFreshness: "数据更新时间",
    dataFileUpdatedLabel: "当前数据文件更新时间",
    generatedAtLabel: "本次数据生成时间",
    dataCoverageDateLabel: "数据覆盖日期",
    recruitmentUpdatedLabel: "招聘数据同步",
    airsUpdatedLabel: "AIRS 主重算",
    onetUpdatedLabel: "O*NET 职业资料同步",
    collegeScorecardUpdatedLabel: "高校专业结果同步",
    analyticsUpdatedLabel: "统计报表生成",
    datasetVersionLabel: "数据版本",
    syncStatusLabel: "同步状态",
    syncStatusOk: "正常",
    syncStatusWarning: "需留意",
    syncStatusError: "异常",
    syncModeHourly: "小时级招聘更新",
    syncModeFull: "每日完整重算",
    syncStateUnknown: "未知",
    shareGeneratedAtLabel: "图片生成时间",
    shareDataUpdatedLabel: "数据更新时间",
    detectTimezone: "正在识别你所在的时区...",
    noData: "当前筛选条件下暂时没有匹配职业。",
    zoomIn: "放大",
    zoomOut: "缩小",
    resetView: "回到全局视图",
    axisXTitle: "AI 替代压力",
    axisYTitle: "人的护城河",
    axisX: "越靠左，AI 替代压力越小；越靠右，AI 替代压力越大。",
    axisY: "越靠上，说明这份工作仍更依赖人类判断、责任、信任、现场处理或非标准化协作。",
    openDetail: "查看详情",
    detailKicker: "职业详情",
    definitionKicker: "SOC 定义",
    readKicker: "AIRS 解读",
    statusLabel: "当前状态",
    breakdownTitle: "分项拆解",
    breakdownLabels: {
      replacement: "侵蚀率：这份工作的多少内容已经能被AI替代",
      augmentation: "改写率：这份工作的多少流程已要求AI参与",
      hiring: "招聘影响：AI 的冲击，是否已经真实反映到招聘上",
      historical: "累计渗透：从 AI 出现到现在，这份工作被 AI 渗透了多深"
    },
    trendTitle: "12 个月 AIRS 变化",
    evidenceTitle: "招聘侧证据",
    tasksTitle: "这份工作里，哪些具体内容最容易先被 AI 接管",
    tasksIntro: "这里显示的是 0-100 的“AI安全度”。分数越高，说明这项工作内容越不容易先被 AI 取代、改写或压缩。",
    backToUniverse: "返回职业全景",
    loading: "正在加载…",
    notFoundTitle: "页面不存在",
    notFoundText: "这个链接在当前版本的网站里没有对应页面。",
    returnHome: "返回首页",
    openPostings: "在招岗位数",
    relatedMedian2Y: "高校相关专业 2 年收入中位数",
    relatedMedian1Y: "高校相关专业 1 年收入中位数",
    relatedSamples: "高校相关专业结果样本数",
    impactExposure: "AI安全度",
    evidenceEmpty: "这个职业暂时没有可展示的招聘侧证据。",
    tasksEmpty: "该职业暂时没有可用的任务级数据。",
    detailSearchPlaceholder: "搜搜看你的职业AIRS值是多少",
    taskCountSuffix: "项",
    currentAirsLabel: "当前 AIRS",
    globalAverageLabel: "整体平均值",
    noReading: "这个职业暂时没有可展示的解读文本。",
    shareModuleTitle: "生成图片分享",
    shareModuleText: "为这个职业生成一张桌面端分享图，二维码统一指向 airsindex.com。",
    shareGenerate: "生成图片",
    shareSave: "保存图片",
    shareReady: "分享图片已生成。",
    shareError: "生成分享图片失败，请重试。",
    sharePreviewTitle: "预览",
    shareQrTitle: "二维码",
    shareQrHint: "二维码内容：airsindex.com",
    shareQrDescription: "搜搜看，AI是否会取代你的职业",
    footerCopyright: "© 2026 airsindex.com, all rights reserved DSDPM",
    footerRecordNumber: "京ICP备2026017743号",
    footerContact: "联系我",
    fullscreenEnter: "全屏查看",
    fullscreenExit: "退出全屏"
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
