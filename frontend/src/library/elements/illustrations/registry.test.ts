import { describe, it, expect, beforeEach } from "bun:test";
import {
    searchIllustrations, getIllustration, illustrationUrl, loadIllustrationSvg,
    clearIllustrationCache, MAX_ILLUSTRATION_HITS,
} from "./registry";
import { ILLUSTRATION_INDEX, ILLUSTRATION_DIR } from "./index-data";

describe("illustration index", () => {
    it("ships well over a thousand entries with unique ids", () => {
        expect(ILLUSTRATION_INDEX.length).toBeGreaterThan(1000);
        expect(new Set(ILLUSTRATION_INDEX.map(r => r[0])).size).toBe(ILLUSTRATION_INDEX.length);
    });
});

describe("searchIllustrations", () => {
    it("returns nothing for an empty query", () => {
        expect(searchIllustrations([])).toEqual([]);
        expect(searchIllustrations(["  "])).toEqual([]);
    });

    it("ranks an exact name match first", () => {
        expect(searchIllustrations(["rocket"])[0].id).toBe("rocket");
    });

    it("matches multi-word names against space-free tokens", () => {
        // Alias tokens are normalized without spaces ("creditcard"); names are not.
        expect(searchIllustrations(["creditcard"]).map(a => a.id)).toContain("credit-card");
    });

    it("finds entries by keyword when the name does not match", () => {
        const ids = searchIllustrations(["developer"]).map(a => a.id);
        expect(ids).toContain("man-technologist");
    });

    it("ranks direct-query matches ahead of alias-only matches", () => {
        // "heart" is the query; "rocket" arrives only as an alias token.
        const ids = searchIllustrations(["heart", "rocket"], 500).map(a => a.id);
        expect(ids.indexOf("red-heart")).toBeGreaterThanOrEqual(0);
        expect(ids.indexOf("rocket")).toBeGreaterThan(ids.indexOf("red-heart"));
    });

    it("caps results so a broad query cannot flood the grid", () => {
        const hits = searchIllustrations(["e"]);
        expect(hits.length).toBe(MAX_ILLUSTRATION_HITS);
    });

    it("does not return the same illustration twice across tokens", () => {
        const ids = searchIllustrations(["heart", "love", "red"], 500).map(a => a.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});

describe("illustrationUrl / getIllustration", () => {
    it("builds a versioned static URL under the given base", () => {
        expect(illustrationUrl("rocket", "/")).toBe(`/${ILLUSTRATION_DIR}/rocket.svg`);
        expect(illustrationUrl("rocket", "./")).toBe(`./${ILLUSTRATION_DIR}/rocket.svg`);
    });

    it("looks entries up by id", () => {
        expect(getIllustration("rocket")?.name).toBe("Rocket");
        expect(getIllustration("no-such-thing")).toBeUndefined();
    });
});

describe("loadIllustrationSvg", () => {
    beforeEach(() => clearIllustrationCache());

    const svg = '<svg viewBox="0 0 32 32"><path d="M0 0h32v32z"/></svg>';

    it("fetches once and serves repeats from cache", async () => {
        let calls = 0;
        const fetcher = async () => { calls++; return new Response(svg, { status: 200 }); };
        expect(await loadIllustrationSvg("rocket", fetcher)).toBe(svg);
        expect(await loadIllustrationSvg("rocket", fetcher)).toBe(svg);
        expect(calls).toBe(1);
    });

    it("rejects on a non-OK response and does not cache the failure", async () => {
        let ok = false;
        const fetcher = async () => ok ? new Response(svg, { status: 200 }) : new Response("nope", { status: 404 });
        await expect(loadIllustrationSvg("rocket", fetcher)).rejects.toThrow(/404/);
        ok = true;
        expect(await loadIllustrationSvg("rocket", fetcher)).toBe(svg);
    });

    it("rejects a body that is not an SVG (e.g. an HTML fallback page)", async () => {
        const fetcher = async () => new Response("<!doctype html><html></html>", { status: 200 });
        await expect(loadIllustrationSvg("rocket", fetcher)).rejects.toThrow(/not an SVG/);
    });

    it("rejects an unknown id without fetching", async () => {
        let calls = 0;
        const fetcher = async () => { calls++; return new Response(svg); };
        await expect(loadIllustrationSvg("no-such-thing", fetcher)).rejects.toThrow(/Unknown illustration/);
        expect(calls).toBe(0);
    });
});
