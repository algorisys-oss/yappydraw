/**
 * Markdown → help-doc HTML.
 *
 * The 31 help documents are being moved from JSX to Markdown (plan §6/D3) for
 * three reasons at once: prose becomes translatable as *text* — you cannot hand
 * a translator a Solid component — it can be rendered to static HTML at build
 * time for SEO, and it stops being 14,184 lines of hand-maintained markup.
 *
 * The hard requirement is that the rendered HTML matches what the JSX produced,
 * because `help-page.css` styles those exact classes and there is no appetite
 * for restyling 31 documents. So this is not generic Markdown-to-HTML: it emits
 * the document skeleton the stylesheet already expects.
 *
 *   (container)        → supplied by the CALLER, see the note near the return
 *   # Title            → <header class="doc-header"><h1>…</h1>
 *   first paragraph    →   <p class="doc-intro">…</p></header>
 *   ## Heading         → <section class="doc-section"><h2>…</h2> … </section>
 *   | table |          → <table class="api-table">
 *   ```fence```        → <pre class="code-block"><code>
 *   `inline`           → <code class="code-inline">
 *   :::tip Title       → <div class="tip-box"><h5>Title</h5> … </div>
 *   :::shortcuts       → <div class="shortcuts-grid"> … </div>
 *   :::cards           → <div class="feature-grid"><div class="feature-card">…
 *   <kbd>Shift</kbd>   → <span class="kbd">Shift</span>
 *
 * This module is pure and runs at BUILD time (see vite-plugin-help-md.ts), so
 * `marked` is a devDependency and none of it reaches the browser — the app ships
 * plain HTML strings, which is strictly less JavaScript than the JSX components
 * it replaces.
 */

import { marked, type Token, type Tokens } from 'marked';

export interface DocMeta {
    id: string;
    name: string;
    icon: string;
    category: string;
    description: string;
    /** Extra search terms — tool names mentioned inside the page. */
    keywords?: string;
    /**
     * `internal: true` keeps a document in the repo but out of the published site.
     *
     * The value is the raw front-matter string, not a boolean — everything here is.
     */
    internal?: string;
    /**
     * Search-facing overrides for the prerendered page (plan §S4).
     *
     * `name`/`description` are written for the SIDEBAR — short, and phrased as
     * a label. A page title is read in a search result, where "UML" loses to
     * "How to draw a UML class diagram online". Set these where the two want to
     * say different things; the generated pair is used otherwise.
     */
    seoTitle?: string;
    seoDescription?: string;
}

export interface RenderedDoc {
    meta: DocMeta;
    html: string;
    /** `##` headings, in order — the in-page table of contents and anchor list. */
    headings: { id: string; text: string }[];
}

/** `:::tip Optional Title` … `:::` — the admonition boxes the docs lean on. */
const ADMONITION_OPEN = /^:::(tip|note|warning|shortcuts|cards)[ \t]*(.*)$/;

const KIND_CLASS: Record<string, string> = {
    tip: 'tip-box',
    note: 'tip-box doc-note',
    warning: 'tip-box warning',
};

/**
 * `keys | description` rows inside a `:::shortcuts` block.
 *
 * A dedicated construct rather than raw HTML because it keeps the two halves
 * structurally apart: the right column is prose a translator should render into
 * their language, the left is key bindings they must not touch (plan §3.3, D4).
 * Handing them `<div class="shortcut-keys"><span class="kbd">Shift</span>…` and
 * hoping would invert that.
 */
const renderShortcuts = (body: string[]): string => {
    const items = body
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const at = line.indexOf('|');
            if (at < 0) {
                throw new Error(`Bad :::shortcuts row (expected "keys | description"): ${line}`);
            }
            // Separators are preserved rather than normalised: the docs write
            // "Ctrl + ]" but also "R or 2" and "A / B", and flattening those
            // into a single joiner would claim a chord that does not exist.
            const keys = line
                .slice(0, at)
                .trim()
                .split(/\s*(\+|\/|\bor\b)\s*/)
                .map((part, i) =>
                    i % 2 === 1 ? ` ${part} ` : `<span class="kbd">${escapeHtml(part.trim())}</span>`,
                )
                .join('');
            const desc = marked.parseInline(line.slice(at + 1).trim(), { renderer: createRenderer() }) as string;
            return `<div class="shortcut-item"><div class="shortcut-keys">${keys}</div><span class="shortcut-desc">${desc}</span></div>`;
        })
        .join('');
    return `<div class="shortcuts-grid">${items}</div>`;
};

