/**
 * The Markdown renderer's contract is not "valid HTML" — it is "the HTML
 * `help-page.css` already styles". 31 documents share one stylesheet, and there
 * is no appetite for restyling them, so every class the JSX emitted has to come
 * out of the renderer unchanged. These tests pin those classes.
 */

import { describe, it, expect } from "bun:test";
import { renderHelpDoc, parseFrontMatter, slugifyHeading } from "./markdown";

const FM = `---
id: test-doc
name: Test Doc
icon: "⬜"
category: Shapes
description: A document used by the renderer tests
---
`;

const render = (body: string) => renderHelpDoc(`${FM}# Test Doc Title\n\n${body}`, "test.md");

describe("front matter", () => {
    it("reads key: value pairs and strips quotes", () => {
        const { meta, body } = parseFrontMatter(`---\nid: a\nname: "B c"\n---\n# T\n`);
        expect(meta).toEqual({ id: "a", name: "B c" });
        expect(body).toBe("# T\n");
    });

    it("returns the source untouched when there is no front matter", () => {
        const { meta, body } = parseFrontMatter("# Title\n");
        expect(meta).toEqual({});
        expect(body).toBe("# Title\n");
    });

    it("refuses a document missing required metadata", () => {
        expect(() => renderHelpDoc("---\nid: x\n---\n# T\n", "bad.md")).toThrow(/missing name, icon/);
    });

    it("refuses a document with no title", () => {
        expect(() => renderHelpDoc(`${FM}Just prose, no heading.\n`, "bad.md"))
            .toThrow(/must start with a single "# Title"/);
    });
});

describe("document skeleton", () => {
    const html = render(`Intro paragraph.

## First Section

Body text.

## Second Section

More text.
`).html;

    it("emits NO .doc-container — the caller supplies it", () => {
        // The SPA sets this string as the innerHTML of its own .doc-container,
        // so emitting one here would nest a second div inside the first and stop
        // matching the DOM the JSX version produced.
        expect(html).not.toContain('class="doc-container"');
        expect(html.startsWith('<header class="doc-header">')).toBe(true);
    });

    it("puts the title and intro in .doc-header / .doc-intro", () => {
        expect(html).toContain('<header class="doc-header"><h1>Test Doc Title</h1>');
        expect(html).toContain('<p class="doc-intro">Intro paragraph.</p>');
    });

    it("turns each ## into its own .doc-section", () => {
        const sections = html.match(/<section class="doc-section"/g) ?? [];
        expect(sections).toHaveLength(2);
        expect(html).toContain("<h2>First Section</h2>");
    });

    it("gives every section a slug id, for in-page anchors", () => {
        expect(html).toContain('<section class="doc-section" id="first-section">');
        expect(html).toContain('<section class="doc-section" id="second-section">');
    });

    it("reports the headings for the table of contents", () => {
        const { headings } = render(`Intro.\n\n## Circle / Ellipse\n\nText.\n`);
        expect(headings).toEqual([{ id: "circle-ellipse", text: "Circle / Ellipse" }]);
    });
});

