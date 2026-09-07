# Collaboration & the server: decisions before the code

Status: **decisions locked, nothing built.** Written 2026-09-04, when collaboration was
still a plan and nothing had been sold, which is the only moment the founder offer can be
rewritten with nobody affected.

**Revised 2026-09-07**, still before the first sale: the offer moved to a single
contribution of any amount with published thresholds (see `data/founders.ts`), and D1 and
D3 changed with it. Both revisions are marked below with what they replaced and why.

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

### The cap — decided, then tightened (revised 2026-09-07)

**A permanent founder discount on hosted collaboration. Not a free year, and not free
forever.**

*This replaces the original decision, which was twelve free months from launch followed by a
discount.* The free year was already sized against a fixed cohort — "1,000 people, every
month, indefinitely" was the number that made it survivable. Removing the cap removed that
arithmetic: with an uncapped cohort a free year is an unbounded recurring cost funded by
one-off payments of an amount the payer chooses, which is not a promise that can be kept.
A discount scales; twelve free months does not.

The reasoning that produced the original cap is what forced this one, so it is worth keeping
verbatim: a promise that has to be withdrawn later costs more than the one it replaced ever
earned, and it is withdrawn from exactly the people who paid earliest. Applying that rule to
its own conclusion is the whole point of writing it down.

**The test every benefit now has to pass:** it must cost the same whether fifty people join
or five thousand. A per-user monthly bill fails it. A discount, a credit line, a build, a
channel invite all pass. `data/founders.ts` states this rule beside the benefit list, because
it is the thing that quietly breaks when somebody adds a generous-sounding line.

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

## D3 — Source access IS the benefit (reversed 2026-09-07)

**Founding members get the collaboration server's source once it exists.**

*This reverses the original D3, which considered source access and dropped it in favour of
D1.* The objection then was that it says nothing (the client is already AGPL) or, if it means
the server, that source shared with a thousand people is not confidential in any practical
sense.

The first half of that was always answered by D2: it does mean the *server's* source, which is
a separate program and not public. The second half is still true, and is now more true, because
there is no cap on the cohort at all. So the benefit is stated as **access, not exclusivity** —
you get to read it, audit it and run it yourself rather than take our word for what the server
does with your drawings. That is worth paying for. "Nobody else will have it" would not be, and
is not claimed.

What the reversal costs, all of which is recorded in `data/founders.ts`:

- **It needs an access list.** Every other benefit costs the same whether fifty or five
  thousand people join and needs nobody tracked. A private repo needs each member identified,
  invited, and kept invited — per-member state this project otherwise does not have, which is
  why the payment page has to collect a contact handle.
- **It is irrevocable.** Source handed over cannot be recalled. Every founding member keeps it
  whatever happens to the programme afterwards.
- **The grant needs terms**, decided before the first invite goes out. Read it, run it, modify
  it, redistribute it? Left unstated, ambiguity favours the recipient.
- **It depends entirely on D2 holding.** If the server ever links AGPL client code it becomes a
  derivative work and §13 pushes its source to everyone who connects — at which point this
  benefit has deleted itself. D2 was a licence rule with a modest consequence; it is now the
  thing this benefit rests on.

## Already published (2026-09-04)

The offer was updated ahead of the code, so that nobody buys a founding place under wording
the service will later contradict. Everything below states plainly that collaboration **does
not exist yet**:

- `data/founders.ts` → the founding-member tier carries the hosted-collaboration discount and
  the source-access line, each with the note explaining what it costs to honour.
- `prerender/render.ts` → `/founders/` has an *About the collaboration server* section: every
  feature in the app is free for everyone and self-hostable, the hosting is what costs money,
  founding members get a permanent discount on it and the server's source.
- `help-docs/features/workspace.md` → the Support section says the same, as a second
  `:::note` beside the existing "not a paid tier" one.
- `i18n/locales/*.ts` → `support.foundersNote` in all five locales summarises the benefits.

*(Revised 2026-09-07 along with D1 and D3: the "free for a year" line became a permanent
discount, and source access was added. Nothing had been sold under either wording.)*

`support.freeForever` ("nothing in YappyDraw is behind a payment, and nothing ever will be")
was deliberately **left unchanged in all five locales**. Under D1 it is still true: it is a
statement about the app, every feature of which stays free, and hosting is not a feature.
That is the whole reason D1 draws the line where it does — if that sentence had needed
rewriting, the plan would have been wrong.

## What still has to happen when collaboration ships

- The founder discount is permanent, so entitlement has to outlive any one billing system —
  it is a property of the member, not a promotion with an end date. There is no free year to
  time any more, which removes the launch date from the critical path entirely.
- Source access needs the access list to exist BEFORE the first invite: who is a founding
  member, and the contact handle to invite. The Razorpay CSV export is the only record, so
  it has to be pulled and kept somewhere deliberate rather than left in the dashboard.
- The terms of the source grant have to be written down and agreed before that first invite.
- Founder entitlement is checked **on the server**, never in the client. A client-side check
  would be both pointless (any fork deletes it in a minute) and a direct contradiction of
  "every feature in the app is free".
- `refund-policy` and the founder offer: a place bought under earlier wording was bought under
  the earlier offer. Nothing was sold before the 2026-09-07 revision — recorded as none — so
  every founding member to date joined under the wording now published.
