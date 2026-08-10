import { Button } from '@/components/ui/button/button';
import { InfoIcon } from '@/components/icons';
import { strings } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

interface AboutFooterProps {
  lang: Lang;
  onAbout: () => void;
}

export default function AboutFooter({ lang, onAbout }: AboutFooterProps) {
  const t = strings[lang];
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <Button
        variant="GHOST"
        size="SM"
        onClick={onAbout}
        title={t.about}
        aria-label={t.about}
        className="h-6 gap-1.5 px-2 text-[var(--color-green)]"
        style={{ fontSize: '0.8rem' }}
      >
        <InfoIcon size={12} className="text-[var(--color-green)]" />
        {t.about}
      </Button>
      <div className="flex items-center gap-3 text-[0.7rem] uppercase tracking-widest text-[var(--text-muted)]">
        <a
          href="/privacidad"
          className="transition-colors hover:text-[var(--color-green)]"
        >
          {t.privacy}
        </a>
        <span aria-hidden="true">·</span>
        <a
          href="/terminos"
          className="transition-colors hover:text-[var(--color-green)]"
        >
          {t.terms}
        </a>
      </div>
    </div>
  );
}
