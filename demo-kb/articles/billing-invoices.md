---
title: Billing & Invoices
type: article
status: stable
tags: [article, billing, gtm]
---

# Billing & Invoices

For whoever owns the GTM plumbing. The whole page is one idea: we run two motions that look like one product, and most of the work comes from that mismatch.

## Pricing tiers

| Tier | Price | Seats | Status |
| --- | --- | --- | --- |
| Free | $0 | 1 | Proposed |
| Starter | $29/mo | 3 | Live |
| Pro | $99/mo | 25 | Live |
| Business | $299/mo | 100 | Proposed |
| Enterprise | Custom | Unlimited | Live |

**Free and Business are proposals, not decisions.** Their prices and seat counts are placeholders picked to fit the existing ladder — swap them for real numbers before anyone quotes this. Starter, Pro, and Enterprise are unchanged.

**Free** ($0, 1 seat) is a top-of-funnel entry with no billing relationship at all. One seat is the point: it's usable solo, and the second person is the upgrade.

**Starter** is priced to be an easy yes, not to make money. Three seats covers a founder and a couple of collaborators.

**Pro** is a big jump on purpose — better that teams upgrade once than creep through tiers. $99 stays under the line where procurement gets involved.

**Business** ($299, 100 seats) fills the gap this page already describes: teams that outgrow Pro's 25 seats but don't want a procurement cycle. Today that jump lands them straight in Enterprise, which is slower than they need. Worth flagging that $299 probably crosses the expense-it-yourself line, so Business may need a light approval path even though it isn't Enterprise.

**Enterprise** is custom because the price is an output of the contract, not an input. Unlimited seats follows: if a human is already on the call, seat-counting is friction for nothing.

Read the seat numbers as state transitions, not limits. Hitting 1 means find a collaborator. Hitting 3 means the team is real. Approaching 25 means Business. Approaching 100 means it's about to need a salesperson.

## The two motions

**Self-serve** pays by card at signup. Account, activation, and first revenue are one event, with no human in the loop.

**Enterprise** needs a PO before they'll pay an annual invoice, and asks for net-30 on the first contract. That's how their AP department works, not a concession we made. So: contract signed → invoice issued → PO matched → payment ~30 days later. Only the last step is cash.

Self-serve customers rarely need custom billing until they outgrow Pro — which is exactly when a card-on-file account starts needing an invoice, a PO number, and a person to talk to. If Business ships, that boundary moves: the question becomes whether Business is still card-on-file or the first invoiced tier.

## What that means for you

- **Invoice sent ≠ money in.** Pick invoice-date or cash-date per dashboard and label it. Mixing them won't reconcile.
- **Enterprise ARR is in the contract, not the billing system.** Bill off the billing system alone and enterprise looks smaller and later than it is.
- **"Paid" is a bad activation signal.** Self-serve pays before using anything; enterprise uses everything before paying.
- **Failed payment means opposite things.** Self-serve card failure is churn risk. Enterprise non-payment is usually a missing PO. Don't send both to the same dunning flow.

## Signals worth building

1. **Pro accounts nearing 25 seats** — the expansion trigger. Fire before the ceiling, not at it. With Business in place this becomes a self-serve upgrade prompt rather than a sales handoff.
2. **Business accounts nearing 100 seats** — this is the new sales handoff, and the point where the two motions actually change over.
3. **Anyone asking about invoicing, net-30, or POs** — that's the enterprise buying process announcing itself. Route to a human regardless of tier.
4. **Annual renewals, offset backward** — PO turnaround means the conversation starts weeks before the contract date.

## Gaps

Not yet confirmed, so don't assume defaults: which billing system and CRM are canonical, whether enterprise invoicing is automated, proration on upgrade, how annual contracts feed ARR, and whether a PO number field exists at all.

## Open questions

- Should annual plans include a dedicated success manager?
- Is reporting revenue invoice-date or cash-date?
- What seat count should the Pro expansion signal fire at?
- What are the real prices and seat counts for Free and Business?
- Does Business pay by card or by invoice? That decides which motion it belongs to.
- Does Free get a billing record at all, or only on upgrade?
- Does adding two tiers undercut the "upgrade once, don't creep" logic Pro was built on?
