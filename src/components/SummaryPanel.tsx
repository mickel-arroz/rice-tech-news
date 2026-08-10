import { Badge } from '@/components/ui/badge/badge';
import SpeakButton from '@/components/SpeakButton';
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from '@/components/ui/panel/panel';
import { Typography } from '@/components/ui/typography/typography';
import { dateLongLabel, strings } from '@/lib/i18n';
import type { DayResponse, Lang } from '@/lib/types';

interface SummaryPanelProps {
  lang: Lang;
  day: DayResponse;
  storyCount?: number;
}

export default function SummaryPanel({ lang, day, storyCount }: SummaryPanelProps) {
  const t = strings[lang];
  return (
    <Panel notch="md" className="scanlines">
      <PanelHeader>
        <PanelTitle>{t.dailySummary}</PanelTitle>
        <span className="ml-auto flex items-center gap-2">
          <SpeakButton text={day.summary} lang={lang} size="SM" />
          <Badge variant="ACTIVE">{t.storiesCount(storyCount ?? day.stories.length)}</Badge>
        </span>
      </PanelHeader>
      <PanelContent>
        <Typography variant="MUTED" className="mb-2 uppercase tracking-widest">
          {dateLongLabel(day.date, lang)}
        </Typography>
        <Typography variant="LEAD" className="text-[var(--color-green)]">
          {day.summary}
        </Typography>
      </PanelContent>
    </Panel>
  );
}
