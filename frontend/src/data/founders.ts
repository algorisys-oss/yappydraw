/**
 * The Founding Supporter programme: the numbers shown on `/founders/`.
 *
 * WHY THIS IS A HAND-EDITED FILE. The count of memberships taken is shared, durable,
 * changing state, and YappyDraw has no server to keep it in. The two honest ways to
 * show it were a webhook into a real backend, or a number a human updates from the
 * Razorpay dashboard. This is the second. It is stale between updates by definition,
 * so the page always prints `asOf` beside it and never implies live accuracy.
 *
 * The third option, a number that moves on its own without being tied to actual sales,
 * is not an option. A scarcity claim that is not true is a consumer-protection problem
 * and, on a launch day, the kind of thing that gets screenshotted.
 *
 * TO UPDATE: read the real count in the Razorpay dashboard, set `claimed` and `asOf`,
 * commit, ship. Nothing else has to change.
 *
 * WHAT IS BEING SOLD. Not a feature tier. YappyDraw is AGPL-3.0 and every feature is
 * free for everyone, which is a promise the About and Support dialogs make in five
 * languages. Two reasons that cannot change: the promise is already public, and a
 * paywall in an AGPL client is unenforceable anyway, since any fork can delete the
 * check in a minute and be entirely within its rights. So what a founder buys is the
 * things a fork cannot copy: recognition, access, influence, and the work continuing.
 */

export interface FoundersData {
    /** Memberships taken, read from the Razorpay dashboard by a human. */
    claimed: number;
    /** Size of the founding cohort. */
    total: number;
    /** ISO date the `claimed` figure was last checked. Always shown to the reader. */
    asOf: string;
    /** Price in whole rupees. */
    priceInr: number;
}

export const FOUNDERS: FoundersData = {
    claimed: 0,
    total: 1000,
    asOf: '2026-09-03',
    priceInr: 2499,
};

/** What a founder actually gets. Deliverable without accounts, and safe from a fork. */
export const FOUNDER_BENEFITS: string[] = [
    'Founder badge and your name in the credits, permanently',
    'Early access to new features before they ship',
    'A vote on what gets built next',
    'The private founder community',
    'Direct line to the people building it',
];

/** Remaining, floored at zero so a miscounted `claimed` cannot render a negative. */
export const foundersRemaining = (d: FoundersData = FOUNDERS): number =>
    Math.max(0, d.total - d.claimed);

/** True once the cohort is full, so the page can stop offering to sell it. */
export const foundersSoldOut = (d: FoundersData = FOUNDERS): boolean =>
    foundersRemaining(d) === 0;

/**
 * The `asOf` date in a human form ("3 September 2026").
 *
 * Falls back to the raw string rather than throwing or printing "Invalid Date": a
 * mistyped date in this file should degrade to something readable, not break the page.
 */
export const foundersAsOfLabel = (d: FoundersData = FOUNDERS): string => {
    const parsed = new Date(`${d.asOf}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return d.asOf;
    return parsed.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
    });
};