describe("styled elements", () => {
    it("gives tables the .api-table class", () => {
        const { html } = render(`Intro.

## Props

| Property | Description |
| --- | --- |
| **Roundness** | Round all four corners |
`);
        expect(html).toContain('<table class="api-table">');
        expect(html).toContain("<th>Property</th>");
        expect(html).toContain("<td><strong>Roundness</strong></td>");
    });

    it("gives fenced code the .code-block class and escapes its contents", () => {
        const { html } = render("Intro.\n\n## API\n\n```\nYappy.createRectangle(40, 40);\n```\n");
        expect(html).toContain('<pre class="code-block"><code>');
        expect(html).toContain("Yappy.createRectangle(40, 40);");
    });

    it("escapes HTML inside code samples rather than rendering it", () => {
        // The embedding doc's samples are full of <iframe> and <script>. If those
        // reached the DOM as markup the help page would try to execute them.
        const { html } = render('Intro.\n\n## Embed\n\n```\n<iframe src="x"></iframe>\n```\n');
        expect(html).toContain("&lt;iframe");
        expect(html).not.toContain("<iframe");
    });

    it("gives inline code the .code-inline class", () => {
        const { html } = render("Intro.\n\n## X\n\nUse `borderRadius` here.\n");
        expect(html).toContain('<code class="code-inline">borderRadius</code>');
    });

    it("escapes markup inside inline code", () => {
        // marked hands the renderer the RAW backtick contents and escapes only
        // in its default renderer, so a custom one must do it — otherwise
        // `<div>` in inline code becomes a real element on the page.
        const { html } = render("Intro.\n\n## X\n\nUse `<div>` here.\n");
        expect(html).toContain('<code class="code-inline">&lt;div&gt;</code>');
    });

    it("escapes ampersands in inline code without double-escaping", () => {
        const { html } = render("Intro.\n\n## X\n\nUse `a && b` here.\n");
        expect(html).toContain('<code class="code-inline">a &amp;&amp; b</code>');
        expect(html).not.toContain("&amp;amp;amp;");
    });

    it("passes raw HTML through, for the kbd spans", () => {
        const { html } = render('Intro.\n\n## X\n\nHold <span class="kbd">Shift</span> while drawing.\n');
        expect(html).toContain('<span class="kbd">Shift</span>');
    });
});

describe("admonitions", () => {
    it("renders :::tip with a title as a .tip-box with an h5", () => {
        const { html } = render(`Intro.

## X

:::tip Quick Squares
Hold <span class="kbd">Shift</span> to constrain to a square.
:::
`);
        expect(html).toContain('<div class="tip-box"><h5>Quick Squares</h5>');
        expect(html).toContain('<span class="kbd">Shift</span>');
    });

    it("renders a titleless tip without an empty heading", () => {
        const { html } = render("Intro.\n\n## X\n\n:::tip\nJust a note.\n:::\n");
        expect(html).toContain('<div class="tip-box"><p>');
        expect(html).not.toContain("<h5></h5>");
    });

    it("maps warning and note onto their own classes", () => {
        expect(render("Intro.\n\n## X\n\n:::warning W\nCareful.\n:::\n").html)
            .toContain('<div class="tip-box warning"><h5>W</h5>');
        expect(render("Intro.\n\n## X\n\n:::note N\nAside.\n:::\n").html)
            .toContain('<div class="tip-box doc-note"><h5>N</h5>');
    });

    it("renders Markdown INSIDE a box — tips contain tables and lists", () => {
        const { html } = render(`Intro.

## X

:::tip Has a list
- first
- second
:::
`);
        expect(html).toContain("<li>first</li>");
    });

    it("refuses an unclosed box rather than swallowing the rest of the page", () => {
        expect(() => render("Intro.\n\n## X\n\n:::tip Oops\nNo closing fence.\n")).toThrow(/Unclosed/);
    });
});

describe("section splitting is token-based, not text-based", () => {
    it("does not treat a ## inside a code fence as a heading", () => {
        // Slicing rendered HTML on `<h2>` would work; slicing the SOURCE on `## `
        // would split this document in two. The lexer knows the difference.
        const { html, headings } = render("Intro.\n\n## Real\n\n```\n## not a heading\n```\n");
        expect(headings).toHaveLength(1);
        expect((html.match(/<section class="doc-section"/g) ?? [])).toHaveLength(1);
        expect(html).toContain("## not a heading");
    });
});

describe("slugifyHeading", () => {
    it("lowercases and collapses punctuation", () => {
        expect(slugifyHeading("Circle / Ellipse")).toBe("circle-ellipse");
        expect(slugifyHeading("Independent corners")).toBe("independent-corners");
        expect(slugifyHeading("Corner ↖ ↗")).toBe("corner");
    });
});

