import { useId, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button/button';
import { SpeakerIcon, MutedSpeakerIcon } from '@/components/icons';
import { strings } from '@/lib/i18n';
import { getState, isSpeechSupported, speak, stop, subscribe } from '@/lib/tts';
import type { Lang } from '@/lib/types';

interface SpeakButtonProps {
  text: string;
  lang: Lang;
  size?: 'SM' | 'MD';
  className?: string;
}

const SERVER_SNAPSHOT = { activeId: null, status: 'idle' as const };

/** Botón Play/Stop que lee `text` en voz alta usando el controlador TTS. */
export default function SpeakButton({
  text,
  lang,
  size = 'SM',
  className,
}: SpeakButtonProps) {
  const id = useId();
  const state = useSyncExternalStore(subscribe, getState, () => SERVER_SNAPSHOT);
  const t = strings[lang];

  // No renderizamos nada si el navegador no soporta síntesis de voz.
  if (!isSpeechSupported()) return null;

  const isActive = state.activeId === id && state.status === 'speaking';

  return (
    <Button
      type="button"
      variant={isActive ? 'ABORT' : 'GHOST'}
      size={size}
      className={className}
      aria-pressed={isActive}
      aria-label={isActive ? t.stop : t.listen}
      title={isActive ? t.stop : t.listen}
      onClick={() => (isActive ? stop() : speak(id, text, lang))}
    >
      {isActive ? <MutedSpeakerIcon size={14} /> : <SpeakerIcon size={14} />}
    </Button>
  );
}
