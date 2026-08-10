import { Badge } from '@/components/ui/badge/badge';
import { Button } from '@/components/ui/button/button';
import { Typography } from '@/components/ui/typography/typography';
import { GlobeIcon, SignalIcon, SignalOffIcon } from '@/components/icons';
import { strings } from '@/lib/i18n';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import type { Lang } from '@/lib/types';

interface HeaderProps {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  adsEnabled?: boolean;
  onAdsChange?: (enabled: boolean) => void;
  homeLink?: boolean;
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

function AdsToggle({
  lang,
  adsEnabled,
  onAdsChange,
}: {
  lang: Lang;
  adsEnabled: boolean;
  onAdsChange: (enabled: boolean) => void;
}) {
  const t = strings[lang];
  return (
    <div className="inline-flex items-center gap-2 border border-[var(--border)] bg-[var(--surface)] px-2 py-1">
      <span className="text-[0.7rem] uppercase tracking-widest text-[var(--text-muted)]">
        {t.adsLabel}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={adsEnabled}
        aria-label={t.adsLabel}
        onClick={() => onAdsChange(!adsEnabled)}
        className={`relative inline-flex h-4 w-8 shrink-0 items-center rounded-[2px] border transition-colors ${
          adsEnabled
            ? 'border-[var(--color-green)] bg-[color-mix(in_srgb,var(--color-green)_30%,transparent)]'
            : 'border-[var(--border)] bg-[var(--surface)]'
        }`}
      >
        <span
          className={`inline-block h-3 w-3 rounded-[1px] transition-transform ${
            adsEnabled
              ? 'translate-x-4 bg-[var(--color-green)]'
              : 'translate-x-0.5 bg-[var(--text-muted)]'
          }`}
        />
      </button>
    </div>
  );
}

export default function Header({
  lang,
  onLangChange,
  adsEnabled,
  onAdsChange,
  homeLink = false,
}: HeaderProps) {
  const t = strings[lang];
  const online = useOnlineStatus();
  const title = (
    <Typography variant="H1" className="flicker text-2xl sm:text-3xl">
      Rice Tech News
    </Typography>
  );
  return (
    <header className="scanlines relative border-b border-[var(--border)] bg-[var(--surface)]/80 px-4 py-5 sm:px-8">
      <div className="mx-auto flex max-w-[96rem] flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            {online ? (
              <SignalIcon size={14} className="pulse-glow text-[var(--color-green)]" />
            ) : (
              <SignalOffIcon size={14} className="text-[var(--color-red)]" />
            )}
            <Badge variant={online ? 'SCANNING' : 'CRITICAL'}>
              {online ? t.liveFeed : t.offline}
            </Badge>
          </div>
          {homeLink ? (
            <a href="/" className="inline-block transition-opacity hover:opacity-80">
              {title}
            </a>
          ) : (
            title
          )}
          <Typography variant="MUTED" className="mt-2 tracking-widest uppercase">
            {t.tagline}
          </Typography>
        </div>
        <div className="flex flex-row flex-wrap items-center justify-center gap-3 self-center sm:flex-col sm:items-end sm:self-auto">
          <LangToggle lang={lang} onLangChange={onLangChange} />
          {/* Toggle de publicidad deshabilitado hasta la aprobación de AdSense
          {onAdsChange && (
            <AdsToggle
              lang={lang}
              adsEnabled={adsEnabled ?? true}
              onAdsChange={onAdsChange}
            />
          )}
          */}
        </div>
      </div>
    </header>
  );
}
