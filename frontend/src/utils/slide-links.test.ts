import { describe, it, expect } from "bun:test";
import { parseLink, normaliseLinkInput, targetSlideIndex, slideLink, actionLink } from "./slide-links";

describe("parseLink", () => {
    it("reads web addresses, slide links and show actions", () => {
        expect(parseLink('https://example.com/a?b=1')).toEqual({ kind: 'url', url: 'https://example.com/a?b=1' });
        expect(parseLink('mailto:me@example.com')).toEqual({ kind: 'url', url: 'mailto:me@example.com' });
        expect(parseLink('  www.example.com  ')).toEqual({ kind: 'url', url: 'https://www.example.com' });
        expect(parseLink('example.com/page#x')).toEqual({ kind: 'url', url: 'https://example.com/page#x' });
        expect(parseLink(slideLink('slide-42'))).toEqual({ kind: 'slide', slideId: 'slide-42' });
        expect(parseLink(actionLink('end'))).toEqual({ kind: 'action', action: 'end' });
        expect(parseLink('#NEXT')).toEqual({ kind: 'action', action: 'next' });
    });

    it("never follows script, data or file links, or junk", () => {
        for (const bad of ['javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html,<b>x', 'file:///etc/passwd',
            'vbscript:x', '#slide:', '#nowhere', 'not a link', '', null, undefined, 'javascript:alert(1)//example.com']) {
            expect(parseLink(bad as any)).toEqual({ kind: 'none' });
        }
    });
});

describe("normaliseLinkInput", () => {
    it("adds https to a bare host, clears on blank, refuses what can't be followed", () => {
        expect(normaliseLinkInput('www.yappydraw.com')).toBe('https://www.yappydraw.com');
        expect(normaliseLinkInput('  ')).toBe('');
        expect(normaliseLinkInput('javascript:alert(1)')).toBeNull();
        expect(normaliseLinkInput('#last')).toBe('#last');
    });
});

describe("targetSlideIndex", () => {
    const slides = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    it("resolves slide ids and actions, and stops at the ends", () => {
        expect(targetSlideIndex(parseLink('#slide:c'), 0, slides)).toBe(2);
        expect(targetSlideIndex(parseLink('#slide:gone'), 0, slides)).toBeNull();
        expect(targetSlideIndex(parseLink('#next'), 1, slides)).toBe(2);
        expect(targetSlideIndex(parseLink('#next'), 2, slides)).toBeNull();
        expect(targetSlideIndex(parseLink('#previous'), 0, slides)).toBeNull();
        expect(targetSlideIndex(parseLink('#first'), 2, slides)).toBe(0);
        expect(targetSlideIndex(parseLink('#last'), 0, slides)).toBe(2);
        expect(targetSlideIndex(parseLink('#end'), 0, slides)).toBeNull();
        expect(targetSlideIndex(parseLink('https://x.com'), 0, slides)).toBeNull();
    });
});
