import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { DocumentReviewChange, DocumentReviewView } from '@/lib/document-review/types';
import { renderLinguiTemplate } from '@/test-utils/lingui-mock';

type WindowGlobals = { NodeFilter?: typeof NodeFilter };
type GlobalWithDomShims = typeof globalThis &
  WindowGlobals & { window?: WindowGlobals; ResizeObserver?: unknown };
const g = globalThis as GlobalWithDomShims;
if (g.NodeFilter === undefined && g.window?.NodeFilter !== undefined) {
  g.NodeFilter = g.window.NodeFilter;
}
if (g.ResizeObserver === undefined) {
  class NoopResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  g.ResizeObserver = NoopResizeObserver;
}

import * as actualLinguiMacro from '@lingui/react/macro';

vi.doMock('@lingui/core/macro', () => ({
  ...actualLinguiMacro,
  t: renderLinguiTemplate,
  msg: renderLinguiTemplate,
}));
vi.doMock('@lingui/react/macro', () => ({
  ...actualLinguiMacro,
  Trans: ({ children }: { children: ReactNode }) => children,
  useLingui: () => ({ t: renderLinguiTemplate }),
}));

const { DocumentReviewBar } = await import('./DocumentReviewBar');

const sampleChanges: DocumentReviewChange[] = [
  {
    id: 'pricing-table',
    time: '10:42',
    section: 'Pricing tiers',
    summary: 'Replaced the pricing table — 4 tiers → 3',
    kind: 'replace',
    additions: 4,
    deletions: 5,
    anchorIndex: 0,
  },
  {
    id: 'customers-add',
    time: '10:47',
    section: 'Customers',
    summary: 'Added two paragraphs',
    kind: 'add',
    additions: 2,
    deletions: 0,
    anchorIndex: 1,
  },
  {
    id: 'pricing-intro',
    time: '10:51',
    section: 'Pricing intro',
    summary: 'Rewrote the pricing introduction',
    kind: 'replace',
    additions: 1,
    deletions: 1,
    anchorIndex: 2,
  },
  {
    id: 'open-questions',
    time: '10:58',
    section: 'Open questions',
    summary: 'Edited open questions',
    kind: 'add',
    additions: 1,
    deletions: 0,
    anchorIndex: 3,
  },
];

function buildView(overrides: Partial<DocumentReviewView> = {}): DocumentReviewView {
  return {
    source: { kind: 'demo', docName: 'articles/billing-invoices' },
    agentDisplayName: 'Claude',
    agentColor: '#d97706',
    timeRangeLabel: '10:42–10:58',
    changes: sampleChanges,
    selectedChangeId: 'pricing-table',
    renderMode: 'rendered',
    marksHidden: false,
    ...overrides,
  };
}

function renderBar(
  props: Partial<Parameters<typeof DocumentReviewBar>[0]> = {},
  viewOverrides: Partial<DocumentReviewView> = {},
) {
  const view = buildView(viewOverrides);
  const onSelectChange = vi.fn();
  render(
    <TooltipProvider>
      <DocumentReviewBar
        view={view}
        docTitle="Billing Invoices"
        totalAdditions={8}
        totalDeletions={6}
        changeIndex={0}
        changeCount={sampleChanges.length}
        changes={sampleChanges}
        selectedChangeId={view.selectedChangeId}
        isPanelCollapsed={false}
        onClose={() => {}}
        onPrev={() => {}}
        onNext={() => {}}
        onSelectChange={onSelectChange}
        onRenderMode={() => {}}
        onTogglePanel={() => {}}
        onToggleMarksHidden={() => {}}
        onKeep={() => {}}
        {...props}
      />
    </TooltipProvider>,
  );
  return { onSelectChange };
}

afterEach(() => {
  cleanup();
});

describe('DocumentReviewBar — change history popover', () => {
  test('shows +/- and position in the changes trigger while marks are visible', () => {
    renderBar();
    const trigger = screen.getByTestId('document-review-changes-trigger');
    expect(trigger.textContent).toContain('+8');
    expect(trigger.textContent).toContain('−6');
    expect(trigger.textContent).toContain('1 of 4');
  });

  test('opens the change index popover from the trigger', async () => {
    renderBar();
    await userEvent.click(screen.getByTestId('document-review-changes-trigger'));
    expect(screen.getByTestId('document-review-change-popover')).toBeTruthy();
    expect(screen.getByTestId('change-index-panel')).toBeTruthy();
    expect(screen.getAllByTestId(/^change-index-row-/)).toHaveLength(4);
  });

  test('selecting a row calls onSelectChange and closes the popover', async () => {
    const { onSelectChange } = renderBar();
    await userEvent.click(screen.getByTestId('document-review-changes-trigger'));
    await userEvent.click(screen.getByTestId('change-index-row-customers-add'));
    expect(onSelectChange).toHaveBeenCalledWith('customers-add');
    expect(screen.queryByTestId('document-review-change-popover')).toBeNull();
  });

  test('shows a compact changes trigger when marks are hidden', () => {
    renderBar({}, { marksHidden: true });
    const trigger = screen.getByTestId('document-review-changes-trigger');
    expect(trigger.textContent?.toLowerCase()).toContain('4 changes');
    expect(trigger.textContent).not.toContain('+8');
  });
});
