import { messages, type AppLanguage } from "../../lib/i18n";

interface SiteFooterProps {
  language: AppLanguage;
}

export function SiteFooter({ language }: SiteFooterProps) {
  const copy = messages[language];

  return (
    <footer className="airs-panel mt-2 flex flex-col gap-4 px-6 py-5 text-sm text-white/58 md:flex-row md:items-center md:justify-between">
      <p>{copy.footerCopyright}</p>
      <a
        href="mailto:airsindex@qq.com"
        className="inline-flex items-center justify-center rounded-full border border-white/10 bg-black/15 px-4 py-2 text-sm text-white/78 transition hover:-translate-y-0.5 hover:text-white"
      >
        {copy.footerContact} airsindex@qq.com
      </a>
    </footer>
  );
}
