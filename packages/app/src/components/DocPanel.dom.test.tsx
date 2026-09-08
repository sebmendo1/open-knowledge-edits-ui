import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
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

let singleFileValue = false;
vi.doMock('@/lib/single-file-mode', () => ({ useSingleFileMode: () => singleFileValue }));

let diagnosticsValue: Array<{ severity: string }> = [];
let activeProviderValue: unknown = null;
vi.doMock('@/editor/DocumentContext', () => ({
  useDocumentContext: () => ({ activeProvider: activeProviderValue, activeDocName: 'notes' }),
}));
vi.doMock('@/editor/lint-config-client', () => ({
  useDocLintConfig: () => ({ data: null }),
}));
vi.doMock('@/editor/useDocDiagnostics', () => ({
  useDocDiagnostics: () => diagnosticsValue,
}));
vi.doMock('@/editor/validation-audit-client', () => ({
  AUDIT_SUPERSEDED: 'audit-superseded',
  runValidationAudit: async () => null,
  useDocLinkFindings: () => ({ status: 'loaded', findings: [] }),
}));
let terminalLaunchValue: unknown = null;
vi.doMock('@/components/handoff/TerminalLaunchContext', () => ({
  useTerminalLaunch: () => terminalLaunchValue,
}));

vi.doMock('@/components/OutlinePanel', () => ({
  OutlinePanel: () => <div data-testid="outline-panel" />,
}));
vi.doMock('@/components/LinksPanel', () => ({
  LinksPanel: () => <div data-testid="links-panel" />,
}));
vi.doMock('@/components/TimelinePanel', () => ({
  TimelineContent: () => <div data-testid="timeline-panel" />,
}));
let lastProblemsProps: Record<string, unknown> | null = null;
vi.doMock('@/components/ProblemsPanel', () => ({
  ProblemsPanel: (props: Record<string, unknown>) => {
    lastProblemsProps = props;
    return <div data-testid="problems-panel" />;
  },
}));

let reviewActiveValue = false;
let reviewChangesValue: Array<{
  id: string;
  time: string;
  section: string;
  summary: string;
  kind: 'add';
  additions: number;
  deletions: number;
  anchorIndex: number;
}> = [];
vi.doMock('@/lib/document-review/store', () => ({
  useDocumentReviewActiveForDoc: () => reviewActiveValue,
  useDocumentReviewView: () =>
    reviewActiveValue
      ? {
          changes: reviewChangesValue,
          selectedChangeId: null,
        }
      : null,
  setDocumentReviewSelectedChange: () => {},
}));

const { DocPanel } = await import('./DocPanel');

type Tab = 'outline' | 'links' | 'graph' | 'timeline' | 'problems' | 'comments' | 'agents';

function renderPanel(activeTab: Tab, agentsSlot?: ReactNode) {
  return render(
    <TooltipProvider>
      <DocPanel
        docName="notes"
        isSourceMode={false}
        activeTab={activeTab}
        onActiveTabChange={() => {}}
        mode="doc"
        agentsSlot={agentsSlot}
      />
    </TooltipProvider>,
  );
}

async function openSwitcher() {
  await userEvent.click(screen.getByTestId('doc-panel-switcher'));
}

afterEach(() => {
  cleanup();
  singleFileValue = false;
  diagnosticsValue = [];
  activeProviderValue = null;
  terminalLaunchValue = null;
  lastProblemsProps = null;
  reviewActiveValue = false;
  reviewChangesValue = [];
});

describe('DocPanel — tab gating', () => {
  test('project mode lists all seven surfaces in the dropdown', async () => {
    singleFileValue = false;
    renderPanel('outline');
    await openSwitcher();
    expect(screen.getAllByRole('menuitem')).toHaveLength(7);
    expect(screen.getByTestId('outline-panel')).toBeTruthy();
  });

  test('single-file mode keeps Outline + Problems + Comments', async () => {
    singleFileValue = true;
    renderPanel('graph');
    await openSwitcher();
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    expect(screen.getByTestId('doc-panel-switcher-item-comments')).toBeTruthy();
    expect(screen.getByTestId('outline-panel')).toBeTruthy();
  });

  test('renders the Problems panel when its tab is active, against the active doc', () => {
    renderPanel('problems');
    expect(screen.getByTestId('problems-panel')).toBeTruthy();
    expect(lastProblemsProps?.docName).toBe('notes');
    expect(document.getElementById('panel-problems')).toBeTruthy();
  });

  test('renders the agents slot when the agents surface is active', () => {
    renderPanel('agents', <div data-testid="agents-slot" />);
    expect(screen.getByTestId('agents-slot')).toBeTruthy();
    expect(document.getElementById('panel-agents')).toBeTruthy();
  });
});

