/**
 * The URL table — parsing, building, and the legacy-hash shim.
 *
 * The shim is the part with teeth: `#/help/uml` links are in bookmarks, in
 * chat history and in other people's pages, and a mapping that quietly returns
 * null for one of them is a dead link nobody reports.
 */

import { describe, it, expect } from "bun:test";
import { parsePath, pathFor, urlFor, hashRedirect, SITE } from "./routes";

describe("parsePath", () => {
    it("reads the section pages", () => {
        expect(parsePath("/")).toEqual({ key: "home" });
        expect(parsePath("/help/")).toEqual({ key: "help" });
        expect(parsePath("/examples/")).toEqual({ key: "examples" });
        expect(parsePath("/learn/")).toEqual({ key: "learn" });
    });

    it("reads a document, example or article id", () => {
        expect(parsePath("/help/uml/")).toEqual({ key: "helpDoc", param: "uml" });
        expect(parsePath("/examples/flow-chart/")).toEqual({ key: "example", param: "flow-chart" });
        expect(parsePath("/learn/learn-to-draw-diagrams/")).toEqual({
            key: "learnArticle",
            param: "learn-to-draw-diagrams",
        });
    });

    it("does not care about the trailing slash", () => {
        expect(parsePath("/help")).toEqual({ key: "help" });
        expect(parsePath("/help/uml")).toEqual({ key: "helpDoc", param: "uml" });
    });

    it("returns null for anything unknown, so the caller can serve a real 404", () => {
        // A soft 404 — rendering the home page at a wrong URL — is worse than a
        // 404: it gets indexed as a duplicate of the home page.
        expect(parsePath("/nope/")).toBeNull();
        expect(parsePath("/help/uml/extra/")).toBeNull();
        expect(parsePath("/help/../secret")).toBeNull();
    });

    it("decodes a percent-encoded segment before matching", () => {
        expect(parsePath("/help/vector%2Dpaths/")).toEqual({ key: "helpDoc", param: "vector-paths" });
    });
});

describe("pathFor / urlFor", () => {
    it("ends every page path in a slash — pages are written as <path>/index.html", () => {
        expect(pathFor("help")).toBe("/help/");
        expect(pathFor("helpDoc", "uml")).toBe("/help/uml/");
        expect(pathFor("home")).toBe("/");
    });

    it("round-trips with the parser", () => {
        for (const [key, param] of [
            ["home", undefined],
            ["help", undefined],
            ["helpDoc", "basic-shapes"],
            ["examples", undefined],
            ["example", "mind-map-demo"],
            ["learn", undefined],
            ["learnArticle", "learn-to-draw-diagrams"],
        ] as const) {
            expect(parsePath(pathFor(key, param))).toEqual(
                param ? { key, param } : { key },
            );
        }
    });

    it("builds absolute URLs on the canonical origin", () => {
        expect(urlFor("helpDoc", "bpmn")).toBe(`${SITE}/help/bpmn/`);
    });
});

describe("hashRedirect", () => {
    it("maps every legacy shape that was ever linked", () => {
        expect(hashRedirect("#/help")).toBe("/help/");
        expect(hashRedirect("#help")).toBe("/help/");
        expect(hashRedirect("#/help/uml")).toBe("/help/uml/");
        expect(hashRedirect("#/examples")).toBe("/examples/");
        expect(hashRedirect("#examples")).toBe("/examples/");
        expect(hashRedirect("#/examples/flow-chart")).toBe("/examples/flow-chart/");
    });

    it("leaves embeds alone — they live in iframes we do not control", () => {
        expect(hashRedirect("#/embed/abc123")).toBeNull();
    });

    it("leaves the editor's own hash parameters alone", () => {
        expect(hashRedirect("#load=flow-chart.yappy")).toBeNull();
        expect(hashRedirect("#doc=my-sketch")).toBeNull();
        expect(hashRedirect("")).toBeNull();
        expect(hashRedirect("#")).toBeNull();
    });

    it("ignores a query string tacked onto the hash", () => {
        expect(hashRedirect("#/help/uml?from=email")).toBe("/help/uml/");
    });

    it("falls back to the section when the id is not one we would emit", () => {
        expect(hashRedirect("#/help/../etc")).toBe("/help/");
    });
});
