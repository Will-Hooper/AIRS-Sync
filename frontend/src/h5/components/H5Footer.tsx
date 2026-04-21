import { getH5Copy } from "../lib/copy";
import type { H5Language } from "../lib/language";

interface H5FooterProps {
  language: H5Language;
  embedded?: boolean;
}

export function H5Footer({ language, embedded = false }: H5FooterProps) {
  const copy = getH5Copy(language);

  return (
    <footer className={`${embedded ? "flex flex-col gap-3 pt-1 text-sm leading-6" : "h5-panel mt-2 flex flex-col gap-4 px-5 py-5 text-sm"}`.trim()}>
      <p className={`h5-footer-copy text-center ${embedded ? "mx-auto max-w-[26rem]" : ""}`.trim()}>{copy.footerCopyright}</p>
      <p className="h5-footer-copy text-center">{copy.footerRecordNumber}</p>
      <a
        href="mailto:airsindex@qq.com"
        className={`${embedded ? "h5-footer-link inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-black/15 px-4 py-3 text-sm transition hover:border-white/20" : "h5-footer-link inline-flex items-center justify-center rounded-full border border-white/10 bg-black/15 px-4 py-3 text-sm transition hover:border-white/20"}`.trim()}
      >
        {copy.footerContact} airsindex@qq.com
      </a>
    </footer>
  );
}
