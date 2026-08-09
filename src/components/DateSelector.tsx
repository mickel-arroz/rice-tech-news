import { useEffect, useRef, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs/tabs';
import { CalendarIcon } from '@/components/icons';
import { newsDateString } from '@/lib/date';
import { dateTabLabel, strings } from '@/lib/i18n';
import type { DateAvailability, Lang } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DateSelectorProps {
  lang: Lang;
  dates: DateAvailability[];
  selected: string;
  onSelect: (date: string) => void;
}

// Ancho reservado por cada botón "…" al calcular cuántas pestañas caben
const MORE_BTN_WIDTH = 56;

interface OverflowMenuProps {
  items: DateAvailability[];
  align: 'left' | 'right';
  open: boolean;
  selected: string;
  label: (date: string) => string;
  onToggle: () => void;
  onSelect: (date: string) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

function OverflowMenu({
  items,
  align,
  open,
  selected,
  label,
  onToggle,
  onSelect,
  menuRef,
}: OverflowMenuProps) {
  return (
    <div ref={menuRef} className={cn('relative', align === 'right' && 'ml-auto')}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onToggle}
        className="-mb-px cursor-pointer border-b-2 border-transparent px-3 py-2 font-mono text-[0.7rem] font-medium tracking-widest text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
      >
        …
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute top-full z-50 mt-1 flex min-w-36 flex-col border border-[var(--border)] bg-[var(--surface)] shadow-[var(--glow-green)]',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((d) => (
            <button
              key={d.date}
              role="menuitem"
              type="button"
              disabled={!d.available}
              onClick={() => onSelect(d.date)}
              className={cn(
                'px-4 py-2 text-left font-mono text-[0.7rem] uppercase tracking-widest transition-colors',
                d.date === selected
                  ? 'text-[var(--color-green)] [text-shadow:var(--text-glow-green)]'
                  : 'text-[var(--text-secondary)]',
                d.available
                  ? 'cursor-pointer hover:bg-[var(--surface-raised)] hover:text-[var(--color-green)]'
                  : 'cursor-not-allowed opacity-40',
              )}
            >
              {label(d.date)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DateSelector({ lang, dates, selected, onSelect }: DateSelectorProps) {
  const t = strings[lang];
  const today = newsDateString();
  const label = (date: string) => (date === today ? t.today : dateTabLabel(date, lang));

  const listRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const leftMenuRef = useRef<HTMLDivElement>(null);
  const rightMenuRef = useRef<HTMLDivElement>(null);
  const [window, setWindow] = useState<[number, number]>([0, dates.length - 1]);
  const [openMenu, setOpenMenu] = useState<'left' | 'right' | null>(null);

  // Ventana deslizante centrada en el día seleccionado: se expande alternando
  // hacia ambos lados mientras quepa, reservando espacio para los "…"
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const measure = () => {
      const widths = Array.from(measureRef.current?.children ?? []).map(
        (c) => (c as HTMLElement).offsetWidth,
      );
      const available = el.clientWidth;
      const n = dates.length;
      if (widths.reduce((a, b) => a + b, 0) <= available) {
        setWindow([0, n - 1]);
        return;
      }

      const s = Math.max(
        0,
        dates.findIndex((d) => d.date === selected),
      );
      const budget = available - 2 * MORE_BTN_WIDTH;
      let start = s;
      let end = s;
      let used = widths[s] ?? 0;

      let expanded = true;
      while (expanded) {
        expanded = false;
        if (end + 1 < n && used + widths[end + 1] <= budget) {
          end++;
          used += widths[end];
          expanded = true;
        }
        if (start - 1 >= 0 && used + widths[start - 1] <= budget) {
          start--;
          used += widths[start];
          expanded = true;
        }
      }
      setWindow([start, end]);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [dates, lang, selected]);

  useEffect(() => {
    if (!openMenu) return;
    const close = (e: MouseEvent) => {
      const ref = openMenu === 'left' ? leftMenuRef : rightMenuRef;
      if (!ref.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [openMenu]);

  const [start, end] = window;
  const leftOverflow = dates.slice(0, start);
  const visible = dates.slice(start, end + 1);
  const rightOverflow = dates.slice(end + 1);

  const pick = (date: string) => {
    onSelect(date);
    setOpenMenu(null);
  };

  return (
    <div className="relative flex items-center gap-3">
      <CalendarIcon size={16} className="shrink-0 text-[var(--text-muted)]" />

      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute -z-10 flex h-0 overflow-hidden whitespace-nowrap"
      >
        {dates.map((d) => (
          <span
            key={d.date}
            className="px-4 py-2 font-mono text-[0.7rem] font-medium uppercase tracking-widest"
          >
            {label(d.date)}
          </span>
        ))}
      </div>

      <Tabs value={selected} onValueChange={onSelect} className="min-w-0 flex-1">
        <TabsList ref={listRef} className="flex-nowrap">
          {leftOverflow.length > 0 && (
            <OverflowMenu
              items={leftOverflow}
              align="left"
              open={openMenu === 'left'}
              selected={selected}
              label={label}
              onToggle={() => setOpenMenu((m) => (m === 'left' ? null : 'left'))}
              onSelect={pick}
              menuRef={leftMenuRef}
            />
          )}

          {visible.map((d) => (
            <TabsTrigger
              key={d.date}
              value={d.date}
              disabled={!d.available}
              className="whitespace-nowrap"
            >
              {label(d.date)}
            </TabsTrigger>
          ))}

          {rightOverflow.length > 0 && (
            <OverflowMenu
              items={rightOverflow}
              align="right"
              open={openMenu === 'right'}
              selected={selected}
              label={label}
              onToggle={() => setOpenMenu((m) => (m === 'right' ? null : 'right'))}
              onSelect={pick}
              menuRef={rightMenuRef}
            />
          )}
        </TabsList>
      </Tabs>
    </div>
  );
}
