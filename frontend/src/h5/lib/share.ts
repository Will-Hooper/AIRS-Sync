import type { H5Language } from "./language";

export type SharePlatform = "wechatMoments" | "xiaohongshu" | "weibo";

export interface GeneratedShareAsset {
  file: File;
  fileName: string;
  objectUrl: string;
}

export interface ShareAttemptResult {
  status: "shared" | "fallback" | "cancelled";
  message: string;
}

export const DEFAULT_SHARE_TEXT = "搜搜看，AI是否会取代你的职业";

export async function shareGeneratedImage(options: {
  asset: GeneratedShareAsset;
  language: H5Language;
  platform: SharePlatform;
  shareText?: string;
}) {
  const shareText = options.shareText || DEFAULT_SHARE_TEXT;
  const title = getSharePlatformLabel(options.platform, options.language);

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    const shareData: ShareData = {
      files: [options.asset.file],
      title,
      text: shareText
    };

    if (!navigator.canShare || navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return {
          status: "shared",
          message: getSystemShareMessage(options.language, options.platform)
        } satisfies ShareAttemptResult;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return {
            status: "cancelled",
            message: getCancelMessage(options.language)
          } satisfies ShareAttemptResult;
        }
      }
    }
  }

  triggerImageDownload(options.asset.objectUrl, options.asset.fileName);
  const copied = await copyShareText(shareText);
  return {
    status: "fallback",
    message: getFallbackMessage(options.language, options.platform, copied)
  } satisfies ShareAttemptResult;
}

export function getSharePlatformLabel(platform: SharePlatform, language: H5Language) {
  if (language === "en") {
    if (platform === "wechatMoments") return "Share to WeChat Moments";
    if (platform === "xiaohongshu") return "Share to Xiaohongshu";
    return "Share to Weibo";
  }

  if (platform === "wechatMoments") return "分享到微信朋友圈";
  if (platform === "xiaohongshu") return "分享到小红书";
  return "分享到微博";
}

async function copyShareText(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the textarea fallback below.
    }
  }

  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    document.body.removeChild(textarea);
  }

  return copied;
}

function triggerImageDownload(objectUrl: string, fileName: string) {
  if (typeof document === "undefined") return;

  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

function getSystemShareMessage(language: H5Language, platform: SharePlatform) {
  if (language === "en") {
    return `The system share sheet is open. Continue by choosing ${getPlatformLabelEn(platform)}.`;
  }

  return `已调用系统分享面板，可继续选择${getPlatformLabelZh(platform)}。`;
}

function getCancelMessage(language: H5Language) {
  return language === "en" ? "Sharing was cancelled." : "已取消分享。";
}

function getFallbackMessage(language: H5Language, platform: SharePlatform, copied: boolean) {
  if (language === "en") {
    const copiedText = copied ? "The caption has been copied." : "Copy the caption manually.";
    return `The page cannot post directly. The image has been saved. ${copiedText} Open ${getPlatformLabelEn(platform)} and publish the image manually.`;
  }

  const copiedText = copied ? "文案已复制。" : "请手动复制文案。";
  return `当前网页不能直接发到${getPlatformLabelZh(platform)}，已为你保存图片。${copiedText} 打开${getPlatformLabelZh(platform)}发布图片并粘贴文案即可。`;
}

function getPlatformLabelZh(platform: SharePlatform) {
  if (platform === "wechatMoments") return "微信朋友圈";
  if (platform === "xiaohongshu") return "小红书";
  return "微博";
}

function getPlatformLabelEn(platform: SharePlatform) {
  if (platform === "wechatMoments") return "WeChat Moments";
  if (platform === "xiaohongshu") return "Xiaohongshu";
  return "Weibo";
}
