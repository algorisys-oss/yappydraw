/**
 * The contribution programme: what `/founders/` offers and what it costs.
 *
 * WHY THIS IS A HAND-EDITED FILE. There is no server in the shipped build, so anything
 * durable and shared has to live in the source and ship with a deploy. That ruled out a
 * live count of memberships taken — and it turned out not to matter, because a
 * hand-updated count is a scarcity claim a reader cannot verify and we could not trust
 * between updates. It was never once shown.
 *
 * WHY THERE ARE NO DATES EITHER. The obvious replacement was seasons: a window that
 * opens and closes on published dates, scarcity anyone can check against a calendar.
 * It does not survive contact with a prerendered site. This page is built to static
 * HTML, so a date comparison would be evaluated at BUILD time and frozen — a window
 * would appear to close only on the next deploy — and a hand-set status flag has the
 * same problem wearing a different hat. That is the count's failure mode again, moved
 * from a number to a date: a deadline we cannot enforce is exactly the unverifiable
 * claim this file exists to avoid.
 *
 * SO: ONE PAGE, ANY AMOUNT, PUBLISHED THRESHOLDS. A payer chooses what to give above a
 * floor, and two thresholds say what a given amount reaches. Nothing here goes stale
 * between deploys, nothing claims urgency it cannot back, and there is no cohort to
 * track. A threshold is a promise about what WE do, which is the only kind of promise
 * a static site can keep.
 *
 * TO CHANGE WHAT IS OFFERED: edit the thresholds or the benefit lists below, commit,
 * ship. Nothing else changes. Note that a threshold RISE is retroactive in the one
 * direction that matters — people who already paid keep what they were promised, and
 * this file has no way to know who they are, so the supporters list is the record.
 *
 * WHAT IS BEING SOLD. Not a feature tier. YappyDraw is AGPL-3.0 and every feature is
 * free for everyone, which is a promise the About and Support dialogs make in five
 * languages (`support.freeForever`). A fork can take the code and pay nobody, and that
 * is fine and by design. What a contribution buys is the things a fork cannot copy:
 * recognition, access, influence, and the work continuing.
 */

/**
 * One published threshold: give at least this much and you get these things.
 *
 * THE RULE THAT KEEPS THIS FREE TO RUN: benefits are set by the AMOUNT, never by when
 * somebody paid. There is no account system and no server; the supporters list is a
 * hand-edited file. The moment one cohort is owed something another is not, every
 * member needs per-person state that nothing here can store. A threshold needs only a
 * comparison anyone can do in their head.
 */
export interface Tier {
    /** Shown to the reader, e.g. "Founding member". */
    name: string;
    /** The threshold, in whole rupees. This is the real one: the only figure a payment is judged against. */
    minInr: number;
    /**
     * The same threshold in whole dollars, APPROXIMATE and for orientation only.
     *
     * There is one price and it is in rupees. International cards are enabled, but the
     * charge is still INR — the payer's bank converts at its own rate and adds its own FX
     * fee, so what leaves their account is near this number and never exactly it. Every
     * surface therefore quotes it as "about $29", not "$29", and the copy says the payment
     * is taken in rupees. Quoting a dollar price we do not charge is the same class of
     * mistake as a deadline we cannot enforce (see the header): a number we publish and
     * cannot keep true.
     */
    minUsd: number;
    /** What this tier adds ON TOP of every tier below it. Rendered cumulatively. */
    benefits: string[];
}

export interface ContributionData {
    /**
     * The floor, below which the payment page does not accept a contribution.
     *
     * Not a tier and it buys nothing but our thanks. It exists because a payment
     * processor charges a fixed fee per transaction, so a contribution small enough is
     * mostly a donation to Razorpay, which serves nobody.
     */
    minInr: number;
    minUsd: number;
    /** The published thresholds, in ascending order. Render order depends on it. */
    tiers: Tier[];
}

export const CONTRIBUTION: ContributionData = {
    minInr: 100,
    minUsd: 2,
    tiers: [
        {
            name: 'Supporter',
            minInr: 1000,
            minUsd: 10,
            benefits: [
                'An honourable mention in the app’s supporters list, permanently',
            ],
        },
        {
            name: 'Founding member',
            minInr: 2499,
            minUsd: 29,
            benefits: [
                'A dedicated founders page thanking you, permanently',
                'Source access to the collaboration server when it is built',
                'Desktop builds for macOS, Windows and Linux, ready to install',
                'The founders-only channel — WhatsApp or Telegram now, Discord or Slack as it grows',
                'Free or discounted places at our paid webinars and workshops',
                'A permanent founder discount on hosted collaboration when it launches',
            ],
        },
    ],
};

/**
 * Every benefit at or below a tier, in order, so the page can print one cumulative list.
 *
 * Tiers are written as what they ADD, because that is how they are decided and how they
 * stay consistent when one changes. Readers want the opposite — the whole of what they
 * get for their money — so the flattening happens here rather than in the copy.
 */
export const benefitsUpTo = (index: number, d: ContributionData = CONTRIBUTION): string[] =>
    d.tiers.slice(0, index + 1).flatMap((t) => t.benefits);

/**
 * NOTE ON THE DESKTOP BUILDS. The CLIENT stays free: the web app is AGPL and the Support
 * dialog promises in five languages that "nothing in YappyDraw is behind a payment, and
 * nothing ever will be" (`support.freeForever`). That promise is about the app, and it
 * still holds.
 *
 * What founding members get is the packaged desktop build, already made. The Tauri source
 * is in the same public repository, so anyone can build it themselves and pay nobody —
 * which is exactly why extending the ready-made builds to founders takes nothing away from
 * anyone else. Keep the copy on that footing; "free desktop app for founders" alone would
 * imply the desktop app is otherwise paid, and it is not.
 */

/**
 * NOTE ON SOURCE ACCESS. This is the one benefit that is not free to run, and the only one
 * that cannot be taken back. Four consequences worth keeping in view:
 *
 *  - It needs an access list. Every other line here costs the same whether fifty people
 *    join or five thousand and needs nobody tracked; a private repo needs each member
 *    identified and invited, and kept invited. That is per-member state this project
 *    otherwise does not have, and it is why the payment page must collect a contact.
 *  - It is irrevocable. Source already handed over cannot be recalled. Every founding
 *    member keeps it whatever happens to the programme afterwards.
 *  - The grant needs terms. Read it, run it, modify it, redistribute it? Unstated,
 *    ambiguity favours the recipient. Decide it before the first invite goes out.
 *  - It only stays exclusive while the server is a SEPARATE PROGRAM. If the server ever
 *    links AGPL client code it becomes a derivative work, and §13 pushes its source to
 *    everyone who connects — at which point this benefit has quietly deleted itself. See
 *    docs/collaboration-plan.md D1/D3.
 */
