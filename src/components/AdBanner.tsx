import { useEffect, useRef } from 'react';
import { Typography } from '@/components/ui/typography/typography';
import { strings } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

const AD_CLIENT = import.meta.env.PUBLIC_ADSENSE_CLIENT as string | undefined;
const AD_SLOT = import.meta.env.PUBLIC_ADSENSE_SLOT as string | undefined;

let scriptInjected = false;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

function ensureScript(client: string) {
  if (scriptInjected) return;
  if (document.querySelector('script[src*="adsbygoogle.js"]')) {
    scriptInjected = true;
    return;
  }
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
  scriptInjected = true;
}

interface AdBannerProps {
  lang: Lang;
  enabled: boolean;
  className?: string;
}

export default function AdBanner({ lang, enabled, className }: AdBannerProps) {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!enabled || !AD_CLIENT || !AD_SLOT) return;
    ensureScript(AD_CLIENT);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* noop */
    }
  }, [enabled]);

  if (!enabled || !AD_CLIENT || !AD_SLOT) return null;

  const t = strings[lang];

  return (
    <div
      className={`w-full border border-[var(--border)] bg-[var(--surface)] p-3 ${className ?? ''}`}
    >
      <Typography
        variant="MUTED"
        className="mb-2 text-center uppercase tracking-widest"
      >
        {t.adLabel}
      </Typography>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={AD_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
