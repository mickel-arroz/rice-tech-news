import { Badge } from '@/components/ui/badge/badge';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog/dialog';
import { Separator } from '@/components/ui/separator/separator';
import { Typography } from '@/components/ui/typography/typography';
import { GitHubIcon } from '@/components/icons';
import { AUTHOR, GITHUB_REPO_URL, aboutContent, aboutSources } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

interface AboutDialogProps {
  lang: Lang;
  open: boolean;
  onClose: () => void;
}

export default function AboutDialog({ lang, open, onClose }: AboutDialogProps) {
  const c = aboutContent[lang];
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle
            style={{ color: 'var(--color-green)', fontSize: '1rem', fontWeight: 500 }}
          >
            {c.title}
          </DialogTitle>
          <DialogDescription
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.625,
            }}
          >
            {c.intro}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          <section className="flex flex-col gap-2">
            <Typography variant="H4" style={{ color: 'var(--color-green)' }}>{c.whatTitle}</Typography>
            <Typography variant="P" className="text-[var(--text-secondary)]">
              {c.whatBody}
            </Typography>
          </section>

          <Separator />

          <section className="flex flex-col gap-2">
            <Typography variant="H4" style={{ color: 'var(--color-green)' }}>{c.sourcesTitle}</Typography>
            <div className="flex flex-wrap gap-1.5">
              {aboutSources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={source.name}
                  className="group"
                >
                  <Badge
                    variant="OFFLINE"
                    className="text-[var(--text-secondary)] transition-colors group-hover:border-[var(--color-green)] group-hover:text-[var(--color-green)]"
                  >
                    {source.name}
                  </Badge>
                </a>
              ))}
            </div>
          </section>

          <Separator />

          <section className="flex flex-col gap-2">
            <Typography variant="H4" style={{ color: 'var(--color-green)' }}>{c.techTitle}</Typography>
            <div className="flex flex-wrap gap-1.5">
              {c.tech.map((item) => (
                <Badge
                  key={item}
                  variant="OFFLINE"
                  className="text-[var(--text-secondary)]"
                >
                  {item}
                </Badge>
              ))}
            </div>
          </section>

          <Separator />

          <section className="flex flex-col gap-2">
            <Typography variant="H4" style={{ color: 'var(--color-green)' }}>{c.aiTitle}</Typography>
            <Typography variant="P" className="text-[var(--text-secondary)]">
              {c.aiBody}
            </Typography>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[0.7rem] uppercase tracking-widest text-[var(--text-muted)]">
                Model
              </span>
              <Badge variant="SCANNING">{c.aiModel}</Badge>
            </div>
          </section>

          <Separator />

          <section className="flex flex-col gap-2">
            <Typography variant="H4" style={{ color: 'var(--color-green)' }}>{c.creditsTitle}</Typography>
            <Typography variant="P" className="text-[var(--text-secondary)]">
              {c.creditsBody}
            </Typography>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8rem]">
              <a
                href={AUTHOR.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-green)] transition-colors hover:[text-shadow:var(--text-glow-green)]"
              >
                LinkedIn
              </a>
              <span className="text-[var(--text-muted)]">·</span>
              <a
                href={AUTHOR.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-green)] transition-colors hover:[text-shadow:var(--text-glow-green)]"
              >
                Portfolio
              </a>
            </div>
          </section>

          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-1 inline-flex items-center gap-2 self-start border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[0.75rem] uppercase tracking-widest text-[var(--text-secondary)] transition-all hover:border-[var(--border-active)] hover:text-[var(--color-green)] hover:shadow-[var(--glow-green)]"
          >
            <GitHubIcon
              size={16}
              className="text-[var(--text-muted)] transition-colors group-hover:text-[var(--color-green)]"
            />
            {c.viewOnGithub}
          </a>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