/**
 * `Title | Description` rows inside a `:::cards` block → the feature grid.
 *
 * `help-page.css` styles `.feature-grid`/`.feature-card`, and two documents use
 * it for their "what this does" summary. Both halves are prose, so unlike
 * `:::shortcuts` both are parsed as inline Markdown.
 */
const renderCards = (body: string[]): string => {
    const cards = body
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const at = line.indexOf('|');
            if (at < 0) {
                throw new Error(`Bad :::cards row (expected "title | description"): ${line}`);
            }
            const title = marked.parseInline(line.slice(0, at).trim(), { renderer: createRenderer() }) as string;
            const desc = marked.parseInline(line.slice(at + 1).trim(), { renderer: createRenderer() }) as string;
            return `<div class="feature-card"><h4>${title}</h4><p>${desc}</p></div>`;
        })
        .join('');
    return `<div class="feature-grid">${cards}</div>`;
};

/**
 * `<kbd>Shift</kbd>` → `<span class="kbd">Shift</span>`.
 *
 * Documents are authored with the standard HTML element, which is what a writer
 * or translator expects to see; the stylesheet targets `.kbd`, and rewriting
 * here avoids touching CSS that 31 documents depend on. Code samples are already
 * entity-escaped by this point, so a `<kbd>` shown *as an example* is untouched.
 */
const normalizeKbd = (html: string): string =>
    html.replace(/<kbd>/g, '<span class="kbd">').replace(/<\/kbd>/g, '</span>');

const escapeHtml = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * A `marked` renderer that adds the classes the stylesheet expects.
 *
 * Kept as a factory rather than a module-level singleton: `marked` renderers
 * carry parser state, and sharing one across the recursive admonition render
 * below would interleave two documents' output.
 */
const createRenderer = () => {
    const renderer = new marked.Renderer();

    renderer.table = function (token: Tokens.Table) {
        const header = token.header.map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`).join('');
        const body = token.rows
            .map((row) => `<tr>${row.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join('')}</tr>`)
            .join('');
        return `<table class="api-table"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
    };

    renderer.code = function (token: Tokens.Code) {
        return `<pre class="code-block"><code>${escapeHtml(token.text)}</code></pre>`;
    };

    renderer.codespan = function (token: Tokens.Codespan) {
        // `token.text` is the RAW source between the backticks — marked does the
        // escaping in its default renderer, which a custom one replaces. Without
        // this, `<div>` in inline code becomes a real element: 117 inline-code
        // spans across the docs, plenty of them markup.
        return `<code class="code-inline">${escapeHtml(token.text)}</code>`;
    };

    return renderer;
};

const renderTokens = (tokens: Token[]): string => {
    const renderer = createRenderer();
    // `marked.parser` needs the token list's `links` map; an empty one is
    // correct for a slice of a document that defines no reference links.
    const list = tokens as Token[] & { links: Record<string, { href: string; title?: string }> };
    if (!list.links) list.links = {};
    return marked.parser(list, { renderer, gfm: true });
};

/**
 * Turn `:::tip Title` … `:::` blocks into HTML before the lexer sees them.
 *
 * Done as a source-level pass rather than a `marked` extension because the body
 * of a box is itself Markdown — tables and lists appear inside tips — so it has
 * to be rendered recursively, and raw HTML then passes through the outer parse
 * untouched.
 */
const expandAdmonitions = (source: string): string => {
    const lines = source.split('\n');
    const out: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const open = ADMONITION_OPEN.exec(lines[i]);
        if (!open) {
            out.push(lines[i]);
            continue;
        }

        const [, kind, title] = open;
        const body: string[] = [];
        i++;
        while (i < lines.length && lines[i].trim() !== ':::') {
            body.push(lines[i]);
            i++;
        }
        if (i >= lines.length) {
            throw new Error(`Unclosed :::${kind} block — every admonition needs a closing ":::"`);
        }

        if (kind === 'shortcuts') {
            out.push(renderShortcuts(body));
            continue;
        }

        if (kind === 'cards') {
            out.push(renderCards(body));
            continue;
        }

        const heading = title.trim() ? `<h5>${escapeHtml(title.trim())}</h5>` : '';
        const inner = renderTokens(marked.lexer(expandAdmonitions(body.join('\n'))));
        out.push(`<div class="${KIND_CLASS[kind]}">${heading}${inner}</div>`);
    }

    return out.join('\n');
};

