// biome-ignore-all lint/plugin/no-physical-direction-utility: pre-rule backlog — physical margin/padding/inset utilities predate the rule; drain by swapping ml/mr → ms/me, pl/pr → ps/pe, left/right → start/end, then deleting this line. See https://github.com/inkeep/open-knowledge/blob/main/biome-plugins/README.md#no-physical-direction-utilitygrit

import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import {
  AlertTriangle,
  Bot,
  ChevronDown,
  Clock,
  Link2,
  ListTree,
  MessageSquare,
  Network,
} from 'lucide-react';
import { lazy, type ReactNode, Suspense, useEffect } from 'react';
import { CommentsTab } from '@/comments/CommentsTab';
import { setCommentsPanelOnScreen } from '@/comments/comments-panel-visibility';
import { ChangeIndexPanel } from '@/components/document-review/ChangeIndexPanel';
import {
  composeFixAllProblemsTerminalPaste,
  composeLintFixTerminalPaste,
} from '@/components/handoff/compose-lint-fix-prompt';
import { useTerminalLaunch } from '@/components/handoff/TerminalLaunchContext';
import { requestActiveTerminalInput } from '@/components/handoff/terminal-input-events';
import { LinksPanel } from '@/components/LinksPanel';
import { OutlinePanel } from '@/components/OutlinePanel';
import type { PanelScope } from '@/components/PanelScopeHeader';
import { type DiagnosticLike, ProblemsPanel } from '@/components/ProblemsPanel';
import { TimelineContent } from '@/components/TimelinePanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { applyLintFixes, collectFixes } from '@/editor/apply-lint-fix';
import { useDocumentContext } from '@/editor/DocumentContext';
import { useDocLintConfig } from '@/editor/lint-config-client';
import { useDocDiagnostics } from '@/editor/useDocDiagnostics';
import { useDocLinkFindings } from '@/editor/validation-audit-client';
import {
  setDocumentReviewSelectedChange,
  useDocumentReviewActiveForDoc,
  useDocumentReviewView,
} from '@/lib/document-review/store';
import { useSingleFileMode } from '@/lib/single-file-mode';
import { cn } from '@/lib/utils';
import { type DocProblemCounts, patchDocValidationSource } from '@/lib/validation-store';

export type PanelTab =
  | 'outline'
  | 'links'
  | 'graph'
  | 'timeline'
  | 'problems'
  | 'comments'
  | 'agents';

export const TABS: { id: PanelTab; icon: typeof ListTree }[] = [
  { id: 'outline', icon: ListTree },
  { id: 'links', icon: Link2 },
  { id: 'graph', icon: Network },
  { id: 'timeline', icon: Clock },
  { id: 'problems', icon: AlertTriangle },
  { id: 'comments', icon: MessageSquare },
  { id: 'agents', icon: Bot },
];

const SINGLE_FILE_TABS: readonly PanelTab[] = ['outline', 'problems', 'comments'];

function countsOf(diagnostics: readonly { severity: string }[]): DocProblemCounts {
  let errorCount = 0;
  let warningCount = 0;
  for (const diagnostic of diagnostics) {
    if (diagnostic.severity === 'error') errorCount += 1;
    else warningCount += 1;
  }
  return { errorCount, warningCount };
}

function tabLabel(id: PanelTab, reviewActive: boolean): string {
  if (id === 'outline') return reviewActive ? t`Changes` : t`Outline`;
  if (id === 'links') return t`Links`;
  if (id === 'graph') return t`Graph`;
  if (id === 'problems') return t`Problems`;
  if (id === 'comments') return t`Comments`;
  if (id === 'agents') return t`Agents`;
  return t`Timeline`;
}

type DocPanelMode = 'doc' | 'agent';

function loadGraphPanelModule() {
  return import('@/components/GraphPanel');
}

const LazyGraphPanel = lazy(async () => {
  const mod = await loadGraphPanelModule();
  return { default: mod.GraphPanel };
});

const LazyActivityModeContent = lazy(async () => {
  const mod = await import('@/components/ActivityModeContent');
  return { default: mod.ActivityModeContent };
});

interface DocPanelProps {
  docName: string;
  isSourceMode: boolean;
  activeTab: PanelTab;
  onActiveTabChange: (tab: PanelTab) => void;
  mode: DocPanelMode;
  isCollapsed?: boolean;
  agentsSlot?: ReactNode;
}

