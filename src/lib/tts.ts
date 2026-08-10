import type { Lang } from './types';

/**
 * Controlador de texto a voz (TTS) basado en la Web Speech API del navegador.
 *
 * Es un singleton a nivel de módulo (no React) para garantizar que solo una
 * lectura suena a la vez en toda la app: al iniciar una nueva, cualquier
 * reproducción previa se detiene. Centraliza además el troceo del texto largo
 * y el workaround del corte de Chrome.
 */

export type TtsStatus = 'idle' | 'speaking';

export interface TtsState {
  activeId: string | null;
  status: TtsStatus;
}

/** ¿El navegador soporta síntesis de voz? (falso en SSR) */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

let state: TtsState = { activeId: null, status: 'idle' };
const listeners = new Set<() => void>();

// Workaround Chrome: la síntesis se pausa sola tras ~15 s si no se "reanima".
let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

function notify() {
  for (const listener of listeners) listener();
}

function setState(next: TtsState) {
  state = next;
  notify();
}

/**
 * Trocea el texto en fragmentos de ~200 caracteres por frase. Evita el corte
 * de Chrome en textos largos y el límite de longitud por utterance.
 */
function chunkText(text: string): string[] {
  const sentences = text
    .replace(/\s+/g, ' ')
    .trim()
    .match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if ((current + sentence).length > 200 && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(Boolean);
}

function clearKeepAlive() {
  if (keepAliveTimer !== null) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

/** Detiene cualquier reproducción en curso. */
export function stop() {
  if (!isSpeechSupported()) return;
  clearKeepAlive();
  window.speechSynthesis.cancel();
  if (state.status !== 'idle' || state.activeId !== null) {
    setState({ activeId: null, status: 'idle' });
  }
}

/**
 * Inicia la lectura de `text` en el idioma dado, asociada a `id` (el del botón
 * que la disparó). Corta cualquier reproducción previa.
 */
export function speak(id: string, text: string, lang: Lang) {
  if (!isSpeechSupported()) return;
  stop();

  const chunks = chunkText(text);
  if (!chunks.length) return;

  const bcp47 = lang === 'es' ? 'es-ES' : 'en-US';

  setState({ activeId: id, status: 'speaking' });

  chunks.forEach((chunk, i) => {
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = bcp47;
    
    // Usar la voz predeterminada del navegador/SO
    // (no especificar utterance.voice, dejar que el navegador elija)
    
    // Ajustes de velocidad para habla más clara:
    // - rate: 0.90 para habla pausada y clara
    utterance.rate = 0.90;
    
    // Al terminar el último fragmento, la lectura ha finalizado por completo.
    if (i === chunks.length - 1) {
      utterance.onend = () => {
        // Solo limpiamos si seguimos siendo la reproducción activa.
        if (state.activeId === id) stop();
      };
    }
    window.speechSynthesis.speak(utterance);
  });

  clearKeepAlive();
  keepAliveTimer = setInterval(() => {
    if (!isSpeechSupported()) return;
    window.speechSynthesis.pause();
    window.speechSynthesis.resume();
  }, 10000);
}

/** Suscripción para `useSyncExternalStore`. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Snapshot actual del estado (para `useSyncExternalStore`). */
export function getState(): TtsState {
  return state;
}
