import { Trans, useLingui } from '@lingui/react/macro';
import { ChevronDown, ChevronUp, PanelRightClose, PanelRightOpen, X } from 'lucide-react';
import { AgentIcon } from '@/components/icons/AgentIcon';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { DocumentReviewView } from '@/lib/document-review/types';

interface DocumentReviewBarProps {
  view: DocumentReviewView;
  docTitle: string;
  totalAdditions: number;
  totalDeletions: number;
  changeIndex: number;
  changeCount: number;
  isPanelCollapsed: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onRenderMode: (mode: 'rendered' | 'source') => void;
  onTogglePanel: () => void;
  onToggleMarksHidden: () => void;
  onKeep: () => void;
}

export function DocumentReviewBar({
  view,
  docTitle,
  totalAdditions,
  totalDeletions,
  changeIndex,
  changeCount,
  isPanelCollapsed,
  onClose,
  onPrev,
  onNext,
  onRenderMode,
  onTogglePanel,
  onToggleMarksHidden,
  onKeep,
}: DocumentReviewBarProps) {
  const { t } = useLingui();
  const hasChanges = changeCount > 0;
  const displayIndex = hasChanges ? changeIndex + 1 : 0;
  const marksVisible = !view.marksHidden;

  return (
    <div
      className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-border bg-background px-3 py-2"
      data-testid="document-review-bar"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            data-testid="document-review-close"
            aria-label={t`Close review`}
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <Trans>Close review</Trans>
        </TooltipContent>
      </Tooltip>

      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: view.agentColor }}
      >
        <AgentIcon icon={view.agentIcon} width={13} height={13} />
      </span>

      <div className="min-w-0 max-w-[12rem] shrink">
        <div className="truncate text-sm font-medium text-foreground">{docTitle}</div>
        <div className="truncate text-xs text-muted-foreground">
          {view.agentDisplayName} · {view.timeRangeLabel}
        </div>
      </div>

      <span
        className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
        data-testid="document-review-unsaved"
      >
        <Trans>Unsaved</Trans>
      </span>

      {marksVisible ? (
        <div className="mx-auto flex shrink-0 items-center gap-2 text-xs tabular-nums">
          <span aria-hidden="true" className="text-emerald-600 dark:text-emerald-500">
            +{totalAdditions}
          </span>
          <span aria-hidden="true" className="text-red-600 dark:text-red-500">
            −{totalDeletions}
          </span>
        </div>
      ) : (
        <div className="mx-auto shrink-0" aria-hidden="true" />
      )}

      <div className="ms-auto flex flex-wrap items-center justify-end gap-2">
        {marksVisible && hasChanges ? (
          <>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {displayIndex} of {changeCount} changes
            </span>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                data-testid="document-review-prev"
                aria-label={t`Previous change`}
                disabled={changeIndex <= 0}
                onClick={onPrev}
              >
                <ChevronUp className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                data-testid="document-review-next"
                aria-label={t`Next change`}
                disabled={changeIndex >= changeCount - 1}
                onClick={onNext}
              >
                <ChevronDown className="size-4" />
              </Button>
            </div>
          </>
        ) : null}

        <Button
          variant="outline"
          size="sm"
          className="h-7 shrink-0 px-2.5 text-xs"
          data-testid="document-review-toggle-marks"
          onClick={onToggleMarksHidden}
        >
          {marksVisible ? <Trans>Hide marks</Trans> : <Trans>Show changes</Trans>}
        </Button>

        <Button
          variant="default"
          size="sm"
          className="h-7 shrink-0 px-2.5 text-xs"
          data-testid="document-review-keep"
          onClick={onKeep}
        >
          <Trans>Keep</Trans>
        </Button>

        {marksVisible ? (
          <ToggleGroup
            type="single"
            value={view.renderMode}
            onValueChange={(v) => {
              if (v === 'rendered' || v === 'source') onRenderMode(v);
            }}
            aria-label={t`Diff render mode`}
            variant="segmented"
            size="sm"
            spacing={1}
            className="shrink-0 rounded-md bg-muted p-0.5 dark:bg-background"
          >
            <ToggleGroupItem
              value="rendered"
              className="h-6 px-2 text-xs"
              data-testid="document-review-render-rendered"
            >
              <Trans>Rendered</Trans>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="source"
              className="h-6 px-2 text-xs"
              data-testid="document-review-render-source"
            >
              <Trans>Source</Trans>
            </ToggleGroupItem>
          </ToggleGroup>
        ) : null}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              data-testid="document-review-toggle-panel"
              aria-label={isPanelCollapsed ? 'Show panel' : 'Hide panel'}
              aria-expanded={!isPanelCollapsed}
              onClick={onTogglePanel}
            >
              {isPanelCollapsed ? (
                <PanelRightOpen className="size-4" />
              ) : (
                <PanelRightClose className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isPanelCollapsed ? <Trans>Show panel</Trans> : <Trans>Hide panel</Trans>}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
