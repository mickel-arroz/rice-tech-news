import { Badge } from '@/components/ui/badge/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card/card';
import { Typography } from '@/components/ui/typography/typography';
import { CommentIcon, PointsIcon } from '@/components/icons';
import type { Lang, LocalizedStory } from '@/lib/types';

interface StoryCardProps {
  lang: Lang;
  story: LocalizedStory;
  onOpen: (story: LocalizedStory) => void;
}

function metrics(story: LocalizedStory) {
  let points = 0;
  let comments = 0;
  for (const s of story.sources) {
    points += s.points ?? 0;
    comments += s.comments ?? 0;
  }
  return { points, comments };
}

export default function StoryCard({ lang, story, onOpen }: StoryCardProps) {
  const { points, comments } = metrics(story);
  const sourceNames = [...new Set(story.sources.map((s) => s.name))];

  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-[var(--glow-green)]">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-1.5">
          {sourceNames.map((name) => (
            <Badge key={name} variant="ACTIVE">
              {name}
            </Badge>
          ))}
          {story.sources.length > 1 && (
            <Badge variant="WARNING">×{story.sources.length}</Badge>
          )}
        </div>
        <CardTitle>
          <button
            type="button"
            onClick={() => onOpen(story)}
            className="glitch-hover cursor-pointer bg-transparent p-0 text-left font-mono text-base font-semibold tracking-wide text-[var(--text-secondary)] transition-colors hover:text-[var(--color-green)] hover:[text-shadow:var(--text-glow-green)]"
          >
            {story.title}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <Typography variant="P">{story.shortSummary}</Typography>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="flex flex-wrap gap-1.5">
          {story.tags?.map((tag) => (
            <Badge key={tag} variant="OFFLINE">
              {tag}
            </Badge>
          ))}
        </span>
        <span className="ml-auto flex items-center gap-3 text-[0.7rem] text-[var(--text-muted)]">
          {points > 0 && (
            <span className="flex items-center gap-1" title="points">
              <PointsIcon size={11} /> {points}
            </span>
          )}
          {comments > 0 && (
            <span className="flex items-center gap-1" title="comments">
              <CommentIcon size={11} /> {comments}
            </span>
          )}
        </span>
      </CardFooter>
    </Card>
  );
}
