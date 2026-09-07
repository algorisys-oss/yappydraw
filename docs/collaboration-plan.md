# Collaboration & the server: decisions before the code

Status: **decisions locked, nothing built.** Written 2026-09-04, when collaboration was
still a plan and no founding places had been sold (`FOUNDERS.claimed` was 0), which is the
only moment the founder offer can be rewritten with nobody affected.

This file exists because two of these decisions are cheap now and expensive later: the
licence boundary, and what a founding place promises.

## D1 — What the money buys: the service, not the software

**Free hosted collaboration is a founding-supporter benefit.** Founders collaborate on our
server at no cost. Everyone else either pays for hosting or self-hosts for free.

This has to be said precisely, because the app already makes a stronger-sounding promise in
five languages (`i18n/locales/*.ts` → `support.freeForever`): *"Nothing in YappyDraw is
behind a payment, and nothing ever will be"*, and `/founders/` says a founder is explicitly
**not** buying *"a tier … no feature behind a payment, now or later"*.

The line that keeps that true:

- **The collaboration client ships in the AGPL app, free, for everyone.** Anyone can point it
  at their own server and collaborate without paying anyone anything. No feature flag, no
  licence check, no "Pro" build. (A check would be pointless anyway — any fork can delete it
  in a minute and be entirely within its rights.)
- **What is paid for is compute we rent.** A hosted sync server costs money per active user
  per month, forever. Charging for that is not a paywalled feature; it is someone else's
  electricity bill.

If that distinction cannot be stated in one honest sentence on the founders page, the design
is wrong, not the sentence.

### The cap — decided

**Twelve months of free hosted collaboration from the day the service launches, then a
founder discount on continued access for as long as they want it.** Not free forever.

"Free hosted collaboration" against a ₹2,499 one-off would otherwise be an unbounded
recurring cost funded by a single payment — 1,000 people, every month, indefinitely. The
year is measured from **launch**, not from purchase, so someone who joins today does not
spend their free year waiting for the feature to exist.

The reasoning is worth keeping, because the smaller promise looks like the worse offer until
you ask what happens next: a promise that has to be withdrawn later costs more than the one
it replaced ever earned, and it is withdrawn from exactly the people who paid earliest.

**The page says all of this before the money changes hands**, including that the service does
not exist yet. A benefit a reader cannot use today must not be listed as though they can.

## D2 — The server is a separate program, in a private repo

The server is **not** part of this repository and imports **no code from `frontend/src`**.
It talks to the client over a network protocol and nothing else.

This is a licence constraint, not a preference. YappyDraw is AGPL-3.0. A server that reuses
client code — the document model, geometry, shared types, a CRDT lifted from the editor — is
a derivative work, so the AGPL applies to it, and **§13 then obliges us to offer its source
to every user who interacts with it over the network**. That would not merely leak the
server; it would delete "founders get access to it" as a benefit, since anyone using it
could demand the same.

The rule that keeps this safe is boring and easy to break by accident:

> **Nothing under `frontend/src/` is imported by the server. Not even types.**

Sharing "just the types" is how this goes wrong quietly, and the shared document model is
exactly what will be tempting. If the two must agree on a shape, define it in the protocol —
a schema the server owns and the client re-declares — rather than a module both import.

There is precedent for a private server: `.ossignore` already strips `backend/server` and
`backend/mcp` from the OSS mirror published by `scripts/publish-oss.sh`. A collaboration
server is a much larger temptation than an express stub, which is why the rule is written
down here.

## D3 — Source access is not the benefit

The client's source is already free to everyone under the AGPL, so "founders get access to
the source" says nothing unless it means the *server's* source — and source shared with
1,000 people is not confidential in any practical sense. It was considered and dropped in
favour of D1. Founders keep the benefits already listed in `data/founders.ts`
(`FOUNDER_BENEFITS`) — badge and credits, early access, a roadmap vote, the private community,
and a direct line to the people building it — with the hosted-collaboration line from D1 added
to them.

## Already published (2026-09-04)

The offer was updated ahead of the code, so that nobody buys a founding place under wording
the service will later contradict. Everything below states plainly that collaboration **does
not exist yet**:

- `data/founders.ts` → `FOUNDER_BENEFITS` carries the hosted-collaboration line with its cap.
- `prerender/render.ts` → `/founders/` has an *About the collaboration server* section: every
  feature in the app is free for everyone and self-hostable, the hosting is what costs money,
  founders get a year of it free and a discount after.
- `help-docs/features/workspace.md` → the Support section says the same, as a second
  `:::note` beside the existing "not a paid tier" one.
- `i18n/locales/*.ts` → `support.foundersNote` in all five locales summarises the new benefit.

`support.freeForever` ("nothing in YappyDraw is behind a payment, and nothing ever will be")
was deliberately **left unchanged in all five locales**. Under D1 it is still true: it is a
statement about the app, every feature of which stays free, and hosting is not a feature.
That is the whole reason D1 draws the line where it does — if that sentence had needed
rewriting, the plan would have been wrong.

## What still has to happen when collaboration ships

- The free year runs from launch, so the launch date has to be recorded somewhere the billing
  side can read, not just remembered.
- Founder entitlement is checked **on the server**, never in the client. A client-side check
  would be both pointless (any fork deletes it in a minute) and a direct contradiction of
  "every feature in the app is free".
- `refund-policy` and the founder offer: a place bought under earlier wording was bought under
  the earlier offer. Places sold before 2026-09-04 — recorded as none — predate this benefit.
