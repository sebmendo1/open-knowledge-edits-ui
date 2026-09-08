import { useState } from 'react';
import { BetaBadge } from '@/components/BetaBadge';
import { HelpPopover } from '@/components/HelpPopover';
import { InstanceBadge } from '@/components/InstanceBadge';
import { PublishToGitHubDialog } from '@/components/PublishToGitHubDialog';
import { SettingsButton } from '@/components/SettingsButton';
import { ShareButton } from '@/components/ShareButton';
import { SyncStatusBadge } from '@/components/SyncStatusBadge';
import { Separator } from '@/components/ui/separator';
import { useSidebar } from '@/components/ui/sidebar';
import { authPromptStore } from '@/lib/auth-prompt-store';
import { isNoteWindow } from '@/lib/note-window-mode';
import { useSingleFileMode } from '@/lib/single-file-mode';
import { useWorkspaceShareInput } from '@/lib/use-workspace-share-input';
import { cn } from '@/lib/utils';
import { PresenceBar } from '@/presence/PresenceBar';

interface WorkspaceChromeActionsProps {
  layout?: 'header' | 'sidebar';
  onSignIn?: () => void;
  onSetIdentity?: () => void;
}

export function WorkspaceChromeActions({
  layout = 'header',
  onSignIn,
  onSetIdentity,
}: WorkspaceChromeActionsProps) {
  const singleFile = useSingleFileMode();
  const noteWindow = isNoteWindow();
  const reducedChrome = singleFile || noteWindow;
  const shareInput = useWorkspaceShareInput();
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === 'collapsed';
  const [publishOpen, setPublishOpen] = useState(false);
  const isElectronHost = typeof window !== 'undefined' && window.okDesktop != null;
  const compact = layout === 'sidebar' && isCollapsed;
  const handleSignIn = onSignIn ?? (() => authPromptStore.request('auth'));
  const handleSetIdentity = onSetIdentity ?? (() => authPromptStore.request('identity'));

  return (
    <>
      <div
        data-testid="workspace-chrome-actions"
        data-workspace-chrome-layout={layout}
        className={cn(
          'flex items-center',
          layout === 'header' && 'gap-2',
          layout === 'sidebar' &&
            cn(
              'gap-0.5 border-t border-border px-2 py-2',
              isCollapsed ? 'flex-col' : 'flex-wrap',
              isElectronHost && '[&>*]:[-webkit-app-region:no-drag]',
            ),
        )}
      >
        {!reducedChrome ? (
          <ShareButton
            input={shareInput}
            compact={compact}
            onClickWhenNoRemote={() => setPublishOpen(true)}
          />
        ) : null}
        {!noteWindow ? (
          <SyncStatusBadge onSignIn={handleSignIn} onSetIdentity={handleSetIdentity} />
        ) : null}
        <PresenceBar />
        {layout === 'header' ? (
          <>
            <Separator orientation="vertical" className="h-4 shrink-0 data-vertical:self-center" />
            <InstanceBadge />
            <BetaBadge />
          </>
        ) : (
          <>
            {!isCollapsed ? <InstanceBadge className="max-w-full" /> : null}
            {!isCollapsed ? <BetaBadge /> : null}
          </>
        )}
        {!reducedChrome ? <SettingsButton /> : null}
        {!noteWindow ? <HelpPopover /> : null}
      </div>
      {!reducedChrome ? (
        <PublishToGitHubDialog open={publishOpen} onOpenChange={setPublishOpen} />
      ) : null}
    </>
  );
}
