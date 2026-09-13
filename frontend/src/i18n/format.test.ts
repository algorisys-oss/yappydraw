/**
 * `parts()` — splitting a message so a token can render as an element.
 *
 * The reason this exists rather than concatenating three keys around a link: a translator
 * given fragments cannot move the link, and German puts it where English does not. So the
 * whole sentence stays one key and the component decides how to draw each token.
 *
 * The sharpest test here is the last one. `parts()` was ported from yappykit, which uses
 * `{name}`; this codebase uses `{{ name }}` because that is what `resolveTemplate` and
 * `plural()` consume. A verbatim port would have compiled, passed every obvious test, and
 * silently disagreed with `t()` about what a token is.
 */
import { describe, it, expect } from "bun:test";
import { parts, plural, formatFileSize } from "./format";

describe("parts", () => {
    it("splits text around a token", () => {
        expect(parts('See our {{ policy }} for details')).toEqual([
            { text: 'See our ' }, { token: 'policy' }, { text: ' for details' },
        ]);
    });

    it("returns a single text part when there is no token", () => {
        expect(parts('Nothing to interpolate')).toEqual([{ text: 'Nothing to interpolate' }]);
    });

    it("handles a token at the very start and the very end", () => {
        expect(parts('{{ a }} middle {{ b }}')).toEqual([
            { token: 'a' }, { text: ' middle ' }, { token: 'b' },
        ]);
    });

    it("handles a token that is the entire message", () => {
        expect(parts('{{ only }}')).toEqual([{ token: 'only' }]);
    });

    it("keeps adjacent tokens separate, with no empty text between them", () => {
        expect(parts('{{ a }}{{ b }}')).toEqual([{ token: 'a' }, { token: 'b' }]);
    });

    it("preserves word order — the whole point of the function", () => {
        // English puts the link late; German puts it mid-clause. Same key, both work.
        const en = parts('Read the {{ guide }} before you start');
        const de = parts('Lies vor dem Start {{ guide }} durch');
        expect(en.findIndex(p => 'token' in p)).toBe(1);
        expect(de.findIndex(p => 'token' in p)).toBe(1);
        expect(en.map(p => 'token' in p ? p.token : p.text)).toEqual(['Read the ', 'guide', ' before you start']);
        expect(de.map(p => 'token' in p ? p.token : p.text)).toEqual(['Lies vor dem Start ', 'guide', ' durch']);
    });

    it("is empty for an empty message", () => {
        expect(parts('')).toEqual([]);
    });

    it("tolerates whitespace variants inside the braces", () => {
        for (const tpl of ['{{name}}', '{{ name }}', '{{  name  }}']) {
            expect(parts(tpl)).toEqual([{ token: 'name' }]);
        }
    });

    it("leaves a single-brace {token} alone — that is yappykit's syntax, not ours", () => {
        // The regression a verbatim port would have introduced: this must NOT be a token,
        // because `t()`/resolveTemplate would not interpolate it either. The two have to
        // agree about what a token is, or a template works one way and not the other.
        expect(parts('Not a {token} here')).toEqual([{ text: 'Not a {token} here' }]);
    });

    it("agrees with plural() about token syntax", () => {
        // plural() replaces {{count}} — parts() must recognise the same shape as a token.
        expect(plural('en', 2, { one: '{{count}} item', other: '{{count}} items' })).toBe('2 items');
        expect(parts('{{count}} items')).toEqual([{ token: 'count' }, { text: ' items' }]);
    });
});

describe("formatFileSize", () => {
    it("shows whole kilobytes under a megabyte, never 0 KB", () => {
        expect(formatFileSize("en", 312 * 1024)).toBe("312 KB");
        expect(formatFileSize("en", 10)).toBe("1 KB");
    });

    it("shows binary megabytes to one decimal above, with the locale's separator", () => {
        expect(formatFileSize("en", 2 * 1024 * 1024)).toBe("2 MB");
        expect(formatFileSize("en", 1.26 * 1024 * 1024)).toBe("1.3 MB");
        expect(formatFileSize("de", 2.5 * 1024 * 1024)).toBe("2,5 MB");
    });
});
