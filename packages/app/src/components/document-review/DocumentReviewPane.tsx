import type { FrontmatterDelta } from '@inkeep/open-knowledge-core';
import { Trans, useLingui } from '@lingui/react/macro';
import { createPatch } from 'diff';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DocumentReviewBar } from '@/components/document-review/DocumentReviewBar';
import {
  computeRenderedDiff,
  ReviewRenderedDiffView,
} from '@/components/document-review/ReviewRenderedDiffView';
import { PropertyDiffBlock } from '@/components/PropertyDiffBlock';
import { Spinner } from '@/components/ui/spinner';
import { closeAgentDiff } from '@/lib/agent-diff-store';
import {
  billingInvoicesDemoDiff,
  isBillingInvoicesDemoDoc,
} from '@/lib/document-review/demo-billing-invoices';
import { demoReviewBindings } from '@/lib/document-review/review-change-positions';
import {
  dismissDocumentReview,
  keepDocumentReviewChanges,
  setDocumentReviewMarksHidden,
  setDocumentReviewRenderMode,
  setDocumentReviewSelectedChange,
  useDocumentReviewView,
} from '@/lib/document-review/store';
import type { DocumentReviewView } from '@/lib/document-review/types';
import { LruStringCache } from '@/lib/lru-string-cache';
import { isOverlayLayerOpen } from '@/lib/overlay-layers';
import { closeTimelineDiff } from '@/lib/timeline-diff-store';
import { fetchAgentBurstDiff } from '@/lib/use-activity-panel';
import {
  countDiffStat,
  HISTORICAL_CONTENT_CACHE_LIMIT,
  useTimelineEntryDiff,
} from '@/lib/use-timeline-entry-diff';

const LazyActivityPanelDiffView = lazy(async () => {
  const mod = await import('@/components/ActivityPanelDiffView');
  return { default: mod.ActivityPanelDiffView };
});

const EMPTY_DELTA: FrontmatterDelta = { changes: [], unparseable: null };

interface DocumentReviewPaneProps {
  view: DocumentReviewView;
  isPanelCollapsed: boolean;
  onTogglePanel: () => void;
}

