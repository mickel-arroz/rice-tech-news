import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert/alert';
import { Button } from '@/components/ui/button/button';
import { strings } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

interface EmptyStateProps {
  lang: Lang;
  kind: 'missing' | 'error';
  onRetry?: () => void;
}

export default function EmptyState({ lang, kind, onRetry }: EmptyStateProps) {
  const t = strings[lang];
  const isError = kind === 'error';
  return (
    <Alert variant={isError ? 'CRITICAL' : 'WARNING'}>
      <AlertTitle>{isError ? t.errorTitle : t.emptyTitle}</AlertTitle>
      <AlertDescription>
        {isError ? t.errorBody : t.emptyBody}
        {isError && onRetry && (
          <div className="mt-3">
            <Button variant="ABORT" size="SM" onClick={onRetry}>
              {t.retry}
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
