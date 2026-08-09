import { Typography } from '@/components/ui/typography/typography';
import { strings } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

interface FooterProps {
  lang: Lang;
}

export default function Footer({ lang }: FooterProps) {
  const t = strings[lang];
  return (
    <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border)] bg-[var(--surface)]/95 px-4 py-2 backdrop-blur-sm">
      <Typography
        variant="MUTED"
        className="text-center uppercase tracking-widest"
      >
        {t.developedBy}{' '}
        <a
          href="https://www.linkedin.com/in/mickel-arroz/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-green)] transition-colors hover:[text-shadow:var(--text-glow-green)]"
        >
          Mickel Arroz
        </a>
        {' - '}
        <a
          href="https://portfolio-mickel-arroz.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-green)] transition-colors hover:[text-shadow:var(--text-glow-green)]"
        >
          Portfolio
        </a>
      </Typography>
    </footer>
  );
}
