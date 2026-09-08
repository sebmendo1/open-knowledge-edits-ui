const KEPT_PREFIX = 'ok-document-review-kept:';

function storageKey(docName: string): string {
  return `${KEPT_PREFIX}${docName}`;
}

function parseKeptBody(raw: string): string | null {
  if (raw === '1') return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    if (!('body' in parsed)) return null;
    return typeof parsed.body === 'string' ? parsed.body : null;
  } catch {
    return null;
  }
}

export function isDocumentReviewKept(docName: string): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(storageKey(docName)) !== null;
}

export function getDocumentReviewKeptBody(docName: string): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(storageKey(docName));
  if (raw === null) return null;
  return parseKeptBody(raw);
}

export function markDocumentReviewKept(docName: string, body: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(storageKey(docName), JSON.stringify({ body }));
}

export function isDocumentReviewSettled(docName: string, liveBody: string): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  const raw = sessionStorage.getItem(storageKey(docName));
  if (raw === null) return false;
  if (raw === '1') {
    if (liveBody.length > 0) markDocumentReviewKept(docName, liveBody);
    return true;
  }
  if (liveBody.length === 0) return true;
  const body = parseKeptBody(raw);
  return body !== null && body === liveBody;
}

export function clearDocumentReviewKept(docName: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(storageKey(docName));
}
