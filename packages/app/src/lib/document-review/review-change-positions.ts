import type { Node as PMNode } from '@tiptap/pm/model';
import type { DocumentReviewChange } from '@/lib/document-review/types';
import type { SpanChange } from '@/lib/rendered-diff/block-diff';
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

function posAfterFirstTable(afterDoc: PMNode): number | null {
  let found: number | null = null;
  afterDoc.descendants((node, pos) => {
    if (found !== null) return false;
    if (node.type.name === 'table') {
      found = pos + node.nodeSize;
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
      return posAfterFirstTable(afterDoc);
    case 'customers-add':
      return headingPos(afterDoc, 'Customers');
    case 'open-questions':
      return headingPos(afterDoc, 'Open questions');
    default:
      return headingPos(afterDoc, change.section);
  }
}

export function isTableFamilyType(typeName: string): boolean {
  return typeName === 'table' || typeName.startsWith('table');
}

export function nodeTypeAtPos(doc: PMNode, pos: number): string | null {
  if (pos < 0 || pos > doc.content.size) return null;
  const node = doc.nodeAt(pos);
  if (node !== null) return node.type.name;
  return doc.resolve(pos).parent.type.name;
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

export function spanReviewBindings(
  afterDoc: PMNode,
  spanChanges: readonly SpanChange[],
): {
  bindings: ReviewChangeBinding[];
  chipPositions: Map<string, number>;
  changes: DocumentReviewChange[];
} {
  const bindings: ReviewChangeBinding[] = [];
  const chipPositions = new Map<string, number>();
  const changes: DocumentReviewChange[] = [];

  spanChanges.forEach((span, index) => {
    const inserted = span.toB > span.fromB;
    const deleted = span.toA > span.fromA;
    const kind: DocumentReviewChange['kind'] =
      inserted && !deleted ? 'add' : !inserted && deleted ? 'remove' : 'replace';
    const id = `span-${index}-${span.fromB}`;
    bindings.push({ id, chip: chipForKind(kind) });
    chipPositions.set(id, span.fromB);
    const section = nearestHeading(afterDoc, span.fromB);
    const slice = inserted ? afterDoc.textBetween(span.fromB, span.toB, ' ').trim() : '';
    changes.push({
      id,
      time: 'Live',
      section,
      summary:
        slice.length > 0
          ? slice.slice(0, 96)
          : kind === 'remove'
            ? 'Removed a block'
            : 'Updated a block',
      kind,
      additions: inserted ? 1 : 0,
      deletions: deleted ? 1 : 0,
      anchorIndex: index,
    });
  });

  return { bindings, chipPositions, changes };
}

function nearestHeading(afterDoc: PMNode, pos: number): string {
  let heading = 'Document';
  afterDoc.descendants((node, nodePos) => {
    if (nodePos > pos) return false;
    if (node.type.name === 'heading' && node.textContent.trim().length > 0) {
      heading = node.textContent;
    }
    return true;
  });
  return heading;
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
