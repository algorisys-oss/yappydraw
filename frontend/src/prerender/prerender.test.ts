/**
 * The prerendered pages — the half of the site a crawler actually reads.
 *
 * These assertions are the ones whose failure is invisible in a browser: a
 * canonical pointing at the wrong URL, a page that quietly pulls the editor
 * bundle, an unescaped title breaking the head, a sitemap listing a URL that is
 * not published. All of them look fine on screen.
 */

import { describe, it, expect } from "bun:test";
import { metaFor, SOFTWARE_LD } from "./meta";
import { buildPage, esc } from "./page";
import { buildSitemap, readHelpDocs, readArticles } from "./render";
import { parsePath, SITE } from "../routes";

const DOC = {
    id: "uml",
    name: "UML",
    icon: "📐",
    category: "Diagrams",
    description: "UML shapes for class, sequence, and state diagrams",
};

const page = (overrides: Partial<Parameters<typeof buildPage>[0]> = {}) =>
    buildPage({
        meta: metaFor("helpDoc", DOC),
        cssHref: "/assets/helpdoc-abc123.css",
        nav: [{ id: "uml", name: "UML", icon: "📐", category: "Diagrams", href: "/help/uml/" }],
        activeId: "uml",
        heading: "Yappy Documentation",
        body: "<header class=\"doc-header\"><h1>UML Shapes</h1></header>",
        ...overrides,
    });

describe("page metadata", () => {
    it("gives every page a self-referencing canonical", () => {
        expect(metaFor("helpDoc", DOC).canonical).toBe(`${SITE}/help/uml/`);
        expect(metaFor("help").canonical).toBe(`${SITE}/help/`);
        expect(metaFor("examples").canonical).toBe(`${SITE}/examples/`);
    });

    it("prefers the front matter's search-facing title over the sidebar label", () => {
        const withSeo = { ...DOC, seoTitle: "How to draw UML diagrams online" };
        expect(metaFor("helpDoc", withSeo).title).toBe("How to draw UML diagrams online");
        expect(metaFor("helpDoc", DOC).title).toBe("UML — YappyDraw documentation");
    });

    it("does not run two sentences together when it appends the boilerplate", () => {
        // The sidebar descriptions are labels; most do not end in a full stop.
        expect(metaFor("helpDoc", DOC).description).toContain("diagrams. Free, in your browser");
    });

    it("keeps the description inside what a search result shows", () => {
        const long = { ...DOC, description: "word ".repeat(80) };
        expect(metaFor("helpDoc", long).description.length).toBeLessThanOrEqual(158);
    });

    it("emits a breadcrumb trail that ends on the page itself", () => {
        const crumbs = metaFor("helpDoc", DOC).jsonLd.find((b) => b["@type"] === "BreadcrumbList") as any;
        expect(crumbs.itemListElement.map((i: any) => i.item)).toEqual([
            `${SITE}/`,
            `${SITE}/help/`,
            `${SITE}/help/uml/`,
        ]);
    });

    it("describes the app itself on the documentation index", () => {
        expect(metaFor("help").jsonLd).toContain(SOFTWARE_LD);
    });

    it("refuses a route it does not publish, rather than inventing a head for it", () => {
        expect(() => metaFor("example")).toThrow(/not prerendered/);
        expect(() => metaFor("helpDoc")).toThrow(/needs the document metadata/);
    });
});

describe("page shell", () => {
    it("ships NO application bundle — that is the entire point of the page", () => {
        const html = page();
        expect(html).not.toContain("/assets/index-");
        expect(html).not.toContain("type=\"module\"");
        expect(html).not.toContain("src/index.tsx");
    });

    it("puts the prose in the initial response", () => {
        expect(page()).toContain("<h1>UML Shapes</h1>");
    });

    it("carries exactly one h1 — the document's own", () => {
        expect((page().match(/<h1[ >]/g) ?? [])).toHaveLength(1);
    });

    it("links every sibling document, so the section is crawlable without JS", () => {
        const html = page({
            nav: [
                { id: "uml", name: "UML", icon: "📐", category: "Diagrams", href: "/help/uml/" },
                { id: "bpmn", name: "BPMN", icon: "🔀", category: "Diagrams", href: "/help/bpmn/" },
            ],
        });
        expect(html).toContain('href="/help/bpmn/"');
        expect(html).toContain('class="shape-item active"');
    });

    it("escapes a title that would otherwise break out of the head", () => {
        const html = page({
            meta: { ...metaFor("helpDoc", DOC), title: 'Quote " and <script>alert(1)</script>' },
        });
        expect(html).toContain("&quot;");
        expect(html).not.toContain("<script>alert(1)</script>");
    });

    it("escapes `</` inside JSON-LD, which is script CONTENT, not markup", () => {
        const html = page({
            meta: { ...metaFor("helpDoc", DOC), jsonLd: [{ name: "</script><script>alert(1)</script>" }] },
        });
        expect(html).not.toContain("</script><script>alert(1)");
        expect(html).toContain("\\u003c/script");
    });
});

describe("sitemap", () => {
    it("lists each URL once, with its own lastmod", () => {
        const xml = buildSitemap([
            { url: `${SITE}/help/uml/`, lastmod: "2026-08-01", changefreq: "monthly", priority: "0.8" },
            { url: `${SITE}/help/bpmn/`, lastmod: "2026-08-20", changefreq: "monthly", priority: "0.8" },
        ]);
        expect((xml.match(/<loc>/g) ?? [])).toHaveLength(2);
        expect(xml).toContain("<lastmod>2026-08-01</lastmod>");
        expect(xml).toContain("<lastmod>2026-08-20</lastmod>");
    });
});

describe("the real content", () => {
    it("renders every registered help document", async () => {
        const docs = await readHelpDocs();
        expect(docs.length).toBeGreaterThanOrEqual(31);
        for (const doc of docs) {
            expect(doc.meta.id).toBeTruthy();
            expect(doc.html.length).toBeGreaterThan(500);
        }
    });

    it("publishes every document at a URL the router can parse back", async () => {
        const docs = await readHelpDocs();
        for (const doc of docs) {
            expect(parsePath(`/help/${doc.meta.id}/`)).toEqual({ key: "helpDoc", param: doc.meta.id });
        }
    });

    it("renders the long-form articles", async () => {
        const articles = await readArticles();
        expect(articles.length).toBeGreaterThanOrEqual(1);
        expect(articles[0].html).toContain("doc-section");
    });

    it("escapes text for the index tables", () => {
        expect(esc("Bulk Editing & Selection")).toBe("Bulk Editing &amp; Selection");
    });
});
