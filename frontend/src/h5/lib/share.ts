import type { GeneratedShareAsset, ShareAttemptResult, SharePlatform } from "../../shared/share/share-generated-image";
import { getSharePlatformLabel as getSharedSharePlatformLabel, shareGeneratedImage as shareSharedGeneratedImage } from "../../shared/share/share-generated-image";
import type { H5Language } from "./language";
import { H5_SHARE_COPY } from "./share-copy";

export type { GeneratedShareAsset, ShareAttemptResult, SharePlatform } from "../../shared/share/share-generated-image";

export const DEFAULT_SHARE_TEXT = H5_SHARE_COPY;

export async function shareGeneratedImage(options: {
  asset: GeneratedShareAsset;
  language: H5Language;
  platform: SharePlatform;
  shareText?: string;
}) {
  return shareSharedGeneratedImage({
    ...options,
    shareText: options.shareText || DEFAULT_SHARE_TEXT
  });
}

export function getSharePlatformLabel(platform: SharePlatform, language: H5Language) {
  return getSharedSharePlatformLabel(platform, language);
}
