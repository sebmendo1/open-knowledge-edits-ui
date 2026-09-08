const KEPT_PREFIX = 'ok-document-review-kept:';

function storageKey(docName: string): string {
  return `${KEPT_PREFIX}${docName}`;
}

export function isDocumentReviewKept(docName: string): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(storageKey(docName)) === '1';
}

export function markDocumentReviewKept(docName: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(storageKey(docName), '1');
}

export function clearDocumentReviewKept(docName: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(storageKey(docName));
}
