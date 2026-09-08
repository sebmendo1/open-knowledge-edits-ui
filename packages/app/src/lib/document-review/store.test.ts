import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { BILLING_INVOICES_DOC } from './demo-billing-invoices';
import { getDocumentReviewKeptBody } from './kept-state';
import {
  closeDocumentReview,
  documentReviewDocName,
  keepDocumentReviewChanges,
  openDocumentReviewDemo,
} from './store';

function memorySessionStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
    clear: () => {
      data.clear();
    },
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  };
}

describe('keepDocumentReviewChanges', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', memorySessionStorage());
  });

  afterEach(() => {
    closeDocumentReview();
    vi.unstubAllGlobals();
  });

  test('Keep closes review and does not reopen for the same live body', () => {
    const kept = '# Billing\n\nAccepted.\n';
    openDocumentReviewDemo(BILLING_INVOICES_DOC, '');
    expect(documentReviewDocName()).toBe(BILLING_INVOICES_DOC);

    keepDocumentReviewChanges(BILLING_INVOICES_DOC, kept);
    expect(documentReviewDocName()).toBeNull();
    expect(getDocumentReviewKeptBody(BILLING_INVOICES_DOC)).toBe(kept);

    openDocumentReviewDemo(BILLING_INVOICES_DOC, kept);
    expect(documentReviewDocName()).toBeNull();
  });

  test('new live edits after Keep open a fresh review against the kept baseline', () => {
    const kept = '# Billing\n\nAccepted.\n';
    keepDocumentReviewChanges(BILLING_INVOICES_DOC, kept);
    openDocumentReviewDemo(BILLING_INVOICES_DOC, `${kept}\n## New section\n`);
    expect(documentReviewDocName()).toBe(BILLING_INVOICES_DOC);
    expect(getDocumentReviewKeptBody(BILLING_INVOICES_DOC)).toBe(kept);
  });
});