describe("shortcuts grid", () => {
    const { html } = render(`Intro.

## Keyboard Shortcuts

:::shortcuts
Shift + Drag | Constrain proportions
S | Cycle stroke style
:::
`);

    it("emits the grid and item classes the stylesheet expects", () => {
        expect(html).toContain('<div class="shortcuts-grid">');
        expect((html.match(/<div class="shortcut-item">/g) ?? [])).toHaveLength(2);
        expect(html).toContain('<span class="shortcut-desc">Constrain proportions</span>');
    });

    it("splits a combo into one keycap per key, joined by +", () => {
        expect(html).toContain(
            '<div class="shortcut-keys"><span class="kbd">Shift</span> + <span class="kbd">Drag</span></div>',
        );
    });

    it("handles a single key with no combo", () => {
        expect(html).toContain('<div class="shortcut-keys"><span class="kbd">S</span></div>');
    });

    it("refuses a row missing its description separator", () => {
        expect(() => render("Intro.\n\n## X\n\n:::shortcuts\nShift+Drag no pipe\n:::\n"))
            .toThrow(/Bad :::shortcuts row/);
    });
});

describe("kbd normalisation", () => {
    it("rewrites <kbd> to the .kbd span the stylesheet targets", () => {
        const { html } = render("Intro.\n\n## X\n\nHold <kbd>Shift</kbd> while drawing.\n");
        expect(html).toContain('<span class="kbd">Shift</span>');
        expect(html).not.toContain("<kbd>");
    });

    it("leaves a <kbd> shown INSIDE a code sample alone", () => {
        // Code blocks are entity-escaped before this pass, so an example of the
        // markup itself must survive as text rather than becoming an element.
        const { html } = render("Intro.\n\n## X\n\n```\n<kbd>Shift</kbd>\n```\n");
        expect(html).toContain("&lt;kbd&gt;Shift&lt;/kbd&gt;");
        expect(html).not.toContain('<span class="kbd">Shift</span>');
    });
});

describe("shortcut separators", () => {
    it("keeps the separator the document wrote — + is a chord, `or` is a choice", () => {
        // "R or 2" and "A / B" are alternatives, not chords. Normalising every
        // separator to "+" would claim a key combination that does not exist.
        const { html } = render(
            "Intro.\n\n## X\n\n:::shortcuts\nR or 2 | Rectangle\nCtrl + Z | Undo\nA / B | Either\n:::\n",
        );
        expect(html).toContain('<span class="kbd">R</span> or <span class="kbd">2</span>');
        expect(html).toContain('<span class="kbd">Ctrl</span> + <span class="kbd">Z</span>');
        expect(html).toContain('<span class="kbd">A</span> / <span class="kbd">B</span>');
    });

    it("does not split a key whose NAME contains the separator word", () => {
        const { html } = render("Intro.\n\n## X\n\n:::shortcuts\nDouble-click | Edit\n:::\n");
        expect(html).toContain('<span class="kbd">Double-click</span>');
    });
});

describe("feature cards", () => {
    const { html } = render(`Intro.

## Key Features

:::cards
40+ Presets | Entrance, exit and emphasis animations
**Keyframes** | Custom animations with `+ '`precise`' + ` control
:::
`);

    it("emits the grid and card classes the stylesheet expects", () => {
        expect(html).toContain('<div class="feature-grid">');
        expect((html.match(/<div class="feature-card">/g) ?? [])).toHaveLength(2);
        expect(html).toContain("<h4>40+ Presets</h4>");
        expect(html).toContain("<p>Entrance, exit and emphasis animations</p>");
    });

    it("parses Markdown in BOTH halves — unlike shortcuts, both are prose", () => {
        expect(html).toContain("<h4><strong>Keyframes</strong></h4>");
        expect(html).toContain('<code class="code-inline">precise</code>');
    });

    it("refuses a row missing its description separator", () => {
        expect(() => render("Intro.\n\n## X\n\n:::cards\nNo pipe here\n:::\n"))
            .toThrow(/Bad :::cards row/);
    });
});