function docTitleFromName(docName: string): string {
  const base = docName.split('/').pop() ?? docName;
  return base
    .replace(/\.mdx?$/i, '')
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function useDemoDiff(docName: string): {
  status: 'ready';
  before: string;
  after: string;
  diff: string;
  properties: FrontmatterDelta;
} {
  const demo = billingInvoicesDemoDiff();
  return {
    status: 'ready' as const,
    before: demo.before,
    after: demo.after,
    diff: createPatch(docName, demo.before, demo.after, '', '', { context: 3 }),
    properties: EMPTY_DELTA,
  };
}

function useAgentDiffBody(
  source: Extract<DocumentReviewView['source'], { kind: 'agent' }> | null,
): {
  status: 'idle' | 'loading' | 'ready' | 'error';
  before: string;
  after: string;
  diff: string;
  properties: FrontmatterDelta;
} {
  const [result, setResult] = useState<{
    status: 'idle' | 'loading' | 'ready' | 'error';
    before: string;
    after: string;
    diff: string;
    properties: FrontmatterDelta;
  }>({ status: 'idle', before: '', after: '', diff: '', properties: EMPTY_DELTA });

  useEffect(() => {
    if (source === null) {
      setResult({ status: 'idle', before: '', after: '', diff: '', properties: EMPTY_DELTA });
      return;
    }
    let cancelled = false;
    setResult({ status: 'loading', before: '', after: '', diff: '', properties: EMPTY_DELTA });
    fetchAgentBurstDiff(source.agentId, source.docName, source.keptCount)
      .then((data) => {
        if (cancelled) return;
        setResult({ status: 'ready', ...data });
      })
      .catch(() => {
        if (!cancelled) {
          setResult({
            status: 'error',
            before: '',
            after: '',
            diff: '',
            properties: EMPTY_DELTA,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  return result;
}

export function DocumentReviewPane({
  view,
  isPanelCollapsed,
  onTogglePanel,
}: DocumentReviewPaneProps) {
  const { t } = useLingui();
  const docName = view.source.docName;
  const diffBodyRef = useRef<HTMLDivElement>(null);
  const [cache] = useState(() => new LruStringCache(HISTORICAL_CONTENT_CACHE_LIMIT));

  const isDemo = view.source.kind === 'demo' || isBillingInvoicesDemoDoc(docName);
  const demoBody = useDemoDiff(docName);
  const timelineSource = view.source.kind === 'timeline' ? view.source : null;
  const timelineBody = useTimelineEntryDiff(
    timelineSource?.sha ?? null,
    docName,
    cache,
    'vs-parent',
    timelineSource?.parentSha ?? null,
  );
  const agentSource = view.source.kind === 'agent' && !isDemo ? view.source : null;
  const agentBody = useAgentDiffBody(agentSource);

  const body = isDemo
    ? demoBody
    : timelineSource !== null
      ? timelineBody.status === 'ready'
        ? {
            status: 'ready' as const,
            before: timelineBody.before,
            after: timelineBody.after,
            diff: timelineBody.diff,
            properties: timelineBody.properties,
          }
        : timelineBody.status === 'error'
          ? { status: 'error' as const, before: '', after: '', diff: '', properties: EMPTY_DELTA }
          : { status: 'loading' as const, before: '', after: '', diff: '', properties: EMPTY_DELTA }
      : agentBody.status === 'ready'
        ? agentBody
        : agentBody.status === 'error'
          ? { status: 'error' as const, before: '', after: '', diff: '', properties: EMPTY_DELTA }
          : agentBody.status === 'loading'
            ? {
                status: 'loading' as const,
                before: '',
                after: '',
                diff: '',
                properties: EMPTY_DELTA,
              }
            : {
                status: 'loading' as const,
                before: '',
                after: '',
                diff: '',
                properties: EMPTY_DELTA,
              };

  const rendered = body.status === 'ready' ? computeRenderedDiff(body.before, body.after) : null;
  const usingRendered = view.renderMode === 'rendered' && rendered?.ok === true;
  const usingCleanAfter = view.marksHidden && body.status === 'ready';

  const reviewOptions =
    !view.marksHidden && rendered?.ok === true && view.changes.length > 0
      ? (() => {
          const { bindings, chipPositions } = demoReviewBindings(rendered.afterDoc, view.changes);
          return {
            bindings,
            chipPositions,
            selectedChangeId: view.selectedChangeId,
          };
        })()
      : undefined;

  const changes = view.changes;
  const selectedIndex = changes.findIndex((c) => c.id === view.selectedChangeId);
  const effectiveIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const selectedChange = selectedIndex >= 0 ? changes[selectedIndex] : null;

  const totals = changes.reduce(
    (acc, change) => ({
      additions: acc.additions + change.additions,
      deletions: acc.deletions + change.deletions,
    }),
    { additions: 0, deletions: 0 },
  );
  const stat = body.status === 'ready' && body.diff ? countDiffStat(body.diff) : totals;
  const showStat = stat.additions > 0 || stat.deletions > 0;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (isOverlayLayerOpen()) return;
      if (e.key === 'Escape') {
        dismissDocumentReview(docName);
        closeTimelineDiff();
        closeAgentDiff();
      }
      if (view.marksHidden || changes.length === 0) return;
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.min(effectiveIndex + 1, changes.length - 1);
        setDocumentReviewSelectedChange(changes[next]?.id ?? null);
      }
      if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = Math.max(effectiveIndex - 1, 0);
        setDocumentReviewSelectedChange(changes[prev]?.id ?? null);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [changes, effectiveIndex, docName, view.marksHidden]);

  function handleClose(): void {
    dismissDocumentReview(docName);
    closeTimelineDiff();
    closeAgentDiff();
  }

  function handleKeep(): void {
    keepDocumentReviewChanges(docName);
    closeTimelineDiff();
    closeAgentDiff();
    toast.message(t`Kept ${view.agentDisplayName}'s changes`);
  }

  function handleToggleMarksHidden(): void {
    setDocumentReviewMarksHidden(!view.marksHidden);
  }

  function handleRestoreChange(): void {
    toast.message(t`Restore this change`, {
      description: t`Per-change restore is a prototype affordance — not yet wired to the server.`,
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background" data-testid="document-review-pane">
      <DocumentReviewBar
        view={view}
        docTitle={docTitleFromName(docName)}
        totalAdditions={showStat ? stat.additions : totals.additions}
        totalDeletions={showStat ? stat.deletions : totals.deletions}
        changeIndex={changes.length > 0 ? effectiveIndex : 0}
        changeCount={changes.length}
        isPanelCollapsed={isPanelCollapsed}
        onClose={handleClose}
        onPrev={() => {
          const prev = Math.max(effectiveIndex - 1, 0);
          setDocumentReviewSelectedChange(changes[prev]?.id ?? null);
        }}
        onNext={() => {
          const next = Math.min(effectiveIndex + 1, changes.length - 1);
          setDocumentReviewSelectedChange(changes[next]?.id ?? null);
        }}
        onRenderMode={setDocumentReviewRenderMode}
        onTogglePanel={onTogglePanel}
        onToggleMarksHidden={handleToggleMarksHidden}
        onKeep={handleKeep}
      />

      <div ref={diffBodyRef} className="flex min-h-0 flex-1 flex-col">
        {body.status === 'loading' && (
          <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
            <Spinner aria-hidden="true" className="size-3" />
            <Trans>Loading changes</Trans>
          </div>
        )}
        {body.status === 'error' && (
          <p className="px-4 py-3 text-xs text-destructive">
            <Trans>Changes unavailable</Trans>
          </p>
        )}
        {body.status === 'ready' && body.properties.changes.length > 0 ? (
          <PropertyDiffBlock delta={body.properties} />
        ) : null}
        {body.status === 'ready' &&
          (usingCleanAfter ? (
            rendered?.ok ? (
              <ReviewRenderedDiffView
                diff={rendered}
                reviewOptions={undefined}
                marksHidden
                selectedChange={null}
              />
            ) : (
              <pre className="document-review-scroll min-h-0 flex-1 overflow-auto whitespace-pre-wrap px-6 py-4 font-mono text-xs text-foreground/90 subtle-scrollbar">
                {body.after}
              </pre>
            )
          ) : usingRendered ? (
            <ReviewRenderedDiffView
              diff={rendered}
              reviewOptions={reviewOptions}
              marksHidden={false}
              selectedChange={selectedChange}
              onRestoreChange={isDemo && selectedChange !== null ? handleRestoreChange : undefined}
            />
          ) : body.diff === '' ? (
            <>
              <p className="border-b border-border px-4 py-2 text-xs text-muted-foreground italic">
                <Trans>No content changes in this version</Trans>
              </p>
              <pre className="whitespace-pre-wrap px-4 py-3 font-mono text-xs text-foreground/90">
                {body.after}
              </pre>
            </>
          ) : (
            <Suspense
              fallback={
                <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
                  <Spinner aria-hidden="true" className="size-3" />
                  <Trans>Loading diff renderer</Trans>
                </div>
              }
            >
              <LazyActivityPanelDiffView
                before={body.before}
                after={body.after}
                cacheKey={`review@${docName}@${view.source.kind}`}
              />
            </Suspense>
          ))}
      </div>
    </div>
  );
}

export function DocumentReviewPaneHost({
  docName,
  isPanelCollapsed,
  onTogglePanel,
}: {
  docName: string;
  isPanelCollapsed: boolean;
  onTogglePanel: () => void;
}) {
  const view = useDocumentReviewView();
  if (view === null || view.source.docName !== docName) return null;
  return (
    <DocumentReviewPane
      view={view}
      isPanelCollapsed={isPanelCollapsed}
      onTogglePanel={onTogglePanel}
    />
  );
}
