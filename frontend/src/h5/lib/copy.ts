import type { DatasetSyncStatus } from "../../lib/types";
import type { H5Language } from "./language";

type SyncLabelKey = "stable" | "light" | "augmenting" | "restructuring" | "high_risk";

interface H5Copy {
  appName: string;
  moduleKicker: string;
  homeTitle: string;
  sourceNote: string;
  averageLabel: string;
  searchPlaceholder: string;
  openDesktopHome: string;
  backHome: string;
  resultTitle: string;
  currentAirsLabel: string;
  globalAverageLabel: string;
  breakdownTitle: string;
  readingTitle: string;
  noReading: string;
  generateShare: string;
  saveImage: string;
  openDesktopDetail: string;
  shareReady: string;
  shareError: string;
  loading: string;
  loadError: string;
  noSelection: string;
  bottomCaption: string;
  footerCopyright: string;
  footerContact: string;
  notFoundTitle: string;
  notFoundText: string;
  returnHome: string;
  dataFreshness: string;
  generatedAtLabel: string;
  recruitmentUpdatedLabel: string;
  airsUpdatedLabel: string;
  onetUpdatedLabel: string;
  collegeScorecardUpdatedLabel: string;
  datasetVersionLabel: string;
  syncStatusLabel: string;
  syncStatusOk: string;
  syncStatusWarning: string;
  syncStatusError: string;
  syncModeHourly: string;
  syncModeFull: string;
  syncStateUnknown: string;
  shareImageQrNote: string;
  shareImageTitle: string;
  breakdownLabels: {
    replacement: string;
    augmentation: string;
    hiring: string;
    historical: string;
  };
}

