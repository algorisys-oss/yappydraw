/**
 * The support links go straight into an anchor's `href`, so the guard deciding which
 * ones render is the only security-relevant part of an otherwise inert feature.
 *
 * The sharpest cases here are the last two groups. A naive check — "does the URL contain
 * razorpay.me" — passes `https://razorpay.me.evil.com/pay`, and a scheme-blind check turns
 * a mis-set env var into a `javascript:` link inside the editor. Neither is hypothetical:
 * both are what an allowlist is *for*, so both are asserted rather than assumed.
 */
import { describe, it, expect } from "bun:test";
import { __testing, buildSupportLinks } from "./support";

const { isSafeSupportUrl, FOUNDERS_PATH } = __testing;

const PAGE = "https://pages.razorpay.com/yappydraw";
const DIRECT = "https://razorpay.me/@yappydraw";
const SPONSORS = "https://github.com/sponsors/rajeshpillai";
const ids = (links: { id: string }[]) => links.map((l) => l.id);

describe("isSafeSupportUrl", () => {
    it("accepts the payment hosts actually in use", () => {
        expect(isSafeSupportUrl("https://razorpay.me/@yappydraw")).toBe(true);
        expect(isSafeSupportUrl("https://pages.razorpay.com/yappydraw")).toBe(true);
        expect(isSafeSupportUrl("https://rzp.io/l/abc123")).toBe(true);
        expect(isSafeSupportUrl("https://github.com/sponsors/rajeshpillai")).toBe(true);
    });

    it("accepts a subdomain of an allowed host", () => {
        expect(isSafeSupportUrl("https://checkout.razorpay.com/x")).toBe(true);
    });

    it("drops an unset or malformed value rather than rendering href=\"undefined\"", () => {
        expect(isSafeSupportUrl("")).toBe(false);
        expect(isSafeSupportUrl("not a url")).toBe(false);
        expect(isSafeSupportUrl("razorpay.me/@yappydraw")).toBe(false); // no scheme
    });

    it("rejects any scheme but https, so a bad env var cannot become a script link", () => {
        expect(isSafeSupportUrl("javascript:alert(1)")).toBe(false);
        expect(isSafeSupportUrl("http://razorpay.me/@yappydraw")).toBe(false);
        expect(isSafeSupportUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    });

    it("rejects a host that merely looks like an allowed one", () => {
        expect(isSafeSupportUrl("https://razorpay.me.evil.com/pay")).toBe(false);
        expect(isSafeSupportUrl("https://evil-razorpay.com/pay")).toBe(false);
        expect(isSafeSupportUrl("https://notgithub.com/sponsors/x")).toBe(false);
    });
});

/**
 * There is ONE contribution, of any amount, and `/founders/` is the page that explains what
 * the amounts reach. Showing a direct Razorpay link beside it is two doors into the same
 * room, and the second one skips the explanation — so the direct link is a fallback only.
 * The rule is worth asserting because it is invisible: getting it wrong shows one link too
 * many rather than throwing.
 */
describe("buildSupportLinks", () => {
    it("sends people to the contribute page and hides the direct link behind it", () => {
        const links = buildSupportLinks(PAGE, DIRECT, SPONSORS);
        expect(ids(links)).toEqual(["founders", "github"]);
        expect(links[0].url).toBe(FOUNDERS_PATH);
    });

    it("falls back to the direct link when no contribute checkout is configured", () => {
        const links = buildSupportLinks("", DIRECT, SPONSORS);
        expect(ids(links)).toEqual(["razorpay", "github"]);
    });

    it("marks exactly one option primary, whichever one is offered", () => {
        for (const links of [
            buildSupportLinks(PAGE, DIRECT, SPONSORS),
            buildSupportLinks("", DIRECT, SPONSORS),
            buildSupportLinks("", "", SPONSORS),
        ]) {
            expect(links.filter((l) => l.primary).length).toBeLessThanOrEqual(1);
        }
    });

    it("drops an unsafe checkout rather than linking a page that cannot take payment", () => {
        // A mis-set var must not leave /founders/ linked with no way to pay at the end of it.
        expect(ids(buildSupportLinks("javascript:alert(1)", DIRECT, SPONSORS)))
            .toEqual(["razorpay", "github"]);
        expect(ids(buildSupportLinks("https://razorpay.me.evil.com/pay", "", SPONSORS)))
            .toEqual(["github"]);
    });

    it("returns nothing at all when nothing is configured, so the feature hides itself", () => {
        expect(buildSupportLinks("", "", "")).toEqual([]);
    });
});
