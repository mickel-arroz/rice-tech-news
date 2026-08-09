import { useCallback, useEffect, useMemo, useState } from 'react';
import AsciiRainBg from '@/components/AsciiRainBg';
import DateSelector from '@/components/DateSelector';
import EmptyState from '@/components/EmptyState';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import StoryCard from '@/components/StoryCard';
import StoryDialog from '@/components/StoryDialog';
import SummaryPanel from '@/components/SummaryPanel';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { Spinner } from '@/components/ui/spinner/spinner';
import { Typography } from '@/components/ui/typography/typography';
import { lastNDates } from '@/lib/date';
import { DEFAULT_LANG, LANG_STORAGE_KEY, strings } from '@/lib/i18n';
import type { DateAvailability, DayResponse, Lang, LocalizedStory } from '@/lib/types';

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

export default function NewsApp() {
  const [lang, setLang] = useLang();
  const fallbackDates = useMemo(
    () => lastNDates(7).map((date) => ({ date, available: true })),
    [],
  );
  const [dates, setDates] = useState<DateAvailability[]>(fallbackDates);
  const [selectedDate, setSelectedDate] = useState(fallbackDates[0].date);
  const [days, setDays] = useState<Record<string, DayState>>({});
  const [openStory, setOpenStory] = useState<LocalizedStory | null>(null);

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
      .catch(() => {});
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
    if (!days[`${selectedDate}:${lang}`]) loadDay(selectedDate, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, lang]);

  const t = strings[lang];
  const day = days[`${selectedDate}:${lang}`] ?? 'loading';

  return (
    <>
      <AsciiRainBg />
      <div className="relative z-10 min-h-screen">
        <Header lang={lang} onLangChange={setLang} />

        <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-8">
          <DateSelector
            lang={lang}
            dates={dates}
            selected={selectedDate}
            onSelect={setSelectedDate}
          />

          {day === 'loading' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3 text-[var(--text-muted)]">
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
              <SummaryPanel lang={lang} day={day} />

              <section aria-label={t.stories}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {day.stories.map((story) => (
                    <StoryCard
                      key={story.id}
                      lang={lang}
                      story={story}
                      onOpen={setOpenStory}
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </main>

        <Footer lang={lang} />
      </div>

      <StoryDialog lang={lang} story={openStory} onClose={() => setOpenStory(null)} />
    </>
  );
}
