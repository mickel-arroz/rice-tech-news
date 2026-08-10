import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_LANG, LANG_STORAGE_KEY } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);
  useEffect(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'es' || saved === 'en') setLang(saved);
  }, []);
  const update = useCallback((l: Lang) => {
    setLang(l);
    localStorage.setItem(LANG_STORAGE_KEY, l);
  }, []);
  return [lang, update];
}
