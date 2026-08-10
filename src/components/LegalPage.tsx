import Header from '@/components/Header';
import { legalContent } from '@/lib/legal';
import { useLang } from '@/lib/useLang';

interface LegalPageProps {
  which: 'privacy' | 'terms';
}

export default function LegalPage({ which }: LegalPageProps) {
  const [lang, setLang] = useLang();
  const doc = legalContent[which][lang];

  return (
    <>
      <Header lang={lang} onLangChange={setLang} homeLink />

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-8">
        <article className="flex flex-col gap-6 font-mono">
          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold uppercase tracking-[0.12em] text-[var(--color-green)]">
              {doc.title}
            </h1>
            <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">
              {doc.updatedLabel}
            </p>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {doc.intro}
            </p>
          </header>

          {doc.sections.map((section) => (
            <section key={section.heading} className="flex flex-col gap-2">
              <h2 className="text-base font-medium uppercase tracking-widest text-[var(--color-green)]">
                {section.heading}
              </h2>
              {section.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="text-sm leading-relaxed text-[var(--text-secondary)] [&_a]:text-[var(--color-green)] [&_a:hover]:[text-shadow:var(--text-glow-green)]"
                  dangerouslySetInnerHTML={{ __html: p }}
                />
              ))}
            </section>
          ))}
        </article>
      </main>
    </>
  );
}
