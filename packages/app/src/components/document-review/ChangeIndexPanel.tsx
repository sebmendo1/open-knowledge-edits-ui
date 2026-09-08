import { Trans } from '@lingui/react/macro';
import { Button } from '@/components/ui/button';
import type { DocumentReviewChange } from '@/lib/document-review/types';
import { cn } from '@/lib/utils';

interface ChangeIndexPanelProps {
  changes: readonly DocumentReviewChange[];
  selectedChangeId: string | null;
  onSelect: (changeId: string) => void;
}

export function ChangeIndexPanel({ changes, selectedChangeId, onSelect }: ChangeIndexPanelProps) {
  if (changes.length === 0) {
    return (
      <div
        className="px-3 py-4 text-xs text-muted-foreground italic"
        data-testid="change-index-empty"
      >
        <Trans>No indexed changes for this version.</Trans>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 px-2 py-2" data-testid="change-index-panel">
      <div className="px-1 pb-1 text-xs font-medium text-muted-foreground">
        <Trans>Changes</Trans>
      </div>
      {changes.map((change) => {
        const selected = change.id === selectedChangeId;
        return (
          <Button
            key={change.id}
            type="button"
            variant="ghost"
            data-testid={`change-index-row-${change.id}`}
            className={cn(
              'h-auto w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-left font-normal',
              selected ? 'bg-muted' : 'hover:bg-muted/80',
            )}
            onClick={() => onSelect(change.id)}
          >
            <div className="flex items-center gap-2">
              <time className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {change.time}
              </time>
              <span className="truncate text-xs font-medium text-foreground">{change.section}</span>
              <span className="ms-auto shrink-0 text-[10px] tabular-nums text-muted-foreground">
                {change.additions > 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-500">
                    +{change.additions}
                  </span>
                ) : null}
                {change.additions > 0 && change.deletions > 0 ? ' ' : null}
                {change.deletions > 0 ? (
                  <span className="text-red-600 dark:text-red-500">−{change.deletions}</span>
                ) : null}
              </span>
            </div>
            <p className="text-xs leading-snug text-muted-foreground">{change.summary}</p>
          </Button>
        );
      })}
    </div>
  );
}
