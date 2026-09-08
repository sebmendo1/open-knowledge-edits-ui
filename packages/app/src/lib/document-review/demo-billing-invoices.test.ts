import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripFrontmatter } from '@inkeep/open-knowledge-core';
import { describe, expect, test } from 'vitest';
import { BILLING_INVOICES_AFTER_BODY } from './demo-billing-invoices';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../../..');
const billingArticlePath = join(repoRoot, 'demo-kb/articles/billing-invoices.md');

describe('billingInvoicesDemoAfterBody', () => {
  test('matches the checked-in demo article body after frontmatter', () => {
    const raw = readFileSync(billingArticlePath, 'utf8');
    const { body } = stripFrontmatter(raw);
    expect(body).toBe(BILLING_INVOICES_AFTER_BODY);
  });
});
