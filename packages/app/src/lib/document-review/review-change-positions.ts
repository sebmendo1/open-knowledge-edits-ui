import type { Node as PMNode } from '@tiptap/pm/model';
import type { DocumentReviewChange } from '@/lib/document-review/types';
import type { ReviewChangeBinding, ReviewMarginChip } from '@/lib/rendered-diff/diff-decorations';

function headingPos(afterDoc: PMNode, text: string): number | null {
  let found: number | null = null;
  afterDoc.descendants((node, pos) => {
    if (found !== null) return false;
    if (node.type.name === 'heading' && node.textContent === text) {
      found = pos;
      return false;
    }
    return true;
  });
  return found;
}

function chipForKind(kind: DocumentReviewChange['kind']): ReviewMarginChip {
  if (kind === 'add') return '+';
  if (kind === 'remove') return '−';
  return '±';
}

export function demoReviewBindings(
  afterDoc: PMNode,
  changes: readonly DocumentReviewChange[],
): { bindings: ReviewChangeBinding[]; chipPositions: Map<string, number> } {
  const sectionPos = new Map<string, number>();
  for (const section of ['Pricing tiers', 'Customers', 'Open questions']) {
    const pos = headingPos(afterDoc, section);
    if (pos !== null) sectionPos.set(section, pos);
  }

  const bindings: ReviewChangeBinding[] = [];
  const chipPositions = new Map<string, number>();

  for (const change of changes) {
    const pos = sectionPos.get(change.section);
    if (pos === undefined) continue;
    bindings.push({ id: change.id, chip: chipForKind(change.kind) });
    chipPositions.set(change.id, pos);
  }

  return { bindings, chipPositions };
}

export function genericReviewBindings(
  anchorCount: number,
  changes: readonly DocumentReviewChange[],
): ReviewChangeBinding[] {
  if (changes.length === 0 || anchorCount === 0) return [];
  return changes.map((change) => ({
    id: change.id,
    chip: chipForKind(change.kind),
  }));
}
