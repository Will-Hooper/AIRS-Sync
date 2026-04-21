import type { DatasetSourceUpdatedAt, OccupationRow } from "../../lib/types";
import { renderOccupationShareImage as renderSharedOccupationShareImage } from "../../shared/share/render-occupation-share-image";
import { getH5Copy } from "../lib/copy";
import type { H5Language } from "../lib/language";

interface ShareImageOptions {
  occupation: OccupationRow;
  averageAirs: number;
  language: H5Language;
  generatedAt?: string;
  sourceUpdatedAt?: DatasetSourceUpdatedAt;
  siteUrl?: string;
}

export async function renderOccupationShareImage({
  occupation,
  averageAirs,
  language,
  generatedAt: _generatedAt,
  sourceUpdatedAt: _sourceUpdatedAt,
  siteUrl: _siteUrl
}: ShareImageOptions) {
  const copy = getH5Copy(language);
  return renderSharedOccupationShareImage({
    occupation,
    averageAirs,
    language,
    qrText: "airsindex.com",
    copy: {
      appName: copy.appName,
      currentAirsLabel: copy.currentAirsLabel,
      globalAverageLabel: copy.globalAverageLabel,
      readingTitle: copy.readingTitle,
      breakdownTitle: copy.breakdownTitle,
      breakdownLabels: copy.breakdownLabels,
      noReading: copy.noReading,
      shareImageQrNote: copy.shareImageQrNote,
      footerCopyright: copy.footerCopyright
    }
  });
}
