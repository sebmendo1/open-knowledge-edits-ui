import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  clearDocumentReviewKept,
  getDocumentReviewKeptBody,
  isDocumentReviewKept,
  isDocumentReviewSettled,
  markDocumentReviewKept,
} from './kept-state';

const DOC = 'articles/billing-invoices';

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

describe('document-review kept-state', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', memorySessionStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('Keep snapshots the live body and treats an identical live body as settled', () => {
    const body = '# Billing\n\nKept page.\n';
    markDocumentReviewKept(DOC, body);
    expect(isDocumentReviewKept(DOC)).toBe(true);
    expect(getDocumentReviewKeptBody(DOC)).toBe(body);
    expect(isDocumentReviewSettled(DOC, body)).toBe(true);
    expect(isDocumentReviewSettled(DOC, `${body}\nnew paragraph\n`)).toBe(false);
  });

  test('does not reopen while the provider body has not arrived yet', () => {
    markDocumentReviewKept(DOC, '# Billing\n');
    expect(isDocumentReviewSettled(DOC, '')).toBe(true);
  });

  test('legacy boolean kept records adopt the current live body and stay settled', () => {
    sessionStorage.setItem(`ok-document-review-kept:${DOC}`, '1');
    const live = '# Billing\n\nCurrent page.\n';
    expect(isDocumentReviewKept(DOC)).toBe(true);
    expect(getDocumentReviewKeptBody(DOC)).toBeNull();
    expect(isDocumentReviewSettled(DOC, live)).toBe(true);
    expect(getDocumentReviewKeptBody(DOC)).toBe(live);
    expect(isDocumentReviewSettled(DOC, `${live}\nnew\n`)).toBe(false);
  });

  test('clearing kept allows a fresh review', () => {
    markDocumentReviewKept(DOC, '# Billing\n');
    clearDocumentReviewKept(DOC);
    expect(isDocumentReviewKept(DOC)).toBe(false);
    expect(isDocumentReviewSettled(DOC, '# Billing\n')).toBe(false);
  });
});
