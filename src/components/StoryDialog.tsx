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
import { CommentIcon, ExternalLinkIcon, PointsIcon } from '@/components/icons';
import { strings } from '@/lib/i18n';
import type { Lang, LocalizedStory } from '@/lib/types';

interface StoryDialogProps {
  lang: Lang;
  story: LocalizedStory | null;
  onClose: () => void;
}

export default function StoryDialog({ lang, story, onClose }: StoryDialogProps) {
  const t = strings[lang];
  return (
    <Dialog open={story !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-3xl">
        {story && (
          <>
            <DialogHeader>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {story.tags?.map((tag) => (
                  <Badge key={tag} variant="OFFLINE">
                    {tag}
                  </Badge>
                ))}
              </div>
              <DialogTitle style={{ fontSize: '1.1rem' }}>
                {story.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {story.shortSummary}
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4">
              {story.longSummary?.map((paragraph, i) => (
                <Typography key={i} variant="P">
                  {paragraph}
                </Typography>
              ))}

              <Separator />

              <Typography variant="H4" className="text-[var(--color-green)]">
                {t.sources}
              </Typography>
              <ul className="flex flex-col gap-2">
                {story.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t.openOriginal}
                      className="group flex items-start gap-2 border border-[var(--border)] bg-[var(--surface)] px-3 py-2 transition-all hover:border-[var(--border-active)] hover:shadow-[var(--glow-green)]"
                    >
                      <ExternalLinkIcon
                        size={12}
                        className="mt-1 shrink-0 text-[var(--text-muted)] transition-colors group-hover:text-[var(--color-green)]"
                      />
                      <span className="min-w-0">
                        <span className="mr-2 font-semibold text-[var(--color-green)]">
                          [{source.name}]
                        </span>
                        <span className="break-words text-[var(--text-secondary)] group-hover:text-[var(--color-green)]">
                          {source.title}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.65rem] text-[var(--text-muted)]">
                          {source.points !== undefined && (
                            <span className="flex items-center gap-1">
                              <PointsIcon size={10} /> {source.points} {t.points}
                            </span>
                          )}
                          {source.comments !== undefined && (
                            <span className="flex items-center gap-1">
                              <CommentIcon size={10} /> {source.comments} {t.comments}
                            </span>
                          )}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </DialogBody>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
