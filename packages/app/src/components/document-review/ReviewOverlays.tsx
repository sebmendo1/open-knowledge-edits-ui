import { Trans } from '@lingui/react/macro';
import { Button } from '@/components/ui/button';
import type { DocumentReviewAuthorship } from '@/lib/document-review/types';
import { cn } from '@/lib/utils';

interface AuthorshipCardProps {
  authorship: DocumentReviewAuthorship;
  className?: string;
}

export function AuthorshipCard({ authorship, className }: AuthorshipCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-background/95 px-3 py-2 text-xs shadow-sm backdrop-blur-sm',
        className,
      )}
      data-testid="document-review-authorship-card"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
        <span>
          <span className="font-medium text-red-600 dark:text-red-400">{authorship.userLabel}</span>
          {' · '}
          {authorship.userTime}
        </span>
        <span aria-hidden="true">→</span>
        <span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {authorship.agentLabel}
          </span>
          {' · '}
          {authorship.agentTime}
        </span>
      </div>
      {authorship.message ? <p className="mt-1.5 text-foreground">{authorship.message}</p> : null}
    </div>
  );
}

interface StructuralCaptionProps {
  caption: string;
  className?: string;
}

export function StructuralCaption({ caption, className }: StructuralCaptionProps) {
  return (
    <p
      className={cn('my-2 text-center text-sm font-medium text-muted-foreground italic', className)}
      data-testid="document-review-structural-caption"
    >
      {caption}
    </p>
  );
}

interface RestoreChangeButtonProps {
  onRestore: () => void;
}

export function RestoreChangeButton({ onRestore }: RestoreChangeButtonProps) {
  return (
    <div className="mt-2 flex justify-end">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        data-testid="document-review-restore-change"
        onClick={onRestore}
      >
        <Trans>Restore this change</Trans>
      </Button>
    </div>
  );
}
