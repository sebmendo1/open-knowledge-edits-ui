import { DOMSerializer, type Fragment, type Node as PMNode, type Schema } from '@tiptap/pm/model';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { MarkChange, SpanChange } from './build-rendered-diff';

export const RENDERED_DIFF_CHANGE_SELECTOR =
  '.ok-diff-ins, .ok-diff-ins-block, [data-diff-deleted], [data-review-change-id]';

export type ReviewMarginChip = '+' | '−' | '±';

export interface ReviewChangeBinding {
  id: string;
  chip: ReviewMarginChip;
}

function buildMarginChipWidget(
  chip: ReviewMarginChip,
  changeId: string,
  selected: boolean,
): HTMLElement {
  const el = document.createElement('span');
  el.className = [
    'ok-diff-margin-chip',
    chip === '+' ? 'ok-diff-margin-chip-add' : '',
    chip === '−' ? 'ok-diff-margin-chip-del' : '',
    chip === '±' ? 'ok-diff-margin-chip-replace' : '',
    selected ? 'ok-diff-margin-chip-selected' : '',
  ]
    .filter(Boolean)
    .join(' ');
  el.setAttribute('data-review-chip', chip);
  el.setAttribute('data-review-change-id', changeId);
  el.setAttribute('aria-hidden', 'true');
  el.textContent = chip;
  return el;
}

function reviewClass(
  base: string,
  changeId: string | undefined,
  selectedChangeId: string | null,
): string {
  const parts = [base];
  if (changeId !== undefined) parts.push('ok-diff-review-bound');
  if (changeId !== undefined && changeId === selectedChangeId) parts.push('ok-diff-selected');
  return parts.join(' ');
}

export function countRenderedDiffAnchors(diff: {
  changes: readonly SpanChange[];
  markChanges: readonly MarkChange[];
}): number {
  return diff.changes.length + 2 * diff.markChanges.length;
}

function fragmentHasBlock(frag: Fragment): boolean {
  let hasBlock = false;
  frag.forEach((child) => {
    if (child.isBlock) hasBlock = true;
  });
  return hasBlock;
}

function isAllListItems(frag: Fragment): boolean {
  if (frag.childCount === 0) return false;
  let all = true;
  frag.forEach((child) => {
    if (child.type.name !== 'listItem' && child.type.name !== 'taskItem') all = false;
  });
  return all;
}

function buildDeletedWidget(
  serializer: DOMSerializer,
  content: Fragment,
  isBlock: boolean,
): HTMLElement {
  const host = document.createElement(isBlock ? 'div' : 'span');
  host.className = isBlock ? 'ok-diff-del ok-diff-del-block' : 'ok-diff-del';
  host.setAttribute('data-diff-deleted', '');
  const rendered = serializer.serializeFragment(content);
  if (isBlock && isAllListItems(content)) {
    const ul = document.createElement('ul');
    ul.appendChild(rendered);
    host.appendChild(ul);
  } else {
    host.appendChild(rendered);
  }
  return host;
}

export interface ReviewDecorationOptions {
  bindings: readonly ReviewChangeBinding[];
  selectedChangeId: string | null;
  chipPositions: ReadonlyMap<string, number>;
}

export function buildDiffDecorations(
  afterDoc: PMNode,
  beforeDoc: PMNode,
  changes: readonly SpanChange[],
  markChanges: readonly MarkChange[],
  schema: Schema,
  review?: ReviewDecorationOptions,
): DecorationSet {
  const serializer = DOMSerializer.fromSchema(schema);
  const decorations: Decoration[] = [];
  const selectedChangeId = review?.selectedChangeId ?? null;

  for (const [changeId, pos] of review?.chipPositions ?? []) {
    const binding = review?.bindings.find((b) => b.id === changeId);
    if (binding === undefined) continue;
    decorations.push(
      Decoration.widget(
        pos,
        () => buildMarginChipWidget(binding.chip, changeId, changeId === selectedChangeId),
        { side: -1, ignoreSelection: true, marks: [], key: `chip-${changeId}` },
      ),
    );
  }

  for (const mark of markChanges) {
    const slice = beforeDoc.slice(mark.fromA, mark.toA);
    const isBlock = fragmentHasBlock(slice.content);
    const changeId = bindingIdForPos(review, mark.fromB);
    decorations.push(
      Decoration.widget(
        mark.fromB,
        () => {
          const host = buildDeletedWidget(serializer, slice.content, isBlock);
          if (changeId !== undefined) host.setAttribute('data-review-change-id', changeId);
          return host;
        },
        {
          side: -1,
          ignoreSelection: true,
          marks: [],
        },
      ),
    );
    decorations.push(
      Decoration.inline(
        mark.fromB,
        mark.toB,
        {
          class: reviewClass('ok-diff-ins', changeId, selectedChangeId),
          ...(changeId !== undefined ? { 'data-review-change-id': changeId } : {}),
        },
        { inclusiveEnd: true },
      ),
    );
  }

  for (const change of changes) {
    const changeId = bindingIdForPos(review, change.fromB);
    if (change.toB > change.fromB) {
      decorations.push(
        Decoration.node(change.fromB, change.toB, {
          class: reviewClass('ok-diff-ins-block', changeId, selectedChangeId),
          ...(changeId !== undefined ? { 'data-review-change-id': changeId } : {}),
        }),
      );
    }
    if (change.toA > change.fromA) {
      const slice = beforeDoc.slice(change.fromA, change.toA);
      const isBlock = fragmentHasBlock(slice.content);
      decorations.push(
        Decoration.widget(
          change.fromB,
          () => {
            const host = buildDeletedWidget(serializer, slice.content, isBlock);
            if (changeId !== undefined) host.setAttribute('data-review-change-id', changeId);
            return host;
          },
          { side: -1, ignoreSelection: true, marks: [] },
        ),
      );
    }
  }

  return DecorationSet.create(afterDoc, decorations);
}

function bindingIdForPos(
  review: ReviewDecorationOptions | undefined,
  pos: number,
): string | undefined {
  if (review === undefined || review.chipPositions.size === 0) return undefined;
  let best: { id: string; pos: number } | undefined;
  for (const [id, chipPos] of review.chipPositions) {
    if (chipPos <= pos && (best === undefined || chipPos > best.pos)) best = { id, pos: chipPos };
  }
  return best?.id;
}
