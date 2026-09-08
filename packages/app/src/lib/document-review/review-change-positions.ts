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

function paragraphPosContaining(afterDoc: PMNode, needle: string): number | null {
  let found: number | null = null;
  afterDoc.descendants((node, pos) => {
    if (found !== null) return false;
    if (node.type.name === 'paragraph' && node.textContent.includes(needle)) {
      found = pos;
      return false;
    }
    return true;
  });
  return found;
}

function firstTablePos(afterDoc: PMNode): number | null {
  let found: number | null = null;
  afterDoc.descendants((node, pos) => {
    if (found !== null) return false;
    if (node.type.name === 'table') {
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

function anchorPosForChange(afterDoc: PMNode, change: DocumentReviewChange): number | null {
  switch (change.id) {
    case 'pricing-intro':
      return paragraphPosContaining(afterDoc, 'There are three plans');
    case 'pricing-table':
      return firstTablePos(afterDoc);
    case 'customers-add':
      return headingPos(afterDoc, 'Customers');
    case 'open-questions':
      return headingPos(afterDoc, 'Open questions');
    default:
      return headingPos(afterDoc, change.section);
  }
}

export function demoReviewBindings(
  afterDoc: PMNode,
  changes: readonly DocumentReviewChange[],
): { bindings: ReviewChangeBinding[]; chipPositions: Map<string, number> } {
  const bindings: ReviewChangeBinding[] = [];
  const chipPositions = new Map<string, number>();

  for (const change of changes) {
    const pos = anchorPosForChange(afterDoc, change);
    if (pos === null) continue;
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