/** `Circle / Ellipse` → `circle-ellipse`, for in-page anchors. */
export const slugifyHeading = (text: string): string =>
    text
        .toLowerCase()
        .replace(/<[^>]+>/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

/**
 * Parse the leading `---` front-matter block.
 *
 * A deliberately small YAML subset — `key: value`, one per line — because the
 * only consumers are the six fields of `DocMeta`. Pulling in a YAML parser to
 * read six strings would be a dependency for nothing.
 */
export const parseFrontMatter = (source: string): { meta: Record<string, string>; body: string } => {
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
    if (!match) return { meta: {}, body: source };

    const meta: Record<string, string> = {};
    for (const line of match[1].split(/\r?\n/)) {
        if (!line.trim() || line.trimStart().startsWith('#')) continue;
        const at = line.indexOf(':');
        if (at < 0) throw new Error(`Bad front-matter line (expected "key: value"): ${line}`);
        const key = line.slice(0, at).trim();
        let value = line.slice(at + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        meta[key] = value;
    }
    return { meta, body: source.slice(match[0].length) };
};

const REQUIRED_META = ['id', 'name', 'icon', 'category', 'description'] as const;

/**
 * Render one help document.
 *
 * Sections are split from the token stream rather than by slicing the rendered
 * HTML: a `## ` inside a fenced code block is a code line, not a heading, and
 * only the lexer knows the difference.
 */
export const renderHelpDoc = (source: string, filename = '<doc>'): RenderedDoc => {
    const { meta, body } = parseFrontMatter(source);

    const missing = REQUIRED_META.filter((k) => !meta[k]);
    if (missing.length) {
        throw new Error(`${filename}: front-matter is missing ${missing.join(', ')}`);
    }

    const tokens = marked.lexer(expandAdmonitions(body));

    let title = '';
    let introTokens: Token[] = [];
    const sections: { heading: Tokens.Heading; tokens: Token[] }[] = [];
    let current: { heading: Tokens.Heading; tokens: Token[] } | null = null;
    let seenH1 = false;

    for (const token of tokens) {
        if (token.type === 'heading' && token.depth === 1 && !seenH1) {
            seenH1 = true;
            title = (token as Tokens.Heading).text;
            continue;
        }
        if (token.type === 'heading' && token.depth === 2) {
            current = { heading: token as Tokens.Heading, tokens: [] };
            sections.push(current);
            continue;
        }
        if (current) current.tokens.push(token);
        else if (token.type !== 'space') introTokens.push(token);
    }

    if (!title) throw new Error(`${filename}: document must start with a single "# Title" heading`);

    const headings = sections.map((s) => ({ id: slugifyHeading(s.heading.text), text: s.heading.text }));

    // The intro is the prose between the title and the first `##`. Rendered as a
    // single `.doc-intro` paragraph, matching what every JSX doc emitted.
    const introHtml = introTokens.length
        ? renderTokens(introTokens).replace(/^<p>/, '<p class="doc-intro">')
        : '';

    const renderer = createRenderer();
    const body_ = sections
        .map((s) => {
            const id = slugifyHeading(s.heading.text);
            const headingHtml = marked.parseInline(s.heading.text, { renderer }) as string;
            return `<section class="doc-section" id="${id}"><h2>${headingHtml}</h2>${renderTokens(s.tokens)}</section>`;
        })
        .join('');

    // NOTE: no `.doc-container` wrapper. Both consumers supply it — the SPA as
    // the element it sets `innerHTML` on, the Phase 2 prerenderer as part of the
    // page shell — so the SPA renders exactly the DOM the JSX version did,
    // without an extra nesting div, and the string is stored once.
    const html = normalizeKbd(
        `<header class="doc-header"><h1>${escapeHtml(title)}</h1>${introHtml}</header>` + body_,
    );

    return {
        meta: {
            id: meta.id,
            name: meta.name,
            icon: meta.icon,
            category: meta.category,
            description: meta.description,
            ...(meta.keywords ? { keywords: meta.keywords } : {}),
            // Must be carried through: this object is an allowlist, so a key absent here
            // is silently discarded no matter what the front matter says. `internal` was
            // added to a document, parsed correctly, and dropped exactly here — the page
            // published anyway and the flag looked like it simply did not work.
            ...(meta.internal ? { internal: meta.internal } : {}),
            ...(meta.seoTitle ? { seoTitle: meta.seoTitle } : {}),
            ...(meta.seoDescription ? { seoDescription: meta.seoDescription } : {}),
        },
        html,
        headings,
    };
};