export function DocPanel({
  docName,
  isSourceMode,
  activeTab,
  onActiveTabChange,
  mode,
  isCollapsed = false,
  agentsSlot,
}: DocPanelProps) {
  const { activeProvider, activeDocName } = useDocumentContext();
  const { data: lintConfig } = useDocLintConfig(docName);
  const lintProvider = activeDocName === docName ? activeProvider : null;
  const lintDiagnostics = useDocDiagnostics(lintProvider, lintConfig?.effective ?? null);
  const linkFindingsState = useDocLinkFindings(docName);
  const linkFindings = linkFindingsState.findings;
  const diagnostics = [...lintDiagnostics, ...linkFindings];
  useEffect(() => {
    if (lintProvider === null) return;
    patchDocValidationSource(docName, 'lint', countsOf(lintDiagnostics));
  }, [docName, lintProvider, lintDiagnostics]);
  useEffect(() => {
    if (lintProvider === null || linkFindingsState.status !== 'loaded') return;
    patchDocValidationSource(docName, 'links', countsOf(linkFindings));
  }, [docName, lintProvider, linkFindings, linkFindingsState.status]);
  const handleFix = (diagnostic: DiagnosticLike) => {
    if (lintProvider !== null && diagnostic.fixes && diagnostic.fixes.length > 0) {
      applyLintFixes(lintProvider, diagnostic.fixes, docName);
    }
  };
  const handleAutoFix = () => {
    if (lintProvider !== null) {
      applyLintFixes(lintProvider, collectFixes(lintDiagnostics), docName);
    }
  };
  const terminalLaunch = useTerminalLaunch();
  const handleAskAi = (diagnostic: DiagnosticLike) => {
    if (lintProvider === null) return;
    const source = lintProvider.document.getText('source').toString();
    const lineText = source.split('\n')[diagnostic.range.start.line];
    requestActiveTerminalInput(composeLintFixTerminalPaste(docName, diagnostic, lineText), {
      submit: true,
    });
  };
  const handleFixWithAi = (scope: PanelScope) => {
    requestActiveTerminalInput(
      composeFixAllProblemsTerminalPaste(scope === 'doc' ? docName : null),
      {
        submit: true,
      },
    );
  };
  const singleFile = useSingleFileMode();
  const reviewActive = useDocumentReviewActiveForDoc(docName);
  const reviewView = useDocumentReviewView();
  const tabs = singleFile ? TABS.filter((tab) => SINGLE_FILE_TABS.includes(tab.id)) : TABS;
  const effectiveTab: PanelTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : 'outline';
  const showSwitcher = mode === 'doc' && tabs.length > 1;
  const currentTab = tabs.find((tab) => tab.id === effectiveTab) ?? tabs[0];
  const CurrentIcon = currentTab?.icon ?? ListTree;
  const currentLabel = tabLabel(effectiveTab, reviewActive);
  const problemsBadge =
    diagnostics.length > 0 ? (diagnostics.length > 99 ? '99+' : String(diagnostics.length)) : null;
  useEffect(() => {
    setCommentsPanelOnScreen(!isCollapsed && mode === 'doc' && effectiveTab === 'comments');
    return () => setCommentsPanelOnScreen(false);
  }, [isCollapsed, mode, effectiveTab]);
  return (
    <>
      {}
      {showSwitcher ? (
        <div className="border-b border-border/60 p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                data-testid="doc-panel-switcher"
                className="h-9 w-full justify-between gap-2 px-2 font-normal"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <CurrentIcon className="size-4 shrink-0" />
                  <span className="truncate">{currentLabel}</span>
                  {effectiveTab === 'problems' && problemsBadge != null ? (
                    <Badge
                      variant="notification"
                      aria-hidden="true"
                      className="h-4 min-w-4 shrink-0 rounded-full px-1 font-sans text-[10px] leading-none tabular-nums"
                    >
                      {problemsBadge}
                    </Badge>
                  ) : null}
                </span>
                <ChevronDown className="size-4 shrink-0 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
              {tabs.map(({ id, icon: Icon }) => {
                const label = tabLabel(id, reviewActive);
                const showBadge = id === 'problems' && diagnostics.length > 0;
                return (
                  <DropdownMenuItem
                    key={id}
                    data-testid={`doc-panel-switcher-item-${id}`}
                    className={cn(effectiveTab === id && 'bg-accent')}
                    onSelect={() => onActiveTabChange(id)}
                  >
                    <Icon />
                    <span className="flex-1">{label}</span>
                    {showBadge ? (
                      <Badge
                        variant="notification"
                        aria-hidden="true"
                        className="h-4 min-w-4 rounded-full px-1 font-sans text-[10px] leading-none tabular-nums"
                      >
                        {diagnostics.length > 99 ? '99+' : diagnostics.length}
                      </Badge>
                    ) : null}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}

      {mode === 'doc' ? (
        <div
          id={`panel-${effectiveTab}`}
          className={cn(
            'min-h-0 flex-1',
            effectiveTab === 'agents'
              ? 'flex flex-col overflow-hidden'
              : 'overflow-auto subtle-scrollbar',
          )}
        >
          {effectiveTab === 'outline' &&
            (reviewActive && reviewView ? (
              <ChangeIndexPanel
                changes={reviewView.changes}
                selectedChangeId={reviewView.selectedChangeId}
                onSelect={setDocumentReviewSelectedChange}
              />
            ) : (
              <OutlinePanel docName={docName} isSourceMode={isSourceMode} />
            ))}
          {effectiveTab === 'links' && <LinksPanel docName={docName} />}
          {effectiveTab === 'graph' && (
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  <Trans>Loading graph</Trans>
                </div>
              }
            >
              <LazyGraphPanel activeDocName={docName} />
            </Suspense>
          )}
          {effectiveTab === 'timeline' && <TimelineContent docName={docName} />}
          {effectiveTab === 'comments' && <CommentsTab docName={docName} />}
          {effectiveTab === 'problems' && (
            <ProblemsPanel
              docName={docName}
              diagnostics={diagnostics}
              linkFindingsStatus={linkFindingsState.status}
              onFix={lintProvider !== null ? handleFix : undefined}
              onAutoFix={lintProvider !== null ? handleAutoFix : undefined}
              onAskAi={lintProvider !== null && terminalLaunch !== null ? handleAskAi : undefined}
              onFixWithAi={terminalLaunch !== null ? handleFixWithAi : undefined}
            />
          )}
          {effectiveTab === 'agents' && agentsSlot}
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <Suspense
            fallback={
              <div
                role="status"
                aria-busy="true"
                className="flex h-full items-center justify-center text-sm text-muted-foreground"
              >
                <Trans>Loading agent activity</Trans>
              </div>
            }
          >
            <LazyActivityModeContent />
          </Suspense>
        </div>
      )}
    </>
  );
}
