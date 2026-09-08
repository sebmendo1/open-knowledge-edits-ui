import { getSchema } from '@tiptap/core';
import { describe, expect, test } from 'vitest';
import { computeRenderedDiff } from '@/components/document-review/ReviewRenderedDiffView';
import {
  BILLING_DEMO_CHANGES,
  billingInvoicesDemoDiff,
} from '@/lib/document-review/demo-billing-invoices';
import { demoReviewBindings } from '@/lib/document-review/review-change-positions';
import { buildDiffDecorations } from '@/lib/rendered-diff/diff-decorations';
import { diffExtensions } from '@/lib/rendered-diff/diff-extensions';

const diffSchema = getSchema(diffExtensions);

describe('buildDiffDecorations billing demo', () => {
  test('builds a non-empty decoration set with four margin chips', () => {
    const { before, after } = billingInvoicesDemoDiff();
    const rendered = computeRenderedDiff(before, after);
    if (!rendered.ok) throw new Error(`expected ok, got ${rendered.reason}`);
    const { bindings, chipPositions } = demoReviewBindings(rendered.afterDoc, BILLING_DEMO_CHANGES);
    const deco = buildDiffDecorations(
      rendered.afterDoc,
      rendered.beforeDoc,
      rendered.changes,
      rendered.markChanges,
      diffSchema,
      { bindings, chipPositions, selectedChangeId: null },
    );
    const found = deco.find(0, rendered.afterDoc.content.size);
    expect(found.length).toBeGreaterThan(0);
    const chips = found.filter((d) => d.spec.key?.startsWith('chip-'));
    expect(chips.length).toBe(4);
  });
});
