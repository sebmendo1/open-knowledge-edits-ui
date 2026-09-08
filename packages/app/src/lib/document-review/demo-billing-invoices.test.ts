import { describe, expect, test } from 'vitest';
import { BILLING_INVOICES_AFTER_BODY, billingInvoicesDemoDiff } from './demo-billing-invoices';

describe('billingInvoicesDemoAfterBody', () => {
  test('exposes a canned after snapshot as the fallback when live source is empty', () => {
    expect(billingInvoicesDemoDiff().after).toBe(BILLING_INVOICES_AFTER_BODY);
    expect(billingInvoicesDemoDiff().before.length).toBeGreaterThan(0);
  });
});