export const h5Messages: Record<H5Language, H5Copy> = {
  en: {
    appName: "AIRS",
    moduleKicker: "AIRS / H5",
    homeTitle: "Will AI replace your occupation?",
    sourceNote: "Occupation counts and classification standards are based on the U.S. Standard Occupational Classification (SOC) system.",
    averageLabel: "Current AIRS average",
    searchPlaceholder: "Check the AIRS score of your occupation",
    openDesktopHome: "Open desktop version",
    backHome: "Back to H5 home",
    resultTitle: "Mobile quick read",
    currentAirsLabel: "Current AIRS",
    globalAverageLabel: "Overall average",
    breakdownTitle: "Breakdown",
    readingTitle: "Occupation read",
    noReading: "No occupation reading is available yet.",
    generateShare: "Generate share image",
    saveImage: "Save image",
    openDesktopDetail: "Open desktop detail",
    shareReady: "Share card ready",
    shareError: "Share image generation failed. Please retry.",
    loading: "Loading...",
    loadError: "Unable to read this occupation right now.",
    noSelection: "No occupation selected yet.",
    bottomCaption: "AIRS tracks whether hiring has already started changing after AI enters the workflow.",
    footerCopyright: "© 2026 airsindex.com, all rights reserved DSDPM",
    footerContact: "Contact",
    notFoundTitle: "H5 page not found",
    notFoundText: "The H5 route you opened does not exist.",
    returnHome: "Return to H5 home",
    dataFreshness: "Data freshness",
    generatedAtLabel: "Dataset generated",
    recruitmentUpdatedLabel: "Recruitment sync",
    airsUpdatedLabel: "AIRS recalculation",
    onetUpdatedLabel: "O*NET sync",
    collegeScorecardUpdatedLabel: "College Scorecard sync",
    datasetVersionLabel: "Dataset version",
    syncStatusLabel: "Sync status",
    syncStatusOk: "Healthy",
    syncStatusWarning: "Warning",
    syncStatusError: "Error",
    syncModeHourly: "Hourly recruitment refresh",
    syncModeFull: "Daily full rebuild",
    syncStateUnknown: "Unknown",
    shareImageQrNote: "Open the H5 view and check how AI is changing this occupation.",
    shareImageTitle: "AIRS occupation share card",
    breakdownLabels: {
      replacement: "Replacement",
      augmentation: "Augmentation",
      hiring: "Hiring",
      historical: "Historical"
    }
  },
  zh: {
    appName: "AIRS",
    moduleKicker: "AIRS / H5",
    homeTitle: "AI会取代你的职业吗？",
    sourceNote: "职业数的来源和分类标准来自美国标准职业分类系统（SOC）。",
    averageLabel: "当前 AIRS 平均指数",
    searchPlaceholder: "搜搜看你的职业AIRS值是多少",
    openDesktopHome: "打开桌面版",
    backHome: "返回 H5 首页",
    resultTitle: "移动端快速解读",
    currentAirsLabel: "当前 AIRS",
    globalAverageLabel: "全局平均值",
    breakdownTitle: "分项拆解",
    readingTitle: "职业解读",
    noReading: "这个职业暂时没有可展示的解读文本。",
    generateShare: "生成分享图",
    saveImage: "保存图片",
    openDesktopDetail: "打开桌面版详情",
    shareReady: "分享卡片已生成",
    shareError: "分享图生成失败，请重试。",
    loading: "正在加载…",
    loadError: "当前无法读取这个职业的移动端数据。",
    noSelection: "还没有选中职业。",
    bottomCaption: "AIRS 关注的是：AI 进入工作流程后，招聘是否已经开始变化。",
    footerCopyright: "© 2026 airsindex.com, all rights reserved DSDPM",
    footerContact: "联系我",
    notFoundTitle: "H5 页面不存在",
    notFoundText: "你打开的 H5 路由不存在。",
    returnHome: "返回 H5 首页",
    dataFreshness: "数据更新时间",
    generatedAtLabel: "本次数据生成时间",
    recruitmentUpdatedLabel: "招聘数据同步",
    airsUpdatedLabel: "AIRS 主重算",
    onetUpdatedLabel: "O*NET 职业资料同步",
    collegeScorecardUpdatedLabel: "高校专业结果同步",
    datasetVersionLabel: "数据版本",
    syncStatusLabel: "同步状态",
    syncStatusOk: "正常",
    syncStatusWarning: "需留意",
    syncStatusError: "异常",
    syncModeHourly: "小时级招聘更新",
    syncModeFull: "每日完整重算",
    syncStateUnknown: "未知",
    shareImageQrNote: "打开 H5 页面，看看 AI 正在怎样改写这个职业。",
    shareImageTitle: "AIRS 职业分享图",
    breakdownLabels: {
      replacement: "替代压力",
      augmentation: "岗位改写",
      hiring: "招聘兑现",
      historical: "历史累计渗透"
    }
  }
};

const LABELS: Record<SyncLabelKey, Record<H5Language, string>> = {
  stable: { en: "Stable", zh: "稳定" },
  light: { en: "Light", zh: "轻度影响" },
  augmenting: { en: "Augmenting", zh: "AI辅助增强中" },
  restructuring: { en: "Restructuring", zh: "招聘结构调整中" },
  high_risk: { en: "High risk", zh: "高风险" }
};

export function getH5Copy(language: H5Language) {
  return h5Messages[language];
}

export function getH5LabelText(language: H5Language, label: string) {
  return LABELS[label as SyncLabelKey]?.[language] || label;
}

export function getH5SyncStatusText(language: H5Language, syncStatus?: DatasetSyncStatus) {
  const copy = h5Messages[language];
  if (!syncStatus) return copy.syncStateUnknown;

  const stateLabel =
    syncStatus.overall === "ok"
      ? copy.syncStatusOk
      : syncStatus.overall === "warning"
        ? copy.syncStatusWarning
        : copy.syncStatusError;
  const modeLabel = syncStatus.mode === "hourly" ? copy.syncModeHourly : copy.syncModeFull;
  return `${stateLabel} · ${modeLabel}`;
}
