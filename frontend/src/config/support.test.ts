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
import { __testing } from "./support";

const { isSafeSupportUrl } = __testing;

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
