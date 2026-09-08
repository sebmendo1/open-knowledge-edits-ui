import { useSyncExternalStore } from 'react';
import type { AgentDiffView } from '@/lib/agent-diff-store';
import type { TimelineDiffView } from '@/lib/timeline-diff-store';
import {
  BILLING_DEMO_CHANGES,
  BILLING_INVOICES_DOC,
  isBillingInvoicesDemoDoc,
} from './demo-billing-invoices';
import {
  clearDocumentReviewKept,
  isDocumentReviewKept,
  markDocumentReviewKept,
} from './kept-state';
import type {
  DocumentReviewAgentSource,
  DocumentReviewTimelineSource,
  DocumentReviewView,
} from './types';

export { isDocumentReviewKept } from './kept-state';

let current: DocumentReviewView | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function demoView(docName: string): DocumentReviewView {
  return {
    source: { kind: 'demo', docName },
    agentDisplayName: 'Claude',
    agentColor: '#D97757',
    timeRangeLabel: '10:42–10:58',
    changes: BILLING_DEMO_CHANGES,
    selectedChangeId: null,
    renderMode: 'rendered',
    marksHidden: false,
  };
}

function freshReviewView(partial: Omit<DocumentReviewView, 'marksHidden'>): DocumentReviewView {
  return { ...partial, marksHidden: false };
}

export function openDocumentReviewFromTimeline(view: TimelineDiffView): void {
  clearDocumentReviewKept(view.docName);
  const source: DocumentReviewTimelineSource = {
    kind: 'timeline',
    docName: view.docName,
    sha: view.sha,
    parentSha: view.parentSha,
    laterEdits: view.laterEdits,
    authorName: view.authorName,
    relativeTime: view.relativeTime,
    absoluteTime: view.absoluteTime,
  };
  if (isBillingInvoicesDemoDoc(view.docName)) {
    current = freshReviewView({ ...demoView(view.docName), source });
    notify();
    return;
  }
  // WARN: setDocumentReviewChanges has no callers; non-demo reviews keep an empty change index
  current = freshReviewView({
    source,
    agentDisplayName: view.authorName,
    agentColor: '#6366f1',
    timeRangeLabel: view.relativeTime,
    changes: [],
    selectedChangeId: null,
    renderMode: 'rendered',
  });
  notify();
}

export function openDocumentReviewFromAgent(view: AgentDiffView): void {
  clearDocumentReviewKept(view.docName);
  const source: DocumentReviewAgentSource = {
    kind: 'agent',
    agentId: view.agentId,
    agentName: view.agentName,
    agentColor: view.agentColor,
    agentIcon: view.agentIcon,
    docName: view.docName,
    keptCount: view.keptCount,
    maxVersions: view.maxVersions,
  };
  if (isBillingInvoicesDemoDoc(view.docName)) {
    current = freshReviewView({
      ...demoView(view.docName),
      source,
      agentDisplayName: view.agentName,
      agentColor: view.agentColor,
      agentIcon: view.agentIcon,
    });
    notify();
    return;
  }
  // WARN: setDocumentReviewChanges has no callers; non-demo reviews keep an empty change index
  current = freshReviewView({
    source,
    agentDisplayName: view.agentName,
    agentColor: view.agentColor,
    agentIcon: view.agentIcon,
    timeRangeLabel: 'This session',
    changes: [],
    selectedChangeId: null,
    renderMode: 'rendered',
  });
  notify();
}

export function openDocumentReviewDemo(docName: string = BILLING_INVOICES_DOC): void {
  if (isDocumentReviewKept(docName)) return;
  current = demoView(docName);
  notify();
}

export function closeDocumentReview(): void {
  if (current !== null) {
    current = null;
    notify();
  }
}

export function keepDocumentReviewChanges(docName: string): void {
  markDocumentReviewKept(docName);
  closeDocumentReview();
}

export function dismissDocumentReview(docName: string): void {
  markDocumentReviewKept(docName);
  closeDocumentReview();
}

export function setDocumentReviewSelectedChange(changeId: string | null): void {
  if (current === null) return;
  if (current.selectedChangeId === changeId) return;
  current = { ...current, selectedChangeId: changeId };
  notify();
}

export function setDocumentReviewRenderMode(mode: 'rendered' | 'source'): void {
  if (current === null || current.renderMode === mode) return;
  current = { ...current, renderMode: mode };
  notify();
}

export function setDocumentReviewMarksHidden(hidden: boolean): void {
  if (current === null || current.marksHidden === hidden) return;
  current = {
    ...current,
    marksHidden: hidden,
    selectedChangeId: hidden ? null : current.selectedChangeId,
  };
  notify();
}

export function setDocumentReviewChanges(
  changes: DocumentReviewView['changes'],
  timeRangeLabel?: string,
): void {
  if (current === null) return;
  current = {
    ...current,
    changes,
    ...(timeRangeLabel !== undefined ? { timeRangeLabel } : {}),
  };
  notify();
}

export function documentReviewDocName(): string | null {
  if (current === null) return null;
  return current.source.docName;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): DocumentReviewView | null {
  return current;
}

export function useDocumentReviewView(): DocumentReviewView | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useDocumentReviewActiveForDoc(docName: string | null): boolean {
  const view = useDocumentReviewView();
  return view !== null && docName !== null && view.source.docName === docName;
}
