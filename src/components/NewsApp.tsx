import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AboutDialog from '@/components/AboutDialog';
import AsciiRainBg from '@/components/AsciiRainBg';
import DateSelector from '@/components/DateSelector';
import EmptyState from '@/components/EmptyState';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import SourceFilter from '@/components/SourceFilter';
import StoryCard from '@/components/StoryCard';
import StoryDialog from '@/components/StoryDialog';
import SummaryPanel from '@/components/SummaryPanel';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { Spinner } from '@/components/ui/spinner/spinner';
import { Typography } from '@/components/ui/typography/typography';
import { lastNDates } from '@/lib/date';
import {
  ALL_SOURCES,
  DEFAULT_LANG,
  LANG_STORAGE_KEY,
  SOURCES_STORAGE_KEY,
  strings,
} from '@/lib/i18n';
import type {
  DateAvailability,
  DayResponse,
  Lang,
  LocalizedStory,
  SourceName,
} from '@/lib/types';

type DayState = DayResponse | 'loading' | 'missing' | 'error';

function useLang(): [Lang, (l: Lang) => void] {
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

function useSourceFilter(): [SourceName[], (next: SourceName[]) => void] {
  // Inicial = todas: el render por defecto (y el SSR) coincide, evitando hydration mismatch
  const [sources, setSources] = useState<SourceName[]>(ALL_SOURCES);
  useEffect(() => {
    const saved = localStorage.getItem(SOURCES_STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setSources(ALL_SOURCES.filter((s) => parsed.includes(s)));
      }
    } catch {
      /* ignore */
    }
  }, []);
  const update = useCallback((next: SourceName[]) => {
    setSources(next);
    localStorage.setItem(SOURCES_STORAGE_KEY, JSON.stringify(next));
  }, []);
  return [sources, update];
}

export default function NewsApp() {
  const [lang, setLang] = useLang();
  const [selectedSources, setSelectedSources] = useSourceFilter();
  const fallbackDates = useMemo(
    () => lastNDates(7).map((date) => ({ date, available: true })),
    [],
  );
  const [dates, setDates] = useState<DateAvailability[]>(fallbackDates);
  const [selectedDate, setSelectedDate] = useState(fallbackDates[0].date);
  const [days, setDays] = useState<Record<string, DayState>>({});
  const [openStory, setOpenStory] = useState<LocalizedStory | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  // Esperamos la disponibilidad real antes de cargar: evita pedir "hoy" (aún sin datos → 404)
  const [datesReady, setDatesReady] = useState(false);
  // Renderizamos el selector de fechas solo tras montar: evita el hydration mismatch (React #418)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Con una modal abierta, el gesto/botón de atrás la cierra en vez de salir de la página
  const dialogOpen = openStory !== null || aboutOpen;
  const closedByPopRef = useRef(false);
  useEffect(() => {
    if (!dialogOpen) return;
    window.history.pushState({ modal: true }, '');
    const onPop = () => {
      closedByPopRef.current = true;
      setOpenStory(null);
      setAboutOpen(false);
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (closedByPopRef.current) {
        closedByPopRef.current = false;
      } else {
        // Cerrada desde la UI (X, Escape, clic fuera): consumir la entrada del historial
        window.history.back();
      }
    };
  }, [dialogOpen]);

  // Disponibilidad de los 7 días; si falla, se dejan todos habilitados
  useEffect(() => {
    let cancelled = false;
    fetch('/api/dates')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { dates: DateAvailability[] }) => {
        if (cancelled || !data?.dates?.length) return;
        setDates(data.dates);
        // Si el día seleccionado no tiene datos, saltar al más reciente disponible
        setSelectedDate((current) => {
          const cur = data.dates.find((d) => d.date === current);
          if (cur?.available) return current;
          return data.dates.find((d) => d.available)?.date ?? current;
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setDatesReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadDay = useCallback((date: string, lng: Lang, force = false) => {
    const cacheKey = `${date}:${lng}`;
    setDays((prev) => {
      const known = prev[cacheKey];
      if (!force && known && known !== 'error') return prev;
      return { ...prev, [cacheKey]: 'loading' };
    });
    fetch(`/api/news?date=${date}&lang=${lng}`)
      .then(async (res) => {
        if (res.status === 404 || res.status === 400) return 'missing' as const;
        if (!res.ok) throw new Error(String(res.status));
        return (await res.json()) as DayResponse;
      })
      .then((value) => setDays((prev) => ({ ...prev, [cacheKey]: value })))
      .catch(() => setDays((prev) => ({ ...prev, [cacheKey]: 'error' })));
  }, []);

  useEffect(() => {
    if (!datesReady) return;
    if (!days[`${selectedDate}:${lang}`]) loadDay(selectedDate, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, lang, datesReady]);

  const t = strings[lang];
  const day = days[`${selectedDate}:${lang}`] ?? 'loading';

  const visibleStories = useMemo(
    () =>
      typeof day === 'object'
        ? day.stories.filter((s) =>
            s.sources.some((src) => selectedSources.includes(src.name)),
          )
        : [],
    [day, selectedSources],
  );

  return (
    <>
      <AsciiRainBg />
      <div className="relative z-10 min-h-screen">
        <Header lang={lang} onLangChange={setLang} onAbout={() => setAboutOpen(true)} />

        <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-8">
          {mounted && (
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <DateSelector
                  lang={lang}
                  dates={dates}
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                />
              </div>
              <SourceFilter
                lang={lang}
                selected={selectedSources}
                onChange={setSelectedSources}
              />
            </div>
          )}

          {day === 'loading' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3 text-(--text-muted)">
                <Spinner />
                <Typography variant="MUTED" className="uppercase tracking-widest">
                  {t.loading}
                </Typography>
              </div>
              <Skeleton className="h-36 w-full" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-52 w-full" />
                ))}
              </div>
            </div>
          )}

          {day === 'missing' && <EmptyState lang={lang} kind="missing" />}

          {day === 'error' && (
            <EmptyState
              lang={lang}
              kind="error"
              onRetry={() => loadDay(selectedDate, lang, true)}
            />
          )}

          {typeof day === 'object' && (
            <>
              <SummaryPanel lang={lang} day={day} storyCount={visibleStories.length} />

              <section aria-label={t.stories}>
                {visibleStories.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {visibleStories.map((story) => (
                      <StoryCard
                        key={story.id}
                        lang={lang}
                        story={story}
                        onOpen={setOpenStory}
                      />
                    ))}
                  </div>
                ) : (
                  <Typography
                    variant="MUTED"
                    className="py-8 text-center uppercase tracking-widest"
                  >
                    {t.filterEmpty}
                  </Typography>
                )}
              </section>
            </>
          )}
        </main>

        <Footer lang={lang} />
      </div>

      <StoryDialog lang={lang} story={openStory} onClose={() => setOpenStory(null)} />

      <AboutDialog lang={lang} open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
