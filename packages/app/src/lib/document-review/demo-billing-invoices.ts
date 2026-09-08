import type { DocumentReviewChange } from './types';

export const BILLING_INVOICES_DOC = 'articles/billing-invoices';

export const BILLING_DEMO_CHANGES: readonly DocumentReviewChange[] = [
  {
    id: 'pricing-table',
    time: '10:42',
    section: 'Pricing tiers',
    summary: 'Replaced the pricing table — 4 tiers → 3',
    kind: 'structural',
    additions: 4,
    deletions: 5,
    structuralCaption: '4 pricing tiers → 3',
    anchorIndex: 0,
  },
  {
    id: 'customers-add',
    time: '10:47',
    section: 'Customers',
    summary: 'Added two paragraphs',
    kind: 'add',
    additions: 2,
    deletions: 0,
    anchorIndex: 1,
  },
  {
    id: 'pricing-intro',
    time: '10:51',
    section: 'Pricing tiers',
    summary: 'Rewrote the opening you wrote at 9:15',
    kind: 'replace',
    additions: 1,
    deletions: 1,
    authorship: {
      userLabel: 'You',
      userTime: '9:15',
      agentLabel: 'Agent',
      agentTime: '10:51',
      message: 'The agent rewrote your pricing philosophy.',
    },
    anchorIndex: 2,
  },
  {
    id: 'open-questions',
    time: '10:58',
    section: 'Open questions',
    summary: 'Deleted two questions, added one',
    kind: 'replace',
    additions: 1,
    deletions: 2,
    anchorIndex: 3,
  },
];

const BEFORE_BODY = `# Billing & Invoices

How we charge customers, what they see on invoices, and where pricing still needs a decision.

## Pricing tiers

Our pricing philosophy is to keep tiers simple enough that a buyer can choose in one meeting, while still leaving room for expansion revenue as a team grows. We anchor on seat count for self-serve and on usage for enterprise, and we avoid hidden fees on invoices.

| Tier | Price | Seats |
| --- | --- | --- |
| Free | $0 | 1 |
| Starter | $29/mo | 3 |
| Pro | $99/mo | 25 |
| Enterprise | Custom | Unlimited |

## Open questions

- Should annual plans include a dedicated success manager?
- Do we need a mid-market tier between Pro and Enterprise?
- When should we show tax on the invoice preview?
`;

const AFTER_BODY = `# Billing & Invoices

How we charge customers, what they see on invoices, and where pricing still needs a decision.

## Pricing tiers

We offer three plans: Starter, Pro, and Enterprise.

| Tier | Price | Seats |
| --- | --- | --- |
| Starter | $29/mo | 3 |
| Pro | $99/mo | 25 |
| Enterprise | Custom | Unlimited |

## Customers

Enterprise buyers usually need a purchase order before they will pay an annual invoice. Most teams ask for net-30 terms on their first contract.

Self-serve customers almost always pay by card on signup. They rarely ask for custom billing unless they outgrow Pro.

## Open questions

- Should annual plans include a dedicated success manager?
`;

export function billingInvoicesDemoDiff(): { before: string; after: string } {
  return { before: BEFORE_BODY, after: AFTER_BODY };
}

export function isBillingInvoicesDemoDoc(docName: string): boolean {
  return docName === BILLING_INVOICES_DOC;
}
