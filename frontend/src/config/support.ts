/**
 * "Support YappyDraw" links.
 *
 * YappyDraw's production deploy is a *static* site — there is no server in the
 * shipped build (`backend/` is a local dev file-store and is not deployed, nor is
 * it in the OSS mirror). That rules out Razorpay's Standard Checkout, which needs
 * a server to create an Order and to verify the payment signature with the account's
 * `key_secret`. A secret must never reach a Vite bundle.
 *
 * So this is deliberately the least-integrated option that works: **plain links**
 * out to payment pages that the provider hosts, opened in a new tab. No third-party
 * script in the editor, nothing for the service worker to choke on when the app
 * cold-loads offline, no CSP surface, and the "nothing leaves your computer" promise
 * stays literally true — a link is a link until the user clicks it.
 *
 * Everything here is publishable by design. A Razorpay Payment Page URL and a GitHub
 * Sponsors handle are meant to be public; that is why they can sit in a client bundle
 * and in the public mirror. **Never put a `key_secret` or any API key in this file.**
 *
 * **No URL is committed here, on purpose.** The links come only from the build
 * environment (`VITE_SUPPORT_RAZORPAY_URL`, `VITE_SUPPORT_GITHUB_URL`), set on the
 * deployment host and in a local gitignored `.env`. They are not secrets — a payment
 * page is public — but a fork building from the OSS mirror must not ship a Support
 * button that pays *us*, and a hardcoded default would do exactly that.
 *
 * The consequence to know: **an unset variable means the feature is absent, not
 * broken.** If the Support entry is missing from a deployed build, the host is not
 * passing the variable through to `vite build`; check that before looking anywhere else.
 * A link with no URL is simply not shown, and when none are configured the whole
 * feature — menu item, command, dialog — disappears rather than offering a dead end.
 */

/** Hosts a support link is allowed to point at, so a bad env value can't redirect users anywhere. */
const ALLOWED_HOSTS = [
    'razorpay.com',
    'razorpay.me',
    'pages.razorpay.com',
    'rzp.io',
    'github.com',
];

export interface SupportLink {
    id: string;
    /** i18n key for the button label, under `support.*`. */
    labelKey: 'support.razorpay' | 'support.github' | 'support.founders';
    /** i18n key for the one-line note under the button. */
    noteKey: 'support.razorpayNote' | 'support.githubNote' | 'support.foundersNote';
    url: string;
    /** Drawn as the primary option. At most one link should set this. */
    primary?: boolean;
}

/**
 * True for an `https://` URL on one of ALLOWED_HOSTS.
 *
 * These URLs go straight into an anchor's `href`, so they are validated rather than
 * trusted: an empty or malformed value drops the link instead of rendering
 * `href="undefined"`, and the scheme check means a `javascript:` value from a
 * mis-set env var can never become a clickable link in the editor.
 */
function isSafeSupportUrl(raw: string): boolean {
    if (!raw) return false;
    let parsed: URL;
    try {
        parsed = new URL(raw);
    } catch {
        return false;
    }
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

/**
 * The Razorpay Payment Page / payment link.
 *
 * Create it in the Razorpay Dashboard (Payment Pages, or a `razorpay.me` handle) with
 * an amount field of type "Customers Decide Amount" so people can choose what to give.
 * Note Razorpay is INR-first: international cards need International Payments enabled
 * on the account, and a Payment Page carries a single currency — which is exactly why
 * the GitHub Sponsors link below exists alongside it.
 */
const RAZORPAY_URL: string = import.meta.env.VITE_SUPPORT_RAZORPAY_URL ?? '';

/**
 * GitHub Sponsors — the option that works for the majority of readers, who are not in
 * India. Requires a sponsors profile to be set up and approved on the account first;
 * until then `github.com/sponsors/<user>` just redirects to the profile, so leaving
 * this empty is the honest state rather than shipping a link that goes nowhere useful.
 */
const GITHUB_URL: string = import.meta.env.VITE_SUPPORT_GITHUB_URL ?? '';
// (empty until a GitHub Sponsors profile exists — `github.com/sponsors/rajeshpillai`
//  currently redirects to the plain profile, so a link there would go nowhere useful.)

/**
 * The Founding Supporter checkout, which is a DIFFERENT Razorpay product from the
 * general Support link above and must not be the same URL.
 *
 * `razorpay.me` is a pay-me link: it takes an amount and little else. A **Payment Page**
 * can carry a fixed price and custom input fields, and its monthly CSV export includes
 * email, phone and every custom field the payer filled in. Running a founder community
 * means knowing who the founders are and how to reach them, so the page has to be the
 * Payment Page: create one at a fixed price with fields for a preferred name for the
 * credits and a contact handle.
 */
const FOUNDERS_CHECKOUT_URL: string = import.meta.env.VITE_SUPPORT_FOUNDERS_URL ?? '';

/**
 * Same-origin, so it is not an external payment URL and needs no host check.
 *
 * DEV GOTCHA: `/founders/` is a *prerendered* page, written to `dist/` by
 * `scripts/prerender.ts` at build time. The Vite dev server does not run the
 * prerenderer, so in `npm run dev` this path falls through the SPA router to the
 * editor and the link appears to do nothing useful. That is dev-only and expected;
 * `/learn/` behaves the same way. To see the real page, run a build and serve
 * `dist/`. Production is correct: the host serves `dist/founders/index.html`
 * directly and the SPA never loads.
 */
const FOUNDERS_PATH = '/founders/';

/** True when a founders checkout is configured, so the page can offer to sell. */
export function hasFoundersCheckout(): boolean {
    return isSafeSupportUrl(FOUNDERS_CHECKOUT_URL);
}

/** The configured, validated links, in the order they are shown. */
export const SUPPORT_LINKS: SupportLink[] = [
    ...(hasFoundersCheckout()
        ? [{
            id: 'founders', labelKey: 'support.founders', noteKey: 'support.foundersNote',
            url: FOUNDERS_PATH, primary: true,
        } as SupportLink]
        : []),
    ...([
        { id: 'razorpay', labelKey: 'support.razorpay', noteKey: 'support.razorpayNote', url: RAZORPAY_URL },
        { id: 'github', labelKey: 'support.github', noteKey: 'support.githubNote', url: GITHUB_URL },
    ] as SupportLink[]).filter((link) => isSafeSupportUrl(link.url)),
];

/** False when nothing is configured — the caller then hides the entry point entirely. */
export function hasSupportLinks(): boolean {
    return SUPPORT_LINKS.length > 0;
}

/** Exported for the unit test; not part of the public surface. */
export const __testing = { isSafeSupportUrl, ALLOWED_HOSTS };
