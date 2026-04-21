import { messages, type AppLanguage } from "../../lib/i18n";

interface SiteFooterProps {
  language: AppLanguage;
}

export function SiteFooter({ language }: SiteFooterProps) {
  const copy = messages[language];

  return (
    <footer className="airs-panel mt-2 grid gap-3 px-6 py-5 text-sm md:grid-cols-[1fr_auto_1fr] md:items-center">
      <p className="airs-footer-copy md:text-left">{copy.footerCopyright}</p>
      <p className="airs-footer-copy text-center">{copy.footerRecordNumber}</p>
      <a
        href="mailto:airsindex@qq.com"
        className="airs-footer-link inline-flex items-center justify-center rounded-full border border-white/10 bg-black/15 px-4 py-2 text-sm transition hover:-translate-y-0.5 md:justify-self-end"
      >
        {copy.footerContact} airsindex@qq.com
      </a>
    </footer>
  );
}
