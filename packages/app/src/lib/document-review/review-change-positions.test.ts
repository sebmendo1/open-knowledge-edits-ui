import { describe, expect, test } from 'vitest';
import { computeRenderedDiff } from '@/components/document-review/ReviewRenderedDiffView';
import { BILLING_DEMO_CHANGES, billingInvoicesDemoDiff } from './demo-billing-invoices';
import {
  demoReviewBindings,
  isTableFamilyType,
  nodeTypeAtPos,
  spanReviewBindings,
} from './review-change-positions';

describe('demoReviewBindings', () => {
  test('assigns four distinct chip positions for the billing demo', () => {
    const { before, after } = billingInvoicesDemoDiff();
    const rendered = computeRenderedDiff(before, after);
    if (!rendered.ok) throw new Error(`expected ok, got ${rendered.reason}`);
    const { chipPositions } = demoReviewBindings(rendered.afterDoc, BILLING_DEMO_CHANGES);
    expect(chipPositions.size).toBe(4);
    const positions = [...chipPositions.values()];
    expect(new Set(positions).size).toBe(4);
    expect(chipPositions.get('pricing-intro')).not.toBe(chipPositions.get('pricing-table'));
  });

  test('spanReviewBindings maps each block change to a chip', () => {
    const { before, after } = billingInvoicesDemoDiff();
    const rendered = computeRenderedDiff(before, after);
    if (!rendered.ok) throw new Error(`expected ok, got ${rendered.reason}`);
    const { chipPositions, changes } = spanReviewBindings(rendered.afterDoc, rendered.changes);
    expect(changes.length).toBe(rendered.changes.length);
    expect(chipPositions.size).toBe(rendered.changes.length);
  });

  test('places no chip on a table-family node', () => {
    const { before, after } = billingInvoicesDemoDiff();
    const rendered = computeRenderedDiff(before, after);
    if (!rendered.ok) throw new Error(`expected ok, got ${rendered.reason}`);
    const { chipPositions } = demoReviewBindings(rendered.afterDoc, BILLING_DEMO_CHANGES);
    for (const pos of chipPositions.values()) {
      const typeName = nodeTypeAtPos(rendered.afterDoc, pos);
      expect(typeName).not.toBeNull();
      expect(isTableFamilyType(typeName as string)).toBe(false);
    }
  });
});
