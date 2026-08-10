import { useEffect, useRef, useState } from 'react';
import { FunnelIcon } from '@/components/icons';
import { ALL_SOURCES, strings } from '@/lib/i18n';
import type { Lang, SourceName } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SourceFilterProps {
  lang: Lang;
  selected: SourceName[];
  onChange: (next: SourceName[]) => void;
}

export default function SourceFilter({ lang, selected, onChange }: SourceFilterProps) {
  const t = strings[lang];
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const toggle = (name: SourceName) => {
    onChange(
      selected.includes(name)
        ? selected.filter((s) => s !== name)
        : [...selected, name],
    );
  };

  const filtered = selected.length < ALL_SOURCES.length;

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.filterSources}
        title={t.filterSources}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex cursor-pointer items-center border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 transition-colors hover:text-[var(--color-green)]',
          filtered ? 'text-[var(--color-green)]' : 'text-[var(--text-muted)]',
        )}
      >
        <span className="relative flex">
          <FunnelIcon size={16} className="shrink-0" />
          {filtered && (
            <span
              aria-hidden
              className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-[var(--color-green)] shadow-[var(--glow-green)]"
            />
          )}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-50 mt-1 flex min-w-52 flex-col border border-[var(--border)] bg-[var(--surface)] shadow-[var(--glow-green)]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-2">
            <span className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--text-muted)]">
              {t.filterSources}
            </span>
            <span className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChange([...ALL_SOURCES])}
                className="cursor-pointer font-mono text-[0.65rem] uppercase tracking-widest text-[var(--text-secondary)] transition-colors hover:text-[var(--color-green)]"
              >
                {t.allSources}
              </button>
              <span className="text-[var(--text-muted)]">/</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="cursor-pointer font-mono text-[0.65rem] uppercase tracking-widest text-[var(--text-secondary)] transition-colors hover:text-[var(--color-green)]"
              >
                {t.clearSources}
              </button>
            </span>
          </div>

          {ALL_SOURCES.map((name) => {
            const checked = selected.includes(name);
            return (
              <button
                key={name}
                role="menuitemcheckbox"
                aria-checked={checked}
                type="button"
                onClick={() => toggle(name)}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 px-3 py-2 text-left font-mono text-[0.7rem] tracking-widest transition-colors hover:bg-[var(--surface-raised)]',
                  checked
                    ? 'text-[var(--color-green)]'
                    : 'text-[var(--text-secondary)]',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'flex h-3.5 w-3.5 shrink-0 items-center justify-center border transition-colors',
                    checked
                      ? 'border-[var(--color-green)] bg-[var(--color-green)]'
                      : 'border-[var(--border-active)] bg-transparent',
                  )}
                >
                  {checked && (
                    <svg
                      width={10}
                      height={10}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--surface)"
                      strokeWidth={4}
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
