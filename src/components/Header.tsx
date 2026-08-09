import { Badge } from '@/components/ui/badge/badge';
import { Button } from '@/components/ui/button/button';
import { Typography } from '@/components/ui/typography/typography';
import { GlobeIcon, InfoIcon, SignalIcon } from '@/components/icons';
import { strings } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

interface HeaderProps {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  onAbout: () => void;
}

function LangToggle({ lang, onLangChange }: Pick<HeaderProps, 'lang' | 'onLangChange'>) {
  const t = strings[lang];
  return (
    <div
      className="inline-flex items-center gap-1 border border-[var(--border)] bg-[var(--surface)] p-1"
      role="group"
      aria-label={t.langLabel}
    >
      <GlobeIcon size={18} className="ml-2 mr-2 shrink-0 text-[var(--text-muted)]" />
      {(['es', 'en'] as const).map((code) => (
        <Button
          key={code}
          variant={lang === code ? 'EXEC' : 'GHOST'}
          size="SM"
          aria-pressed={lang === code}
          onClick={() => onLangChange(code)}
        >
          {code.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}

export default function Header({ lang, onLangChange, onAbout }: HeaderProps) {
  const t = strings[lang];
  return (
    <header className="scanlines relative border-b border-[var(--border)] bg-[var(--surface)]/80 px-4 py-8 sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <SignalIcon size={14} className="pulse-glow text-[var(--color-green)]" />
            <Badge variant="SCANNING">LIVE FEED</Badge>
          </div>
          <Typography variant="H1" className="flicker text-2xl sm:text-3xl">
            Rice Tech News
          </Typography>
          <Typography variant="MUTED" className="mt-2 tracking-widest uppercase">
            {t.tagline}
          </Typography>
        </div>
        <div className="flex flex-col items-center gap-3 self-center sm:items-end sm:self-auto">
          <LangToggle lang={lang} onLangChange={onLangChange} />
          <Button
            variant="GHOST"
            size="SM"
            onClick={onAbout}
            title={t.about}
            aria-label={t.about}
            className="h-6 gap-1.5 px-2 text-[var(--text-muted)]"
            style={{ fontSize: '0.8rem' }}
          >
            <InfoIcon size={12} className="text-[var(--text-muted)]" />
            {t.about}
          </Button>
        </div>
      </div>
    </header>
  );
}
