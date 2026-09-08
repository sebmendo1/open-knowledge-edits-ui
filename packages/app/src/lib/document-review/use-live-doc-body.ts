import type { HocuspocusProvider } from '@hocuspocus/provider';
import { stripFrontmatter } from '@inkeep/open-knowledge-core';
import { useEffect, useState } from 'react';

const LIVE_BODY_DEBOUNCE_MS = 150;

export function readSourceBody(provider: HocuspocusProvider | null | undefined): string {
  if (!provider) return '';
  return stripFrontmatter(provider.document.getText('source').toString()).body;
}

export function useLiveDocBody(
  provider: HocuspocusProvider | null,
  docName: string | null,
): string {
  const [body, setBody] = useState('');

  useEffect(() => {
    if (!provider || !docName) {
      setBody('');
      return;
    }

    const ytext = provider.document.getText('source');
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    function read(): void {
      if (cancelled) return;
      setBody(readSourceBody(provider));
    }

    read();
    function handler(): void {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(read, LIVE_BODY_DEBOUNCE_MS);
    }
    ytext.observe(handler);
    return () => {
      cancelled = true;
      ytext.unobserve(handler);
      if (timeout) clearTimeout(timeout);
    };
  }, [provider, docName]);

  return body;
}
