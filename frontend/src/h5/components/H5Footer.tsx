import { getH5Copy } from "../lib/copy";
import type { H5Language } from "../lib/language";

interface H5FooterProps {
  language: H5Language;
  embedded?: boolean;
}

export function H5Footer({ language, embedded = false }: H5FooterProps) {
  const copy = getH5Copy(language);

  return (
    <footer className={`${embedded ? "flex flex-col gap-3 pt-1 text-sm leading-6 text-white/58" : "h5-panel mt-2 flex flex-col gap-4 px-5 py-5 text-sm text-white/58"}`.trim()}>
      <p className={embedded ? "max-w-[26rem]" : ""}>{copy.footerCopyright}</p>
      <a
        href="mailto:airsindex@qq.com"
        className={`${embedded ? "inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-black/15 px-4 py-3 text-sm text-white/78 transition hover:border-white/20 hover:text-white" : "inline-flex items-center justify-center rounded-full border border-white/10 bg-black/15 px-4 py-3 text-sm text-white/78 transition hover:border-white/20 hover:text-white"}`.trim()}
      >
        {copy.footerContact} airsindex@qq.com
      </a>
    </footer>
  );
}
