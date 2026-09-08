import { parseManagedArtifactName } from '@inkeep/open-knowledge-core';
import { useDocumentContext } from '@/editor/DocumentContext';
import {
  buildDocShareInput,
  buildFolderShareInput,
  type ShareTargetInput,
} from '@/lib/share/run-share-action';

export function useWorkspaceShareInput(): ShareTargetInput | null {
  const { activeDocName, activeTarget } = useDocumentContext();
  const managedArtifact = activeDocName ? parseManagedArtifactName(activeDocName) : null;
  if (activeTarget?.kind === 'folder') {
    return buildFolderShareInput(activeTarget.folderPath);
  }
  if (activeDocName && !managedArtifact) {
    return buildDocShareInput(activeDocName);
  }
  if (!activeTarget && !activeDocName) {
    return buildFolderShareInput('');
  }
  return null;
}