describe('DocPanel — Problems fix/ask-ai wiring', () => {
  const fakeProvider = { document: { getText: () => ({ toString: () => '' }) } };

  test('web host (no terminal launch context) withholds onAskAi but keeps the fix handlers', () => {
    activeProviderValue = fakeProvider;
    terminalLaunchValue = null;
    renderPanel('problems');
    expect(lastProblemsProps?.onAskAi).toBeUndefined();
    expect(typeof lastProblemsProps?.onFix).toBe('function');
    expect(typeof lastProblemsProps?.onAutoFix).toBe('function');
    expect(lastProblemsProps?.onFixWithAi).toBeUndefined();
  });

  test('desktop host (terminal launch available) passes onAskAi alongside the fix handlers', () => {
    activeProviderValue = fakeProvider;
    terminalLaunchValue = { launchInTerminal: () => {}, installedClis: {} };
    renderPanel('problems');
    expect(typeof lastProblemsProps?.onAskAi).toBe('function');
    expect(typeof lastProblemsProps?.onAutoFix).toBe('function');
    expect(typeof lastProblemsProps?.onFixWithAi).toBe('function');
  });

  test('without a matching provider every fix/ask handler is withheld', () => {
    activeProviderValue = null;
    terminalLaunchValue = { launchInTerminal: () => {}, installedClis: {} };
    renderPanel('problems');
    expect(lastProblemsProps?.onFix).toBeUndefined();
    expect(lastProblemsProps?.onAutoFix).toBeUndefined();
    expect(lastProblemsProps?.onAskAi).toBeUndefined();
    expect(typeof lastProblemsProps?.onFixWithAi).toBe('function');
  });
});

describe('DocPanel — Problems badge', () => {
  test('no badge when there are no diagnostics', async () => {
    diagnosticsValue = [];
    renderPanel('outline');
    await openSwitcher();
    expect(screen.queryByText('3')).toBeNull();
  });

  test('shows the diagnostic count on the Problems menu item', async () => {
    diagnosticsValue = [{ severity: 'warning' }, { severity: 'error' }, { severity: 'warning' }];
    renderPanel('outline');
    await openSwitcher();
    expect(screen.getByText('3')).toBeTruthy();
  });

  test('caps the badge at 99+', async () => {
    diagnosticsValue = Array.from({ length: 150 }, () => ({ severity: 'warning' }));
    renderPanel('outline');
    await openSwitcher();
    expect(screen.getByText('99+')).toBeTruthy();
  });
});

describe('DocPanel — document review tab routing', () => {
  test('outline tab shows the change index while review is active', () => {
    reviewActiveValue = true;
    reviewChangesValue = [
      {
        id: 'pricing-table',
        time: '10:42',
        section: 'Pricing tiers',
        summary: 'Replaced the pricing table — 4 tiers → 3',
        kind: 'add',
        additions: 4,
        deletions: 5,
        anchorIndex: 0,
      },
    ];
    renderPanel('outline');
    expect(screen.getByTestId('change-index-panel')).toBeTruthy();
    expect(screen.queryByTestId('outline-panel')).toBeNull();
    expect(screen.getByTestId('doc-panel-switcher').textContent?.toLowerCase()).toContain(
      'changes',
    );
  });

  test('non-outline tabs keep their original panels during review', () => {
    reviewActiveValue = true;
    reviewChangesValue = [
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
    ];
    renderPanel('timeline');
    expect(screen.getByTestId('timeline-panel')).toBeTruthy();
    expect(screen.queryByTestId('change-index-panel')).toBeNull();
  });
});
